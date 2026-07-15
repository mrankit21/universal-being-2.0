/**
 * POST /api/bookings/[id]/refund-request — Step 8C, Part 6.
 *
 * Customer-initiated: creates a `Refund` record in the `requested` state.
 * No money moves and no booking status changes here — that only happens
 * once an admin approves and processes it (`/api/admin/refunds/[id]`),
 * per the spec's "No manual database editing" / full-timeline requirement.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { BookingModel } from "@/lib/db/models/booking.model";
import { RefundModel } from "@/lib/db/models/refund.model";
import { refundRequestSchema } from "@/lib/validators/refund.schema";
import { ok, created, fail, handleApiError } from "@/lib/api-helpers/respond";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const parsed = refundRequestSchema.parse(await req.json());

    const booking = await BookingModel.findById(id);
    if (!booking) return fail("Booking not found", 404);
    if (booking.customerEmail.toLowerCase() !== parsed.customerEmail.toLowerCase()) {
      return fail("This booking doesn't match the email provided.", 403);
    }
    if (booking.paymentStatus !== "paid") {
      return fail("Only paid bookings are eligible for a refund request.", 409);
    }

    const existingOpen = await RefundModel.findOne({
      bookingId: id,
      status: { $in: ["requested", "approved"] },
    }).lean();
    if (existingOpen) return fail("A refund request for this booking is already in progress.", 409);

    const amount = Math.min(parsed.amount ?? booking.amountPaid, booking.amountPaid);
    const now = new Date().toISOString();

    const refund = await RefundModel.create({
      bookingId: id,
      razorpayPaymentId: booking.razorpayPaymentId,
      amount,
      reason: parsed.reason,
      status: "requested",
      requestedBy: parsed.customerEmail,
      timeline: [{ status: "requested", note: parsed.reason, actedBy: "customer", at: now }],
    });

    booking.latestRefundId = String(refund._id);
    booking.latestRefundStatus = "requested";
    booking.statusHistory = [
      ...(booking.statusHistory ?? []),
      { status: booking.status, note: "Customer requested a refund.", changedAt: now },
    ];
    await booking.save();

    return created(refund);
  } catch (err) {
    return handleApiError(err);
  }
}

/** GET — lets the customer check their refund request's status by id. */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const refunds = await RefundModel.find({ bookingId: id }).sort({ createdAt: -1 }).lean();
    return ok(refunds);
  } catch (err) {
    return handleApiError(err);
  }
}
