/**
 * POST /api/bookings/[id]/retry-payment — Step 8C, Part 3.
 *
 * Used when a customer's payment fails (or they abandon Razorpay
 * Checkout) but their seat reservation is still within its window. Rather
 * than reusing the original (now-dead) Razorpay order, this creates a
 * fresh one — Razorpay orders aren't reusable once a payment attempt has
 * failed against them — and points the booking at the new order id. The
 * booking itself, its seat hold, and its history are untouched; only the
 * order changes, so "Attempt 1 / Attempt 2 / Attempt 3..." all resolve to
 * the same booking record.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { BookingModel } from "@/lib/db/models/booking.model";
import { createSlotReservationOrder } from "@/lib/payments/razorpay";
import { expireIfDue, isReservationExpired } from "@/lib/trip/booking-expiry";
import { logPaymentEvent } from "@/lib/payments/payment-history";
import { getMaxRetryAttempts } from "@/lib/config/payment-config";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { toEntity } from "@/lib/api/db-mappers";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const booking = await BookingModel.findById(id);
    if (!booking) return fail("Booking not found", 404);

    const current = await expireIfDue(booking.toObject());
    if (isReservationExpired({ status: booking.status, reservationExpiresAt: booking.reservationExpiresAt }) || current.status === "expired") {
      return fail(
        "This booking's reservation window has expired and the seat was released. Please create a new booking.",
        409
      );
    }

    if (booking.paymentStatus === "paid") {
      return fail("This booking is already paid — no retry needed.", 409);
    }

    if (booking.paymentAttemptCount >= getMaxRetryAttempts()) {
      return fail("Maximum payment attempts reached for this booking. Please contact support.", 429);
    }

    const order = await createSlotReservationOrder({
      amountInRupees: booking.bookingAmountDue,
      currency: booking.currency,
      receipt: `${String(booking._id)}-retry-${booking.paymentAttemptCount + 1}`,
      notes: { bookingId: String(booking._id), tripSlug: booking.tripSlug, attempt: String(booking.paymentAttemptCount + 1) },
    });

    if (!order) {
      return fail("Online payment isn't configured. Please contact support to complete payment.", 503);
    }

    booking.razorpayOrderId = order.id;
    booking.paymentStatus = "pending";
    booking.statusHistory = [
      ...(booking.statusHistory ?? []),
      { status: booking.status, note: "New payment attempt started (retry).", changedAt: new Date().toISOString() },
    ];
    await booking.save();

    await logPaymentEvent({
      bookingId: String(booking._id),
      type: "order.created",
      source: "retry",
      orderId: order.id,
      amount: booking.bookingAmountDue,
      currency: booking.currency,
      status: "created",
      notes: "Retry order created after a failed/abandoned previous attempt.",
      countsAsAttempt: true,
    });

    return ok({ ...toEntity(booking.toObject()), razorpayOrder: order });
  } catch (err) {
    return handleApiError(err);
  }
}
