/**
 * GET /api/bookings/[id]/ticket — Step 8C, Part 8. Streams the downloadable
 * e-ticket PDF (with QR code) once the slot payment has been received.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { BookingModel } from "@/lib/db/models/booking.model";
import { generateTicketPdf } from "@/lib/pdf/ticket-pdf";
import { fail, handleApiError } from "@/lib/api-helpers/respond";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const booking = await BookingModel.findById(id);
    if (!booking) return fail("Booking not found", 404);
    if (booking.paymentStatus !== "paid") {
      return fail("Your e-ticket will be available once your slot payment is received.", 409);
    }

    if (!booking.ticketGeneratedAt) {
      booking.ticketGeneratedAt = new Date().toISOString();
      await booking.save();
    }

    const pdf = await generateTicketPdf(booking);
    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="e-ticket-${String(booking._id)}.pdf"`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
