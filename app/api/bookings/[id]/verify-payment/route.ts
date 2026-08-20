/**
 * POST /api/bookings/[id]/verify-payment — Feature 3, "If payment is
 * completed within 15 minutes" branch of the Booking Expiry Timer
 * workflow. Called by the client (`components/trip/booking-form.tsx`)
 * from Razorpay checkout's `handler` callback once the customer pays the
 * Book Your Slot amount.
 *
 * Verifies the HMAC signature server-side (never trust the client's word
 * that a payment succeeded), then — only if the booking hasn't already
 * expired — advances it: `slot-reserved` -> `slot-paid`, clears the
 * reservation deadline (a paid booking no longer expires), and sets
 * `remainingPaymentStatus` for the (default Cash During Trip) remaining
 * balance.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongoose";
import { BookingModel } from "@/lib/db/models";
import { verifyPaymentSignature } from "@/lib/payments/razorpay";
import { expireIfDue, isReservationExpired } from "@/lib/trip/booking-expiry";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { toEntity } from "@/lib/api/db-mappers";
import { logPaymentEvent } from "@/lib/payments/payment-history";
import { ensureInvoiceForBooking } from "@/lib/payments/invoicing";
import { notifySlotPaid, notifyPaymentFailed, notifyInvoiceIssued, notifyTicketIssued } from "@/lib/notifications/dispatch";
import { generateInvoicePdf } from "@/lib/pdf/invoice-pdf";
import { generateTicketPdf } from "@/lib/pdf/ticket-pdf";
import { linkLeadOnPaymentReceived } from "@/lib/crm/booking-link";

// Invoice/ticket PDFs render via headless Chrome (lib/pdf/render-html-to-pdf.ts),
// which needs the Node.js runtime and more time than the default limit.
export const runtime = "nodejs";
export const maxDuration = 30;

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = verifySchema.parse(await req.json());

    const booking = await BookingModel.findById(id);
    if (!booking) return fail("Booking not found", 404);

    // Lazy-expire first: if the 15-minute window already passed, this
    // payment (even if genuinely successful on Razorpay's side) can't
    // confirm a seat that's already been released.
    const current = await expireIfDue(booking.toObject());
    if (isReservationExpired({ status: booking.status, reservationExpiresAt: booking.reservationExpiresAt }) || current.status === "expired") {
      return fail(
        "This booking's reservation window has expired and the seat was released. Please create a new booking.",
        409
      );
    }

    if (booking.razorpayOrderId && booking.razorpayOrderId !== body.razorpay_order_id) {
      return fail("Order does not match this booking.", 400);
    }

    const validSignature = verifyPaymentSignature({
      orderId: body.razorpay_order_id,
      paymentId: body.razorpay_payment_id,
      signature: body.razorpay_signature,
    });

    if (!validSignature) {
      booking.paymentStatus = "failed";
      booking.statusHistory = [
        ...(booking.statusHistory ?? []),
        { status: booking.status, note: "Payment signature verification failed.", changedAt: new Date().toISOString() },
      ];
      await booking.save();
      await logPaymentEvent({
        bookingId: String(booking._id),
        type: "payment.failed",
        source: "verify",
        orderId: body.razorpay_order_id,
        paymentId: body.razorpay_payment_id,
        status: "signature_invalid",
        notes: "Client-reported payment failed signature verification.",
      }).catch(() => null);
      await notifyPaymentFailed(booking).catch(() => null);
      return fail("Payment verification failed. Please try again.", 400);
    }

    const now = new Date().toISOString();
    booking.razorpayPaymentId = body.razorpay_payment_id;
    booking.razorpaySignature = body.razorpay_signature;
    booking.amountPaid = booking.bookingAmountDue;
    booking.paymentStatus = "paid";
    booking.status = booking.remainingAmount > 0 ? "slot-paid" : "remaining-payment-received";
    // Slot is paid — the reservation timer no longer applies.
    booking.reservationExpiresAt = undefined;
    booking.remainingPaymentStatus = booking.remainingAmount > 0 ? "pending" : "not-applicable";
    booking.statusHistory = [
      ...(booking.statusHistory ?? []),
      {
        status: booking.status,
        note: "Book Your Slot payment received via Razorpay.",
        changedAt: now,
      },
    ];
    await booking.save();

    await logPaymentEvent({
      bookingId: String(booking._id),
      type: "payment.captured",
      source: "verify",
      orderId: body.razorpay_order_id,
      paymentId: body.razorpay_payment_id,
      amount: booking.amountPaid,
      currency: booking.currency,
      status: "captured",
      notes: "Verified client-side via Razorpay Checkout handler.",
    }).catch(() => null);
    const invoice = await ensureInvoiceForBooking(booking).catch(() => null);
    await notifySlotPaid(booking).catch(() => null);

    // Best-effort: send the invoice PDF (and, once fully paid, the
    // e-ticket) over email + WhatsApp automatically. Never blocks or
    // fails the payment response — same admin-triggerable "resend" path
    // (app/api/admin/bookings/[id]/notify/route.ts) covers the case where
    // delivery fails here.
    if (invoice) {
      await generateInvoicePdf(invoice)
        .then((pdf) => notifyInvoiceIssued(booking, pdf, invoice.invoiceNumber))
        .catch((err) => console.error("[verify-payment] auto invoice send failed:", err));
    }
    if (booking.paymentStatus === "paid") {
      await generateTicketPdf(booking)
        .then((pdf) => notifyTicketIssued(booking, pdf))
        .catch((err) => console.error("[verify-payment] auto ticket send failed:", err));
    }

    // CRM Phase 7 — Status = BOOKED, link Booking ID/Trip/Pickup
    // Variant/Amount Paid/Remaining Amount. Best-effort, same as the
    // invoice/notification calls right above.
    await linkLeadOnPaymentReceived(booking).catch((crmErr) =>
      console.error("[verify-payment] CRM linkLeadOnPaymentReceived failed (payment was still recorded):", crmErr)
    );

    return ok(toEntity(booking.toObject()));
  } catch (err) {
    return handleApiError(err);
  }
}
