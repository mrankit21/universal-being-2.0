/** GET/POST /api/admin/refunds — refund queue for the admin panel (Step 8C, Part 6/11). */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { RefundModel } from "@/lib/db/models/refund.model";
import { BookingModel } from "@/lib/db/models/booking.model";
import { ok, created, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("refunds:read");
    await connectToDatabase();
    const status = req.nextUrl.searchParams.get("status");
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const refunds = await RefundModel.find(filter).sort({ createdAt: -1 }).lean();
    return ok(refunds);
  } catch (err) {
    return handleApiError(err);
  }
}

const adminRefundCreateSchema = z.object({
  bookingId: z.string().min(1),
  amount: z.number().positive().optional(),
  reason: z.string().min(3).max(1000),
});

/** Admin-initiated refund (as opposed to the customer-facing
 * `/api/bookings/[id]/refund-request`). Created straight into `approved`
 * status since an admin creating it has, by definition, already decided —
 * it still requires a separate `processed` PATCH to actually move money. */
export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("refunds:write");
    await connectToDatabase();
    const parsed = adminRefundCreateSchema.parse(await req.json());

    const booking = await BookingModel.findById(parsed.bookingId);
    if (!booking) return fail("Booking not found", 404);
    if (booking.paymentStatus !== "paid") return fail("Only paid bookings are eligible for a refund.", 409);

    const existingOpen = await RefundModel.findOne({
      bookingId: parsed.bookingId,
      status: { $in: ["requested", "approved"] },
    }).lean();
    if (existingOpen) return fail("An open refund already exists for this booking.", 409);

    const amount = Math.min(parsed.amount ?? booking.amountPaid, booking.amountPaid);
    const now = new Date().toISOString();

    const refund = await RefundModel.create({
      bookingId: parsed.bookingId,
      razorpayPaymentId: booking.razorpayPaymentId,
      amount,
      reason: parsed.reason,
      status: "approved",
      requestedBy: user.email,
      timeline: [{ status: "approved", note: parsed.reason, actedBy: user.email, at: now }],
    });

    booking.latestRefundId = String(refund._id);
    booking.latestRefundStatus = "approved";
    await booking.save();

    return created(refund);
  } catch (err) {
    return handleApiError(err);
  }
}
