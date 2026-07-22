/**
 * Payment History (Step 8C, Part 4) — single function every payment-related
 * code path calls to append an event, so the timeline shown to admins is
 * assembled from one consistent source instead of five routes each writing
 * slightly different shapes.
 */
import { PaymentEventModel, type PaymentEventType, type PaymentEventSource } from "@/lib/db/models/payment-event.model";
import { BookingModel } from "@/lib/db/models/booking.model";

export interface LogPaymentEventInput {
  bookingId: string;
  type: PaymentEventType | string;
  source: PaymentEventSource;
  razorpayEventId?: string;
  orderId?: string;
  paymentId?: string;
  refundId?: string;
  amount?: number;
  currency?: string;
  method?: string;
  status?: string;
  notes?: string;
  rawPayload?: unknown;
  /** Only set for events that represent a distinct payment attempt (order
   * creation, retry order creation) — bumps the booking's counter used for
   * "Attempt 1 / 2 / 3" display. */
  countsAsAttempt?: boolean;
}

/** Returns null (instead of throwing) if this is a duplicate webhook
 * delivery for an event id already logged — callers should treat that as
 * "already processed, do nothing further" rather than an error. */
export async function logPaymentEvent(input: LogPaymentEventInput) {
  let attemptNumber: number | undefined;
  if (input.countsAsAttempt) {
    const booking = await BookingModel.findByIdAndUpdate(
      input.bookingId,
      { $inc: { paymentAttemptCount: 1 } },
      { new: true }
    ).select("paymentAttemptCount");
    attemptNumber = booking?.paymentAttemptCount;
  }

  try {
    return await PaymentEventModel.create({
      bookingId: input.bookingId,
      razorpayEventId: input.razorpayEventId,
      type: input.type,
      source: input.source,
      orderId: input.orderId,
      paymentId: input.paymentId,
      refundId: input.refundId,
      amount: input.amount,
      currency: input.currency,
      method: input.method,
      status: input.status,
      attemptNumber,
      notes: input.notes,
      rawPayload: input.rawPayload,
      processedAt: new Date().toISOString(),
    });
  } catch (err) {
    // Unique-index violation on razorpayEventId => duplicate webhook
    // delivery (Part 12 — "Prevent Duplicate Webhooks"). Swallow it.
    if (input.razorpayEventId && isDuplicateKeyError(err)) return null;
    throw err;
  }
}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: number }).code === 11000;
}

export async function getPaymentHistory(bookingId: string) {
  return PaymentEventModel.find({ bookingId }).sort({ createdAt: -1 }).lean();
}
