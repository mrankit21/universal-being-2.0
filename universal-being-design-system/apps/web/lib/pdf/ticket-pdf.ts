/**
 * E-Ticket PDF (Step 8C, Part 8). Includes a QR code encoding the booking
 * id + trip slug (JSON) so a staff member scanning it at departure can
 * look the booking up instantly — the QR payload is deliberately just an
 * identifier, not sensitive traveller data, since printed/forwarded
 * tickets aren't a secure channel.
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import type { BookingDocument } from "@/lib/db/models/booking.model";

export async function generateTicketPdf(booking: BookingDocument): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 400]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const qrPayload = JSON.stringify({ bookingId: String(booking._id), tripSlug: booking.tripSlug });
  const qrDataUrl = await QRCode.toDataURL(qrPayload, { margin: 1, width: 220 });
  const qrPng = await doc.embedPng(qrDataUrl);

  let y = 360;
  const left = 40;
  const draw = (text: string, opts: { x?: number; size?: number; f?: typeof font; color?: [number, number, number] } = {}) => {
    page.drawText(text, {
      x: opts.x ?? left,
      y,
      size: opts.size ?? 10,
      font: opts.f ?? font,
      color: rgb(...(opts.color ?? [0.1, 0.1, 0.1])),
    });
  };
  const gap = (n = 16) => (y -= n);

  draw("UNIVERSAL BEING — E-TICKET", { size: 16, f: bold });
  gap(24);
  draw(booking.tripTitle, { size: 13, f: bold });
  gap(20);
  draw(`Booking ID: ${String(booking._id)}`);
  gap(14);
  if (booking.departureStartDate) {
    draw(
      `Departure: ${new Date(booking.departureStartDate).toLocaleDateString("en-IN")}` +
        (booking.departureEndDate ? ` – ${new Date(booking.departureEndDate).toLocaleDateString("en-IN")}` : "")
    );
    gap(14);
  }
  draw(`Traveller: ${booking.customerName}`);
  gap(14);
  draw(`Seats: ${booking.seatsBooked}`);
  gap(14);
  if (booking.emergencyContactName) {
    draw(
      `Emergency Contact: ${booking.emergencyContactName}${booking.emergencyContactPhone ? ` (${booking.emergencyContactPhone})` : ""}`
    );
    gap(14);
  }
  draw(`Booking Status: ${booking.status}`);
  gap(14);
  draw(`Payment Status: ${booking.paymentStatus}`);
  gap(20);

  if (booking.travelers?.length) {
    draw("Travellers:", { f: bold });
    gap(14);
    for (const t of booking.travelers) {
      draw(`• ${t.fullName}${t.age ? `, ${t.age}y` : ""}`, { size: 9 });
      gap(12);
    }
  }

  page.drawImage(qrPng, { x: 420, y: 150, width: 130, height: 130 });
  page.drawText("Scan at departure", { x: 425, y: 138, size: 8, font, color: rgb(0.4, 0.4, 0.4) });

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
