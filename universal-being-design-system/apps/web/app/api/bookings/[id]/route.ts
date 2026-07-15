/**
 * GET /api/bookings/[id] — customer-facing single booking lookup. Backs
 * the Payment Success / Failed / Cancelled pages (Step 8C, Part 2) and the
 * "retry payment" button, which all need the booking's current state by
 * id without requiring an admin session. Deliberately returns a narrower
 * field set than the admin route — no internal notes, no full traveller ID
 * numbers beyond what the customer themselves submitted.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { BookingModel } from "@/lib/db/models/booking.model";
import { expireIfDue } from "@/lib/trip/booking-expiry";
import { getPaymentHistory } from "@/lib/payments/payment-history";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { toEntity } from "@/lib/api/db-mappers";

type Params = { params: Promise<{ id: string }> };

const CUSTOMER_FIELDS =
  "tripTitle tripSlug departureStartDate departureEndDate seatsBooked customerName customerEmail " +
  "offerPrice discountAmount couponDiscountAmount couponCode bookingAmountDue remainingAmount totalAmount " +
  "amountPaid currency status statusHistory paymentStatus remainingPaymentMethod remainingPaymentStatus " +
  "reservationStartedAt reservationExpiresAt razorpayOrderId invoiceNumber ticketGeneratedAt " +
  "paymentAttemptCount latestRefundStatus createdAt updatedAt";

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const booking = await BookingModel.findById(id).select(CUSTOMER_FIELDS).lean();
    if (!booking) return fail("Booking not found", 404);

    const fresh = await expireIfDue(booking);
    const history = await getPaymentHistory(id);

    return ok({
      ...toEntity(fresh),
      paymentHistory: history.map((h) => ({
        type: h.type,
        status: h.status,
        amount: h.amount,
        method: h.method,
        attemptNumber: h.attemptNumber,
        createdAt: h.createdAt,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
