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
import { Types } from "mongoose";
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
import { CouponModel, CouponRedemptionModel } from "@/lib/db/models/coupon.model";
import { logPaymentEvent } from "@/lib/payments/payment-history";
// notifyBookingCreated is intentionally not called from this route anymore
// — see the comment where the booking hold is created below. Still used by
// the admin "Resend Email" tool (app/api/admin/bookings/[id]/notify).
import { bookingsRateLimit } from "@/lib/rate-limit/client";
import { enforceRateLimit } from "@/lib/rate-limit/enforce";
import { getClientIp } from "@/lib/rate-limit/get-client-ip";
import { isIpWhitelisted } from "@/lib/rate-limit/whitelist";
import { linkLeadOnBookingStarted } from "@/lib/crm/booking-link";

export async function POST(req: NextRequest) {
  try {
    // 10/min per IP — generous for a real customer (form retries, editing
    // travelers), but enough to blunt a script that hammers this endpoint
    // to lock up seats via the atomic reservation below without ever
    // completing payment.
    const ip = getClientIp(req);
    const limited = await enforceRateLimit(
      bookingsRateLimit,
      ip,
      "Too many booking requests from this device. Please wait a moment and try again.",
      { bypass: isIpWhitelisted(ip) }
    );
    if (limited) return limited;

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

    const pricing = computeBookingPricing(trip, departure, seatsBooked, parsed.sharingType);

    // Part 5 — Coupon System: optional, additive. If a coupon code was
    // submitted, it's re-validated server-side (never trust the client's
    // claimed discount) against the authoritative pricing just computed.
    // An invalid/expired coupon fails the whole booking rather than
    // silently booking at full price, so the customer isn't surprised by
    // the charge.
    let couponDiscountAmount = 0;
    let appliedCoupon: Awaited<ReturnType<typeof validateCoupon>>["coupon"] = undefined;
    // Pre-generated so an atomic coupon redemption (which needs a bookingId
    // for its CouponRedemption row) can be attempted *before* the Booking
    // document exists — mirroring the seat reservation above: reserve the
    // resource atomically first, only create dependent records once every
    // reservation the booking needs has actually been secured.
    const bookingId = new Types.ObjectId();

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

      if (!appliedCoupon) {
        // Defensive, not just cosmetic: `CouponValidationResult.coupon` is
        // typed as optional independently of `valid` (see
        // lib/coupons/validate-coupon.ts), so `valid: true` doesn't
        // guarantee `coupon` is set at the type level even though it
        // always is in practice. This is a real narrowing check (not a
        // cast) — it's what lets `appliedCoupon` be passed to
        // `redeemCoupon()` below typed as a plain `CouponDocument`, and it
        // also means a future change to `validateCoupon` that violates
        // that invariant fails the booking cleanly instead of crashing
        // inside `redeemCoupon()`. Same compensating-transaction pattern
        // as the invalid-coupon case: give back the seats before failing.
        await TripModel.updateOne(
          { _id: parsed.tripId, "departureDates.id": parsed.departureDateId },
          {
            $inc: { "departureDates.$.seatsAvailable": seatsBooked, availableSeats: seatsBooked },
            $set: { "departureDates.$.status": departure.status },
          }
        );
        return fail("Invalid coupon code.", 400);
      }

      // Reserve the coupon's usage slot atomically, right now — not after
      // the booking is created. validateCoupon()'s usage-limit check above
      // was a plain read and can be stale by the time we get here under
      // concurrent load, so redeemCoupon() re-checks and increments
      // usedCount in one atomic findOneAndUpdate. If it returns false, a
      // concurrent request took the last slot between validation and here.
      const redeemed = await redeemCoupon({
        coupon: appliedCoupon,
        bookingId: String(bookingId),
        customerEmail: parsed.customerEmail,
        discountAmount: couponDiscountAmount,
      });
      if (!redeemed) {
        // Same compensating-transaction pattern as the invalid-coupon case
        // above: give back the seats before failing the request.
        await TripModel.updateOne(
          { _id: parsed.tripId, "departureDates.id": parsed.departureDateId },
          {
            $inc: { "departureDates.$.seatsAvailable": seatsBooked, availableSeats: seatsBooked },
            $set: { "departureDates.$.status": departure.status },
          }
        );
        return fail("This coupon just reached its usage limit. Please remove it and try again.", 409);
      }
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
        _id: bookingId,
        tripId: parsed.tripId,
        tripSlug: parsed.tripSlug,
        tripTitle: trip.title,
        departureDateId: parsed.departureDateId,
        departureStartDate: departure.startDate,
        departureEndDate: departure.endDate,
        // Pickup Variant Architecture (2026-07) — informational snapshot
        // only; see `bookingCreateSchema` doc comment. Resolved server-side
        // from the trip itself rather than trusting a client-supplied name.
        pickupVariantId: parsed.pickupVariantId,
        pickupVariantName: parsed.pickupVariantId
          ? trip.pickupVariants?.find((v) => v.id === parsed.pickupVariantId)?.name
          : undefined,

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
        // Room Sharing markup (2026-07) — snapshot alongside the rest of
        // the price breakdown; `offerPrice` above already has the markup
        // baked in, these are for admin reference only.
        sharingType: pricing.sharingType,
        sharingTypeMarkupPerPerson: pricing.sharingTypeMarkupPerPerson,
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

      // Part 5 — coupon redemption was already reserved atomically above
      // (before this booking existed), using this same booking's
      // pre-generated _id. Nothing left to do here.

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

      // Ankit (2026-08): no email at this stage — customers were getting a
      // "Seat Reserved" email for a booking that's still just a pending,
      // unpaid hold. The very first customer email should be the payment
      // confirmation once notifySlotPaid() fires (see the payment webhook /
      // verify route), not this temporary-reservation notice. Admins can
      // still trigger it manually from Admin → Bookings → Resend Email if
      // they ever want to nudge a customer about an expiring hold.

      // CRM Phase 7 — "Booking Started" / "Payment Pending" lead source.
      // Best-effort: a CRM hiccup must never affect the booking itself.
      await linkLeadOnBookingStarted(booking).catch((crmErr) =>
        console.error("[bookings] CRM linkLeadOnBookingStarted failed (booking was still created):", crmErr)
      );

      return created({
        ...toEntity(booking.toObject()),
        razorpayOrder,
      });
    } catch (createErr) {
      // Compensate: creating the booking record failed after seats (and
      // possibly a coupon slot) were already reserved — give them both back
      // so the batch isn't silently short seats, and the coupon's usedCount
      // isn't silently short a slot, forever.
      await TripModel.updateOne(
        { _id: parsed.tripId, "departureDates.id": parsed.departureDateId },
        {
          $inc: { "departureDates.$.seatsAvailable": seatsBooked, availableSeats: seatsBooked },
          $set: { "departureDates.$.status": departure.status },
        }
      );
      if (appliedCoupon && couponDiscountAmount > 0) {
        await CouponModel.updateOne({ _id: appliedCoupon._id }, { $inc: { usedCount: -1 } }).catch(() => null);
        await CouponRedemptionModel.deleteOne({ bookingId: String(bookingId) }).catch(() => null);
      }
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
