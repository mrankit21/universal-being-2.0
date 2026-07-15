/**
 * GET /api/bookings/[id]/invoice — Step 8C, Part 7. Streams the invoice
 * PDF for a booking, generating (and numbering) it on first request if it
 * doesn't exist yet. Public by booking id (same trust model as the rest of
 * the customer-facing booking endpoints — the id itself is the
 * capability); an admin equivalent isn't a separate route since the PDF
 * content is identical either way.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { BookingModel } from "@/lib/db/models/booking.model";
import { InvoiceModel } from "@/lib/db/models/invoice.model";
import { ensureInvoiceForBooking } from "@/lib/payments/invoicing";
import { generateInvoicePdf } from "@/lib/pdf/invoice-pdf";
import { fail, handleApiError } from "@/lib/api-helpers/respond";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const booking = await BookingModel.findById(id);
    if (!booking) return fail("Booking not found", 404);
    if (booking.paymentStatus !== "paid" && booking.paymentStatus !== "refunded") {
      return fail("An invoice is issued once payment has been received.", 409);
    }

    let invoice = booking.invoiceId ? await InvoiceModel.findById(booking.invoiceId) : null;
    if (!invoice) invoice = await ensureInvoiceForBooking(booking);
    if (!invoice) return fail("Could not issue invoice.", 500);

    const pdf = await generateInvoicePdf(invoice);
    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
