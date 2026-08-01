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
import { emailLayout, detailsCard, ctaButton, paragraph, note, esc, formatEmailDateRange, formatEmailDateTime } from "./email-templates";
import { absoluteUrl } from "@/lib/seo/site-url";
import type { BookingDocument } from "@/lib/db/models/booking.model";

type Booking = Pick<
  BookingDocument,
  | "_id"
  | "customerName"
  | "customerEmail"
  | "customerPhone"
  | "tripTitle"
  | "tripSlug"
  | "departureStartDate"
  | "departureEndDate"
  | "seatsBooked"
  | "bookingAmountDue"
  | "reservationExpiresAt"
  | "totalAmount"
  | "amountPaid"
  | "remainingAmount"
  | "currency"
  | "status"
>;

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function seatsLabel(seats: number) {
  return `${seats} ${seats === 1 ? "traveller" : "travellers"}`;
}

function firstName(fullName: string) {
  return esc(fullName.trim().split(/\s+/)[0] || fullName);
}

function tripLink(booking: Booking) {
  return absoluteUrl(`/trips/${booking.tripSlug}`);
}

function bookingLink(booking: Booking, page: "success" | "failed" = "success") {
  return absoluteUrl(`/bookings/${String(booking._id)}/${page}`);
}

async function notifyBoth(email: { subject: string; html: string }, whatsappBody: string, booking: Booking) {
  await Promise.allSettled([
    sendEmail({ to: booking.customerEmail, subject: email.subject, html: email.html }),
    booking.customerPhone ? sendWhatsApp({ to: booking.customerPhone, body: whatsappBody }) : Promise.resolve(),
  ]);
}

export async function notifyBookingCreated(booking: Booking) {
  const dates = formatEmailDateRange(booking.departureStartDate, booking.departureEndDate);
  const deadline = formatEmailDateTime(booking.reservationExpiresAt);
  const subject = `Your seat is reserved — ${booking.tripTitle}`;

  const html = emailLayout({
    previewText: `Complete payment${deadline ? ` by ${deadline}` : ""} to confirm your seat for ${booking.tripTitle}.`,
    eyebrow: "Seat reserved",
    heading: `Your seat for ${esc(booking.tripTitle)} is reserved`,
    bodyHtml: [
      paragraph(
        `Hi ${firstName(booking.customerName)},<br/>We've held your seat for <b>${esc(booking.tripTitle)}</b>. It's a temporary reservation${
          deadline ? ` — complete payment before <b>${esc(deadline)}</b> to lock it in` : " — complete payment to lock it in"
        }.`
      ),
      detailsCard([
        { label: "Trip", value: booking.tripTitle },
        ...(dates ? [{ label: "Departure", value: dates }] : []),
        { label: "Travellers", value: seatsLabel(booking.seatsBooked) },
        { label: "Amount due now", value: money(booking.bookingAmountDue, booking.currency) },
      ]),
      ctaButton("Complete your payment", tripLink(booking)),
      note("If the payment window lapses, the seat is released and you'll need to book again."),
    ].join(""),
  });

  await notifyBoth(
    { subject, html },
    `Hi ${booking.customerName}, your seat for ${booking.tripTitle} is reserved. Complete payment${deadline ? ` before ${deadline}` : ""} to confirm it.`,
    booking
  );
}

export async function notifySlotPaid(booking: Booking) {
  const dates = formatEmailDateRange(booking.departureStartDate, booking.departureEndDate);
  const subject = `Payment received — ${booking.tripTitle}`;

  const html = emailLayout({
    previewText: `We've received your payment for ${booking.tripTitle} — your slot is confirmed.`,
    eyebrow: "Payment received",
    heading: `Your slot for ${esc(booking.tripTitle)} is confirmed`,
    bodyHtml: [
      paragraph(
        `Hi ${firstName(booking.customerName)},<br/>We've received your payment of <b>${money(booking.amountPaid, booking.currency)}</b> for <b>${esc(booking.tripTitle)}</b>. Your slot is confirmed!`
      ),
      detailsCard([
        { label: "Trip", value: booking.tripTitle },
        ...(dates ? [{ label: "Departure", value: dates }] : []),
        { label: "Travellers", value: seatsLabel(booking.seatsBooked) },
        { label: "Amount paid", value: money(booking.amountPaid, booking.currency) },
        ...(booking.remainingAmount > 0
          ? [{ label: "Balance remaining", value: money(booking.remainingAmount, booking.currency) }]
          : [{ label: "Balance remaining", value: "Fully paid" }]),
      ]),
      ctaButton("View your booking", bookingLink(booking, "success")),
    ].join(""),
  });

  await notifyBoth(
    { subject, html },
    `Hi ${booking.customerName}, we've received your payment for ${booking.tripTitle}. Your slot is confirmed!`,
    booking
  );
}

export async function notifyPaymentFailed(booking: Booking) {
  const subject = `Payment unsuccessful — ${booking.tripTitle}`;

  const html = emailLayout({
    previewText: `Your payment for ${booking.tripTitle} couldn't be completed — you can retry from your booking page.`,
    eyebrow: "Payment issue",
    heading: `We couldn't process your payment`,
    bodyHtml: [
      paragraph(
        `Hi ${firstName(booking.customerName)},<br/>Your payment for <b>${esc(booking.tripTitle)}</b> could not be completed. No amount has been deducted for this attempt — you can retry any time before your reservation expires.`
      ),
      detailsCard([
        { label: "Trip", value: booking.tripTitle },
        { label: "Amount", value: money(booking.bookingAmountDue, booking.currency) },
      ]),
      ctaButton("Retry payment", bookingLink(booking, "failed")),
      note("Still stuck? Call or WhatsApp us — we're happy to help. Details below."),
    ].join(""),
  });

  await notifyBoth(
    { subject, html },
    `Hi ${booking.customerName}, your payment for ${booking.tripTitle} could not be completed. You can retry from your booking page.`,
    booking
  );
}

export async function notifyRemainingPaymentReminder(booking: Booking) {
  const dates = formatEmailDateRange(booking.departureStartDate, booking.departureEndDate);
  const subject = `Remaining payment due — ${booking.tripTitle}`;

  const html = emailLayout({
    previewText: `A balance of ${money(booking.remainingAmount, booking.currency)} is due for ${booking.tripTitle}.`,
    eyebrow: "Payment reminder",
    heading: `Remaining balance due for ${esc(booking.tripTitle)}`,
    bodyHtml: [
      paragraph(
        `Hi ${firstName(booking.customerName)},<br/>Just a reminder that a remaining balance is due for <b>${esc(booking.tripTitle)}</b>. Please clear it before departure to avoid any last-minute hassle.`
      ),
      detailsCard([
        { label: "Trip", value: booking.tripTitle },
        ...(dates ? [{ label: "Departure", value: dates }] : []),
        { label: "Balance due", value: money(booking.remainingAmount, booking.currency) },
      ]),
      ctaButton("Pay remaining balance", bookingLink(booking, "success")),
    ].join(""),
  });

  await notifyBoth(
    { subject, html },
    `Hi ${booking.customerName}, a remaining balance of ${money(booking.remainingAmount, booking.currency)} is due for ${booking.tripTitle}.`,
    booking
  );
}

export async function notifyTripReminder(booking: Booking) {
  const dates = formatEmailDateRange(booking.departureStartDate, booking.departureEndDate);
  const subject = `Your trip is coming up — ${booking.tripTitle}`;

  const html = emailLayout({
    previewText: `${booking.tripTitle} departs soon${dates ? ` — ${dates}` : ""}. Safe travels!`,
    eyebrow: "Trip reminder",
    heading: `${esc(booking.tripTitle)} is coming up`,
    bodyHtml: [
      paragraph(
        `Hi ${firstName(booking.customerName)},<br/>Just a reminder that <b>${esc(booking.tripTitle)}</b> departs ${dates ? `on <b>${esc(dates)}</b>` : "soon"}. Safe travels!`
      ),
      detailsCard([
        { label: "Trip", value: booking.tripTitle },
        ...(dates ? [{ label: "Departure", value: dates }] : []),
        { label: "Travellers", value: seatsLabel(booking.seatsBooked) },
      ]),
      ctaButton("View booking details", bookingLink(booking, "success")),
    ].join(""),
  });

  await notifyBoth({ subject, html }, `Hi ${booking.customerName}, reminder: ${booking.tripTitle} departs soon. Safe travels!`, booking);
}

export async function notifyInvoiceIssued(booking: Booking, invoicePdf: Buffer, invoiceNumber: string) {
  const html = emailLayout({
    previewText: `Invoice ${invoiceNumber} for ${booking.tripTitle} is attached.`,
    eyebrow: "Invoice",
    heading: `Invoice ${esc(invoiceNumber)}`,
    bodyHtml: [
      paragraph(
        `Hi ${firstName(booking.customerName)},<br/>Please find attached your invoice for <b>${esc(booking.tripTitle)}</b>.`
      ),
      detailsCard([
        { label: "Invoice number", value: invoiceNumber },
        { label: "Trip", value: booking.tripTitle },
        { label: "Total amount", value: money(booking.totalAmount, booking.currency) },
      ]),
      note("This invoice is also available as a PDF attached to this email."),
    ].join(""),
  });

  await sendEmail({
    to: booking.customerEmail,
    subject: `Invoice ${invoiceNumber} — ${booking.tripTitle}`,
    html,
    attachments: [{ filename: `${invoiceNumber}.pdf`, content: invoicePdf, contentType: "application/pdf" }],
  });
}

export async function notifyTicketIssued(booking: Booking, ticketPdf: Buffer) {
  const dates = formatEmailDateRange(booking.departureStartDate, booking.departureEndDate);
  const html = emailLayout({
    previewText: `Your e-ticket for ${booking.tripTitle} is attached.`,
    eyebrow: "E-ticket",
    heading: `Your e-ticket for ${esc(booking.tripTitle)}`,
    bodyHtml: [
      paragraph(
        `Hi ${firstName(booking.customerName)},<br/>Your e-ticket for <b>${esc(booking.tripTitle)}</b> is attached. Please carry it — digital or printed — on the day of travel.`
      ),
      detailsCard([
        { label: "Trip", value: booking.tripTitle },
        ...(dates ? [{ label: "Departure", value: dates }] : []),
        { label: "Travellers", value: seatsLabel(booking.seatsBooked) },
      ]),
    ].join(""),
  });

  await sendEmail({
    to: booking.customerEmail,
    subject: `Your e-ticket — ${booking.tripTitle}`,
    html,
    attachments: [{ filename: "e-ticket.pdf", content: ticketPdf, contentType: "application/pdf" }],
  });
}

export async function notifyAdmin(subject: string, html: string) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail) return;
  await sendEmail({ to: adminEmail, subject, html });
}
