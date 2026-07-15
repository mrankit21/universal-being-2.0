/**
 * Invoice issuance (Step 8C, Part 7). Called the first time a booking's
 * payment is captured (from `verify-payment`, the webhook handler, or a
 * manual remaining-payment entry) — idempotent: if the booking already has
 * an `invoiceId`, the existing invoice is returned unchanged rather than
 * issuing a second one for the same booking.
 */
import { InvoiceModel } from "@/lib/db/models/invoice.model";
import { BookingModel, type BookingDocument } from "@/lib/db/models/booking.model";
import { nextSequence } from "@/lib/db/models/counter.model";
import { formatInvoiceNumber, getGstConfig } from "@/lib/config/payment-config";

export async function ensureInvoiceForBooking(booking: BookingDocument) {
  if (booking.invoiceId) {
    return InvoiceModel.findById(booking.invoiceId);
  }

  const year = new Date().getFullYear();
  const seq = await nextSequence(`invoice:${year}`);
  const invoiceNumber = formatInvoiceNumber(year, seq);
  const gst = getGstConfig();

  const subtotal = booking.totalAmount + booking.discountAmount + booking.couponDiscountAmount;
  const gstAmount = gst.gstRatePercent > 0 ? Math.round((booking.totalAmount * gst.gstRatePercent) / 100) : 0;

  const invoice = await InvoiceModel.create({
    bookingId: String(booking._id),
    invoiceNumber,
    issuedAt: new Date().toISOString(),
    status: "issued",
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    customerPhone: booking.customerPhone,
    tripTitle: booking.tripTitle,
    departureStartDate: booking.departureStartDate,
    departureEndDate: booking.departureEndDate,
    seatsBooked: booking.seatsBooked,
    subtotal,
    discountAmount: booking.discountAmount + booking.couponDiscountAmount,
    gstRatePercent: gst.gstRatePercent,
    gstAmount,
    totalAmount: booking.totalAmount + gstAmount,
    amountPaid: booking.amountPaid,
    balanceDue: Math.max(0, booking.totalAmount + gstAmount - booking.amountPaid),
    currency: booking.currency,
    gstin: gst.gstin || undefined,
  });

  await BookingModel.updateOne(
    { _id: booking._id },
    { $set: { invoiceId: String(invoice._id), invoiceNumber } }
  );

  return invoice;
}
