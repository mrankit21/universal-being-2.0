/**
 * POST /api/payments/webhook — Razorpay Webhooks (Step 8C, Part 1).
 *
 * This is the authoritative payment source of truth: `verify-payment`
 * (client-driven, Part-8B) already advances a booking optimistically when
 * the browser reports success, but browsers can close tabs, lose network,
 * or lie. The webhook is what Razorpay itself calls server-to-server, so
 * every code path here must be safe to run even if `verify-payment` never
 * fired, or fired and this fires again for the same payment.
 *
 * Configure in the Razorpay Dashboard -> Webhooks with this URL and these
 * events: payment.captured, payment.failed, refund.processed, order.paid.
 * Set `RAZORPAY_WEBHOOK_SECRET` to the secret shown there (NOT the API key
 * secret — webhooks use their own secret).
 *
 * Security (Part 12):
 *   - Signature verified against the RAW body (see `verifyWebhookSignature`)
 *     before anything else is trusted.
 *   - Idempotency: every delivery is logged to `PaymentEvent` keyed on a
 *     dedupe id built from the event type + entity id (Razorpay retries
 *     deliveries on non-2xx / timeout, and can also send the same event
 *     more than once even on success per their own docs) — a duplicate
 *     insert is caught and treated as "already handled", not an error, so
 *     retried deliveries can never double-apply a status change.
 *   - Booking is looked up by `razorpayOrderId`/`razorpayPaymentId`, never
 *     trusted from an unsigned source.
 */
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { BookingModel } from "@/lib/db/models/booking.model";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { logPaymentEvent } from "@/lib/payments/payment-history";
import { ensureInvoiceForBooking } from "@/lib/payments/invoicing";
import { notifySlotPaid, notifyPaymentFailed } from "@/lib/notifications/dispatch";

interface RazorpayEntity {
  id: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  method?: string;
  status?: string;
  notes?: Record<string, string>;
}

interface RazorpayWebhookPayload {
  event: string;
  created_at?: number;
  payload?: {
    payment?: { entity: RazorpayEntity };
    order?: { entity: RazorpayEntity };
    refund?: { entity: RazorpayEntity };
  };
}

export async function POST(req: NextRequest) {
  // Read the raw body FIRST — signature verification must happen against
  // the exact bytes Razorpay sent, before any JSON parsing/re-serializing.
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    // Invalid/missing signature — reject without processing. No details
    // leaked about why, to avoid helping a would-be forger iterate.
    return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
  }

  let body: RazorpayWebhookPayload;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  await connectToDatabase();

  const paymentEntity = body.payload?.payment?.entity;
  const orderEntity = body.payload?.order?.entity;
  const refundEntity = body.payload?.refund?.entity;
  const entity = paymentEntity || orderEntity || refundEntity;
  const eventDedupeId =
    req.headers.get("x-razorpay-event-id") || `${body.event}:${entity?.id ?? "unknown"}:${body.created_at ?? ""}`;

  const orderId = paymentEntity?.order_id || orderEntity?.id;
  const bookingId = entity?.notes?.bookingId;

  const booking = bookingId
    ? await BookingModel.findById(bookingId)
    : orderId
      ? await BookingModel.findOne({ razorpayOrderId: orderId })
      : null;

  if (!booking) {
    // Can't attribute this event to a booking (order created for something
    // else, or already deleted) — log it standalone for audit, but there's
    // nothing to update. Always 200 so Razorpay doesn't retry forever for
    // an event that will never resolve.
    await logPaymentEvent({
      bookingId: "unknown",
      type: body.event,
      source: "webhook",
      razorpayEventId: eventDedupeId,
      orderId,
      paymentId: paymentEntity?.id,
      rawPayload: body,
    }).catch(() => null);
    return NextResponse.json({ success: true, note: "No matching booking" });
  }

  const logged = await logPaymentEvent({
    bookingId: String(booking._id),
    type: body.event,
    source: "webhook",
    razorpayEventId: eventDedupeId,
    orderId,
    paymentId: paymentEntity?.id,
    refundId: refundEntity?.id,
    amount: (paymentEntity?.amount ?? refundEntity?.amount ?? 0) / 100,
    currency: paymentEntity?.currency,
    method: paymentEntity?.method,
    status: paymentEntity?.status || refundEntity?.status,
    rawPayload: body,
  });

  if (logged === null) {
    // Duplicate delivery — already processed. Acknowledge without
    // reapplying the state change.
    return NextResponse.json({ success: true, note: "Duplicate event, already processed" });
  }

  const now = new Date().toISOString();

  switch (body.event) {
    case "payment.captured":
    case "order.paid": {
      if (booking.paymentStatus !== "paid") {
        booking.razorpayPaymentId = paymentEntity?.id || booking.razorpayPaymentId;
        booking.amountPaid = booking.bookingAmountDue;
        booking.paymentStatus = "paid";
        booking.status = booking.remainingAmount > 0 ? "slot-paid" : "remaining-payment-received";
        booking.reservationExpiresAt = undefined;
        booking.remainingPaymentStatus = booking.remainingAmount > 0 ? "pending" : "not-applicable";
        booking.statusHistory = [
          ...(booking.statusHistory ?? []),
          { status: booking.status, note: `Confirmed via Razorpay webhook (${body.event}).`, changedAt: now },
        ];
        await booking.save();
        await ensureInvoiceForBooking(booking).catch(() => null);
        await notifySlotPaid(booking).catch(() => null);
      }
      break;
    }
    case "payment.failed": {
      booking.paymentStatus = booking.paymentStatus === "paid" ? booking.paymentStatus : "failed";
      booking.statusHistory = [
        ...(booking.statusHistory ?? []),
        { status: booking.status, note: "Payment failed (Razorpay webhook).", changedAt: now },
      ];
      await booking.save();
      await notifyPaymentFailed(booking).catch(() => null);
      break;
    }
    case "refund.processed": {
      booking.paymentStatus = "refunded";
      booking.latestRefundStatus = "processed";
      booking.statusHistory = [
        ...(booking.statusHistory ?? []),
        { status: "refunded", note: "Refund processed by Razorpay.", changedAt: now },
      ];
      await booking.save();
      break;
    }
    default:
      // Any other subscribed-or-not event: already logged above for audit;
      // no booking state change needed.
      break;
  }

  return NextResponse.json({ success: true });
}
