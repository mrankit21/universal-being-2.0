/**
 * POST /api/bookings — Booking Engine + Phase 8 (Book Your Slot /
 * Remaining Payment Method / Booking Expiry Timer).
 *
 * Public endpoint (no admin permission needed) that the booking form
 * (`components/trip/booking-form.tsx`) submits to. Deliberately re-derives
 * everything money- and availability-related from MongoDB itself rather
 * than trusting the client:
 *   - the trip must exist and be published
 *   - the chosen departure must exist, be published, upcoming, and not
 *     sold-out/closed
 *   - seats are decremented with an atomic conditional update (`$elemMatch`
 *     with `seatsAvailable: { $gte: seatsBooked }` in the query filter) so
 *     two people booking the last seats at once can never both succeed —
 *     preventing overbooking without needing a multi-document transaction.
 *   - price is computed server-side via `computeBookingPricing` (which
 *     itself reads the trip's admin-configured, MongoDB-stored
 *     `price.bookingAmount` — Feature 1's "Book Your Slot Amount", never
 *     hardcoded), the same function the live client summary uses.
 *
 * Once the seat is reserved, this route also (Feature 3): starts a
 * config-driven countdown (`lib/config/booking-config.ts`), stores
 * `reservationStartedAt`/`reservationExpiresAt` on the booking, and — if
 * Razorpay is configured — creates a Razorpay order for the slot amount so
 * the client can open Checkout immediately. If payment never completes,
 * `lib/trip/booking-expiry.ts` releases the seat automatically (via lazy
 * checks on read, and the `/api/cron/expire-bookings` sweep) with no admin
 * action required.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { BookingModel, TripModel } from "@/lib/db/models";
import { bookingCreateSchema } from "@/lib/validators/booking.schema";
import { computeBookingPricing } from "@/lib/trip/booking-pricing";
import { toEntity } from "@/lib/api/db-mappers";
import { ok, created, fail, handleApiError } from "@/lib/api-helpers/respond";
import type { Trip, DepartureDate } from "@/types/trip";
import { getReservationExpiryMinutes, getReservationExpiryMs, DEFAULT_REMAINING_PAYMENT_METHOD } from "@/lib/config/booking-config";
import { createSlotReservationOrder } from "@/lib/payments/razorpay";
import { expireIfDue } from "@/lib/trip/booking-expiry";
import { validateCoupon, redeemCoupon } from "@/lib/coupons/validate-coupon";
import { logPaymentEvent } from "@/lib/payments/payment-history";
import { notifyBookingCreated } from "@/lib/notifications/dispatch";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const parsed = bookingCreateSchema.parse(await req.json());
    const seatsBooked = parsed.travelers.length;

    const tripDoc = await TripModel.findOne({
      _id: parsed.tripId,
      slug: parsed.tripSlug,
      status: "published",
    }).lean();
    if (!tripDoc) return fail("This trip is no longer available.", 404);

    const trip = toEntity(tripDoc) as unknown as Trip;
    const departure = trip.departureDates.find((d) => d.id === parsed.departureDateId) as
      | DepartureDate
      | undefined;

    if (!departure) return fail("Selected departure batch was not found.", 404);
    if (departure.isPublished === false) return fail("Selected departure batch is not available.", 409);
    if (departure.status === "sold-out" || departure.status === "closed") {
      return fail("Selected departure batch is no longer bookable.", 409);
    }
    if (new Date(departure.endDate || departure.startDate).getTime() < Date.now()) {
      return fail("Selected departure batch has already ended.", 409);
    }
    if (departure.seatsAvailable < seatsBooked) {
      return fail(`Only ${departure.seatsAvailable} seat(s) left on this batch.`, 409);
    }

    // Atomic, race-safe seat decrement: the query itself requires enough
    // seats to still be available, so a concurrent booking that already
    // consumed them makes this match nothing instead of overselling.
    const seatUpdate = await TripModel.findOneAndUpdate(
      {
        _id: parsed.tripId,
        departureDates: {
          $elemMatch: {
            id: parsed.departureDateId,
            seatsAvailable: { $gte: seatsBooked },
            status: { $in: ["open", "filling-fast"] },
          },
        },
      },
      {
        $inc: {
          "departureDates.$.seatsAvailable": -seatsBooked,
          availableSeats: -seatsBooked,
        },
      },
      { new: true }
    );

    if (!seatUpdate) {
      return fail("Sorry, those seats were just booked by someone else. Please pick another batch.", 409);
    }

    // Flip the batch to sold-out once it hits zero, and mirror onto the
    // legacy top-level status for anything still reading it directly.
    const updatedBatch = (seatUpdate.departureDates as { id: string; seatsAvailable: number }[]).find(
      (d) => d.id === parsed.departureDateId
    );
    if (updatedBatch && updatedBatch.seatsAvailable <= 0) {
      await TripModel.updateOne(
        { _id: parsed.tripId, "departureDates.id": parsed.departureDateId },
        { $set: { "departureDates.$.status": "sold-out" } }
      );
    }

    const pricing = computeBookingPricing(trip, departure, seatsBooked);

    // Part 5 — Coupon System: optional, additive. If a coupon code was
    // submitted, it's re-validated server-side (never trust the client's
    // claimed discount) against the authoritative pricing just computed.
    // An invalid/expired coupon fails the whole booking rather than
    // silently booking at full price, so the customer isn't surprised by
    // the charge.
    let couponDiscountAmount = 0;
    let appliedCoupon: Awaited<ReturnType<typeof validateCoupon>>["coupon"] = undefined;
    if (parsed.couponCode) {
      const couponResult = await validateCoupon({
        code: parsed.couponCode,
        tripId: parsed.tripId,
        customerEmail: parsed.customerEmail,
        amount: pricing.bookingAmountDue,
      });
      if (!couponResult.valid) {
        // Give back the seats we just atomically reserved before failing.
        await TripModel.updateOne(
          { _id: parsed.tripId, "departureDates.id": parsed.departureDateId },
          {
            $inc: { "departureDates.$.seatsAvailable": seatsBooked, availableSeats: seatsBooked },
            $set: { "departureDates.$.status": departure.status },
          }
        );
        return fail(couponResult.reason || "Invalid coupon code.", 400);
      }
      couponDiscountAmount = couponResult.discountAmount;
      appliedCoupon = couponResult.coupon;
    }

    const bookingAmountDue = Math.max(0, pricing.bookingAmountDue - couponDiscountAmount);
    const remainingAmount = Math.max(0, pricing.totalAmount - couponDiscountAmount - bookingAmountDue);

    const now = new Date();
    const nowIso = now.toISOString();

    // Feature 3 — Booking Expiry Timer: the seat was just reserved above
    // (atomic decrement), so start the countdown right now. Duration comes
    // from config (env-driven), never hardcoded, and is snapshotted onto
    // the booking so later config changes don't retroactively move an
    // already-quoted deadline.
    const expiryMinutes = getReservationExpiryMinutes();
    const reservationExpiresAt = new Date(now.getTime() + getReservationExpiryMs()).toISOString();

    try {
      const booking = await BookingModel.create({
        tripId: parsed.tripId,
        tripSlug: parsed.tripSlug,
        tripTitle: trip.title,
        departureDateId: parsed.departureDateId,
        departureStartDate: departure.startDate,
        departureEndDate: departure.endDate,

        customerName: parsed.customerName,
        customerEmail: parsed.customerEmail,
        customerPhone: parsed.customerPhone,
        customerGender: parsed.customerGender,
        customerAge: parsed.customerAge,
        customerCity: parsed.customerCity,
        emergencyContactName: parsed.emergencyContactName,
        emergencyContactPhone: parsed.emergencyContactPhone || undefined,
        specialRequests: parsed.specialRequests,

        travelers: parsed.travelers,
        seatsBooked,

        offerPrice: pricing.offerPrice,
        originalPrice: pricing.originalPrice ?? undefined,
        discountAmount: pricing.discountAmount,
        bookingAmountDue,
        remainingAmount,
        totalAmount: pricing.totalAmount,
        amountPaid: 0,
        currency: pricing.currency,
        couponCode: appliedCoupon?.code,
        couponDiscountAmount,

        // Feature 1 — Book Your Slot amount actually used, snapshotted
        // from the trip's admin-configured `price.bookingAmount`.
        bookYourSlotAmountPerPerson: pricing.bookingAmountPerPerson,

        // Feature 2 — Remaining Payment Method, defaults to Cash During
        // Trip; Admin can change this later from the booking detail page.
        remainingPaymentMethod: DEFAULT_REMAINING_PAYMENT_METHOD,
        remainingPaymentStatus: remainingAmount > 0 ? "pending" : "not-applicable",

        // Feature 3 — reservation window.
        reservationStartedAt: nowIso,
        reservationExpiresAt,
        reservationExpiryMinutes: expiryMinutes,

        status: "slot-reserved",
        statusHistory: [
          { status: "pending", note: "Booking submitted by customer", changedAt: nowIso },
          {
            status: "slot-reserved",
            note: `Seat reserved for ${expiryMinutes} minute(s) pending Book Your Slot payment.`,
            changedAt: nowIso,
          },
        ],
        paymentStatus: "pending",
      });

      // Part 5 — coupon redemption is recorded only now that the booking
      // durably exists, never speculatively during validation.
      if (appliedCoupon && couponDiscountAmount > 0) {
        await redeemCoupon({
          coupon: appliedCoupon,
          bookingId: String(booking._id),
          customerEmail: parsed.customerEmail,
          discountAmount: couponDiscountAmount,
        }).catch(() => null);
      }

      // Create the Razorpay order for the Book Your Slot amount. If
      // Razorpay isn't configured (e.g. local dev), this returns null and
      // the booking still stands as a timed seat reservation — the client
      // just won't get a checkout to open.
      let razorpayOrder = null;
      try {
        razorpayOrder = await createSlotReservationOrder({
          amountInRupees: bookingAmountDue,
          currency: pricing.currency,
          receipt: String(booking._id),
          notes: { bookingId: String(booking._id), tripSlug: trip.slug },
        });
        if (razorpayOrder) {
          booking.razorpayOrderId = razorpayOrder.id;
          await booking.save();
          await logPaymentEvent({
            bookingId: String(booking._id),
            type: "order.created",
            source: "verify",
            orderId: razorpayOrder.id,
            amount: bookingAmountDue,
            currency: pricing.currency,
            status: "created",
            countsAsAttempt: true,
          }).catch(() => null);
        }
      } catch {
        // Order creation failing shouldn't lose the seat reservation the
        // customer already holds — they can retry payment before expiry.
        razorpayOrder = null;
      }

      await notifyBookingCreated(booking).catch(() => null);

      return created({
        ...toEntity(booking.toObject()),
        razorpayOrder,
      });
    } catch (createErr) {
      // Compensate: creating the booking record failed after seats were
      // already reserved — give them back so the batch isn't silently
      // short seats forever.
      await TripModel.updateOne(
        { _id: parsed.tripId, "departureDates.id": parsed.departureDateId },
        {
          $inc: { "departureDates.$.seatsAvailable": seatsBooked, availableSeats: seatsBooked },
          $set: { "departureDates.$.status": departure.status },
        }
      );
      throw createErr;
    }
  } catch (err) {
    return handleApiError(err);
  }
}

/** GET /api/bookings?email=&tripSlug= — lets a customer look up their own
 * booking status without needing an admin session (Part 6/7 support). Only
 * returns the fields a customer should see. */
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = req.nextUrl;
    const email = searchParams.get("email")?.trim().toLowerCase();
    const bookingId = searchParams.get("id")?.trim();

    if (!email && !bookingId) return fail("Provide a booking id or email to look up bookings.", 400);

    const filter: Record<string, unknown> = {};
    if (bookingId) filter._id = bookingId;
    if (email) filter.customerEmail = new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

    const bookings = await BookingModel.find(filter)
      .select(
        "tripTitle departureStartDate departureEndDate seatsBooked totalAmount amountPaid remainingAmount " +
          "remainingPaymentMethod remainingPaymentStatus status paymentStatus reservationStartedAt " +
          "reservationExpiresAt createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    // Lazy-expiry: any reservation whose window has passed gets expired
    // (and its seat released) right here, before the customer sees it.
    const fresh = await Promise.all(bookings.map((b) => expireIfDue(b)));

    return ok(fresh.map((b) => toEntity(b)));
  } catch (err) {
    return handleApiError(err);
  }
}
