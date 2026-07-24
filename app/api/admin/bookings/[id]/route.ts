import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { BookingModel, TripModel } from "@/lib/db/models";
import { bookingUpdateSchema } from "@/lib/validators/booking.schema";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";
import { expireIfDue } from "@/lib/trip/booking-expiry";
import { releaseCouponRedemption } from "@/lib/coupons/validate-coupon";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requirePermission("bookings:read");
    await connectToDatabase();
    const { id } = await params;
    const booking = await BookingModel.findById(id).lean();
    if (!booking) return fail("Booking not found", 404);
    const fresh = await expireIfDue(booking);
    return ok(fresh);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requirePermission("bookings:write");
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const parsed = bookingUpdateSchema.parse(body);

    const booking = await BookingModel.findById(id);
    if (!booking) return fail("Booking not found", 404);

    // Cancelling or manually expiring a booking that still holds seats
    // releases them back to the batch, and re-opens it if it had flipped
    // to sold-out. (Automatic expiry already does this via
    // `releaseExpiredBooking` — this covers the admin manually setting the
    // status instead of waiting for the timer/cron.)
    const releasesSeats = ["cancelled", "expired"];
    if (parsed.status && releasesSeats.includes(parsed.status) && !releasesSeats.includes(booking.status)) {
      await TripModel.updateOne(
        { _id: booking.tripId, "departureDates.id": booking.departureDateId },
        {
          $inc: {
            "departureDates.$.seatsAvailable": booking.seatsBooked,
            availableSeats: booking.seatsBooked,
          },
        }
      );
      await TripModel.updateOne(
        { _id: booking.tripId, "departureDates.id": booking.departureDateId, "departureDates.status": "sold-out" },
        { $set: { "departureDates.$.status": "open" } }
      );

      // Same coupon give-back as automatic expiry (`releaseExpiredBooking`)
      // — but only when the booking never actually completed a payment.
      // A booking that was `paid` (or `paid` then `refunded`) legitimately
      // used its coupon on a real transaction, so admin-cancelling it later
      // must NOT hand the coupon slot back; only a booking that's being
      // cancelled/expired before ever paying should release it.
      if (booking.paymentStatus !== "paid" && booking.paymentStatus !== "refunded") {
        await releaseCouponRedemption(String(booking._id)).catch(() => null);
      }
    }

    // Booking Status Timeline (Part 8) — every status transition is
    // appended, never overwritten, so the admin can see the full history
    // (created → confirmed → ... ) with timestamps and notes.
    if (parsed.status && parsed.status !== booking.status) {
      booking.statusHistory = [
        ...(booking.statusHistory ?? []),
        {
          status: parsed.status,
          note: parsed.statusNote,
          changedAt: new Date().toISOString(),
          changedBy: user.email,
        },
      ];
    }

    const { statusNote: _statusNote, ...fields } = parsed;
    void _statusNote;
    // Only assign keys the client actually sent in the RAW body. Every
    // field zod didn't get a value for still ends up on `parsed` as an
    // explicit `key: undefined` (all of bookingUpdateSchema's fields are
    // `.optional()`), and Object.assign onto a live Mongoose document
    // treats an explicit `undefined` as "unset this path" — so patching
    // just `{ status: "confirmed" }` was silently wiping paymentStatus,
    // notes, amountPaid, remainingPaymentMethod, and remainingPaymentStatus
    // on every booking edit. Checking the pre-zod `body` for the key is the
    // only reliable way to tell "client sent this" from "zod left this
    // undefined".
    const safeFields = Object.fromEntries(
      Object.entries(fields).filter(([k]) => Object.prototype.hasOwnProperty.call(body, k))
    );
    Object.assign(booking, safeFields);
    await booking.save();

    return ok(booking);
  } catch (err) {
    return handleApiError(err);
  }
}
