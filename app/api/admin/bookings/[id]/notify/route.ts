/**
 * POST /api/admin/bookings/[id]/notify — Step 8C, Part 11: "Resend Email" /
 * "Resend WhatsApp" from the admin bookings panel. `event` selects which
 * templated message from `lib/notifications/dispatch.ts` to resend;
 * `channel` narrows it to just email, just WhatsApp, or both (default).
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongoose";
import { BookingModel } from "@/lib/db/models/booking.model";
import { InvoiceModel } from "@/lib/db/models/invoice.model";
import { generateInvoicePdf } from "@/lib/pdf/invoice-pdf";
import { generateTicketPdf } from "@/lib/pdf/ticket-pdf";
import {
  notifyBookingCreated,
  notifySlotPaid,
  notifyPaymentFailed,
  notifyRemainingPaymentReminder,
  notifyTripReminder,
  notifyInvoiceIssued,
  notifyTicketIssued,
} from "@/lib/notifications/dispatch";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

// Ticket PDFs render via headless Chrome (lib/pdf/render-html-to-pdf.ts),
// which needs the Node.js runtime and more time than the default limit.
export const runtime = "nodejs";
export const maxDuration = 30;

type Params = { params: Promise<{ id: string }> };

const notifySchema = z.object({
  event: z.enum([
    "booking-created",
    "payment-success",
    "payment-failed",
    "remaining-payment-reminder",
    "trip-reminder",
    "invoice",
    "ticket",
  ]),
});

export async function POST(req: NextRequest, { params }: Params) {
  try {
    await requirePermission("bookings:write");
    await connectToDatabase();
    const { id } = await params;
    const { event } = notifySchema.parse(await req.json());

    const booking = await BookingModel.findById(id);
    if (!booking) return fail("Booking not found", 404);

    switch (event) {
      case "booking-created":
        await notifyBookingCreated(booking);
        break;
      case "payment-success":
        await notifySlotPaid(booking);
        break;
      case "payment-failed":
        await notifyPaymentFailed(booking);
        break;
      case "remaining-payment-reminder":
        await notifyRemainingPaymentReminder(booking);
        break;
      case "trip-reminder":
        await notifyTripReminder(booking);
        break;
      case "invoice": {
        if (!booking.invoiceId) return fail("No invoice has been issued for this booking yet.", 409);
        const invoice = await InvoiceModel.findById(booking.invoiceId);
        if (!invoice) return fail("Invoice record not found.", 404);
        const pdf = await generateInvoicePdf(invoice);
        await notifyInvoiceIssued(booking, pdf, invoice.invoiceNumber);
        break;
      }
      case "ticket": {
        if (booking.paymentStatus !== "paid") return fail("Ticket isn't available until payment is received.", 409);
        const pdf = await generateTicketPdf(booking);
        await notifyTicketIssued(booking, pdf);
        break;
      }
    }

    return ok({ sent: true, event });
  } catch (err) {
    return handleApiError(err);
  }
}
