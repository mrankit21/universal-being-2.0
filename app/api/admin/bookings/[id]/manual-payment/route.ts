/**
 * POST /api/admin/bookings/[id]/manual-payment — Step 8C, Part 11.
 *
 * Records a remaining-balance payment collected outside Razorpay (Cash
 * During Trip is the only implemented `remainingPaymentMethod` today) —
 * an admin marks it received here rather than editing the booking
 * document directly, so it's logged to `PaymentEvent` and shows up in the
 * timeline like every other payment action.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongoose";
import { BookingModel } from "@/lib/db/models/booking.model";
import { logPaymentEvent } from "@/lib/payments/payment-history";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

type Params = { params: Promise<{ id: string }> };

const manualPaymentSchema = z.object({
  amount: z.number().positive(),
  method: z.string().min(1).default("cash-during-trip"),
  notes: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requirePermission("bookings:write");
    await connectToDatabase();
    const { id } = await params;
    const parsed = manualPaymentSchema.parse(await req.json());

    const booking = await BookingModel.findById(id);
    if (!booking) return fail("Booking not found", 404);
    if (parsed.amount > booking.remainingAmount) {
      return fail(`Amount exceeds the remaining balance of ${booking.remainingAmount}.`, 400);
    }

    const now = new Date().toISOString();
    booking.amountPaid += parsed.amount;
    booking.remainingAmount -= parsed.amount;
    booking.remainingPaymentStatus = booking.remainingAmount <= 0 ? "received" : "pending";
    if (booking.remainingAmount <= 0) {
      booking.status = "completed";
    }
    if (parsed.notes) {
      booking.adminPaymentNotes = booking.adminPaymentNotes
        ? `${booking.adminPaymentNotes}\n[${now}] ${parsed.notes}`
        : `[${now}] ${parsed.notes}`;
    }
    booking.statusHistory = [
      ...(booking.statusHistory ?? []),
      {
        status: booking.status,
        note: `Manual remaining payment of ${parsed.amount} recorded via ${parsed.method}.`,
        changedAt: now,
        changedBy: user.email,
      },
    ];
    await booking.save();

    await logPaymentEvent({
      bookingId: id,
      type: "manual.remaining-payment",
      source: "manual",
      amount: parsed.amount,
      currency: booking.currency,
      method: parsed.method,
      status: "received",
      notes: parsed.notes ? `${parsed.notes} (recorded by ${user.email})` : `Recorded by ${user.email}`,
    });

    return ok(booking);
  } catch (err) {
    return handleApiError(err);
  }
}
