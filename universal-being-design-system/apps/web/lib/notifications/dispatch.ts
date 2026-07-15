/**
 * Notification Dispatch (Step 8C, Parts 9 + 10) — the typed event catalogue
 * both the spec's Email and WhatsApp sections call for. Every payment/
 * booking code path calls one of these named functions instead of building
 * raw messages inline, so the *set* of notification events is explicit and
 * auditable (grep this file to see everything the system can notify
 * about), even though actual sending is architecture-only until a real
 * provider is configured.
 *
 * Never awaited in a way that can fail the caller's request — notification
 * delivery is best-effort and must not block or fail a booking/payment
 * operation that already succeeded.
 */
import { sendEmail } from "./email";
import { sendWhatsApp } from "./whatsapp";
import type { BookingDocument } from "@/lib/db/models/booking.model";

type Booking = Pick<
  BookingDocument,
  | "customerName"
  | "customerEmail"
  | "customerPhone"
  | "tripTitle"
  | "departureStartDate"
  | "totalAmount"
  | "amountPaid"
  | "remainingAmount"
  | "currency"
  | "status"
>;

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

async function notifyBoth(email: { subject: string; html: string }, whatsappBody: string, booking: Booking) {
  await Promise.allSettled([
    sendEmail({ to: booking.customerEmail, subject: email.subject, html: email.html }),
    booking.customerPhone ? sendWhatsApp({ to: booking.customerPhone, body: whatsappBody }) : Promise.resolve(),
  ]);
}

export async function notifyBookingCreated(booking: Booking) {
  await notifyBoth(
    {
      subject: `Your seat is reserved — ${booking.tripTitle}`,
      html: `<p>Hi ${booking.customerName},</p><p>Your seat for <b>${booking.tripTitle}</b> is temporarily reserved. Complete payment to confirm it.</p>`,
    },
    `Hi ${booking.customerName}, your seat for ${booking.tripTitle} is reserved. Complete payment to confirm it.`,
    booking
  );
}

export async function notifySlotPaid(booking: Booking) {
  await notifyBoth(
    {
      subject: `Payment received — ${booking.tripTitle}`,
      html: `<p>Hi ${booking.customerName},</p><p>We've received your Book Your Slot payment of ${money(booking.amountPaid, booking.currency)} for <b>${booking.tripTitle}</b>. Your slot is confirmed!</p>`,
    },
    `Hi ${booking.customerName}, we've received your payment for ${booking.tripTitle}. Your slot is confirmed!`,
    booking
  );
}

export async function notifyPaymentFailed(booking: Booking) {
  await notifyBoth(
    {
      subject: `Payment unsuccessful — ${booking.tripTitle}`,
      html: `<p>Hi ${booking.customerName},</p><p>Your payment for <b>${booking.tripTitle}</b> could not be completed. You can retry from your booking page.</p>`,
    },
    `Hi ${booking.customerName}, your payment for ${booking.tripTitle} could not be completed. You can retry from your booking page.`,
    booking
  );
}

export async function notifyRemainingPaymentReminder(booking: Booking) {
  await notifyBoth(
    {
      subject: `Remaining payment due — ${booking.tripTitle}`,
      html: `<p>Hi ${booking.customerName},</p><p>A remaining balance of ${money(booking.remainingAmount, booking.currency)} is due for <b>${booking.tripTitle}</b>.</p>`,
    },
    `Hi ${booking.customerName}, a remaining balance of ${money(booking.remainingAmount, booking.currency)} is due for ${booking.tripTitle}.`,
    booking
  );
}

export async function notifyTripReminder(booking: Booking) {
  await notifyBoth(
    {
      subject: `Your trip is coming up — ${booking.tripTitle}`,
      html: `<p>Hi ${booking.customerName},</p><p>Just a reminder that <b>${booking.tripTitle}</b> departs on ${booking.departureStartDate ?? "the scheduled date"}. Safe travels!</p>`,
    },
    `Hi ${booking.customerName}, reminder: ${booking.tripTitle} departs soon. Safe travels!`,
    booking
  );
}

export async function notifyInvoiceIssued(booking: Booking, invoicePdf: Buffer, invoiceNumber: string) {
  await sendEmail({
    to: booking.customerEmail,
    subject: `Invoice ${invoiceNumber} — ${booking.tripTitle}`,
    html: `<p>Hi ${booking.customerName},</p><p>Please find attached your invoice ${invoiceNumber} for <b>${booking.tripTitle}</b>.</p>`,
    attachments: [{ filename: `${invoiceNumber}.pdf`, content: invoicePdf, contentType: "application/pdf" }],
  });
}

export async function notifyTicketIssued(booking: Booking, ticketPdf: Buffer) {
  await sendEmail({
    to: booking.customerEmail,
    subject: `Your e-ticket — ${booking.tripTitle}`,
    html: `<p>Hi ${booking.customerName},</p><p>Your e-ticket for <b>${booking.tripTitle}</b> is attached. Please carry it (digital or printed) on the day of travel.</p>`,
    attachments: [{ filename: "e-ticket.pdf", content: ticketPdf, contentType: "application/pdf" }],
  });
}

export async function notifyAdmin(subject: string, html: string) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail) return;
  await sendEmail({ to: adminEmail, subject, html });
}
