/**
 * PATCH /api/admin/refunds/[id] — Step 8C, Part 6 + Part 11 + Part 12.
 *
 * Drives the refund lifecycle: requested -> approved -> processed, or
 * requested/approved -> rejected. `processed` is the only transition that
 * actually calls Razorpay (`createRefund`) and moves money — every other
 * transition just records a timeline entry. Guarded against double-
 * processing: a refund that already has `razorpayRefundId` set can't be
 * processed again (Part 12 — "Invalid Refund Requests").
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { RefundModel } from "@/lib/db/models/refund.model";
import { BookingModel } from "@/lib/db/models/booking.model";
import { refundUpdateSchema } from "@/lib/validators/refund.schema";
import { createRefund, isRazorpayConfigured } from "@/lib/payments/razorpay";
import { logPaymentEvent } from "@/lib/payments/payment-history";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

type Params = { params: Promise<{ id: string }> };

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  requested: ["approved", "rejected"],
  approved: ["processed", "rejected"],
  rejected: [],
  processed: [],
};

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requirePermission("refunds:write");
    await connectToDatabase();
    const { id } = await params;
    const parsed = refundUpdateSchema.parse(await req.json());

    const refund = await RefundModel.findById(id);
    if (!refund) return fail("Refund not found", 404);

    if (!ALLOWED_TRANSITIONS[refund.status]?.includes(parsed.status)) {
      return fail(`Cannot move a refund from "${refund.status}" to "${parsed.status}".`, 409);
    }

    const now = new Date().toISOString();

    if (parsed.status === "processed") {
      if (refund.razorpayRefundId) {
        return fail("This refund has already been processed.", 409);
      }
      if (parsed.amount) refund.amount = parsed.amount;

      if (isRazorpayConfigured() && refund.razorpayPaymentId) {
        try {
          const rzpRefund = await createRefund({
            paymentId: refund.razorpayPaymentId,
            amountInRupees: refund.amount,
            notes: { bookingId: refund.bookingId, refundId: String(refund._id) },
          });
          refund.razorpayRefundId = rzpRefund.id;
        } catch (err) {
          return fail(
            `Razorpay refund failed: ${err instanceof Error ? err.message : "unknown error"}`,
            502
          );
        }
      }
      // If Razorpay isn't configured (e.g. a manual/offline booking), the
      // refund is still recorded as processed — admin has handled it
      // outside the gateway (bank transfer, cash) and this is the audit
      // trail for that.

      await BookingModel.findByIdAndUpdate(refund.bookingId, {
        $set: { paymentStatus: "refunded", latestRefundStatus: "processed" },
        $push: {
          statusHistory: { status: "refunded", note: "Refund processed.", changedAt: now, changedBy: user.email },
        },
      });

      await logPaymentEvent({
        bookingId: refund.bookingId,
        type: "refund.processed",
        source: "refund",
        refundId: refund.razorpayRefundId,
        paymentId: refund.razorpayPaymentId,
        amount: refund.amount,
        status: "processed",
        notes: parsed.note,
      }).catch(() => null);
    } else {
      await BookingModel.findByIdAndUpdate(refund.bookingId, { $set: { latestRefundStatus: parsed.status } });
    }

    refund.status = parsed.status;
    refund.timeline = [...(refund.timeline ?? []), { status: parsed.status, note: parsed.note, actedBy: user.email, at: now }];
    await refund.save();

    return ok(refund);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requirePermission("refunds:read");
    await connectToDatabase();
    const { id } = await params;
    const refund = await RefundModel.findById(id).lean();
    if (!refund) return fail("Refund not found", 404);
    return ok(refund);
  } catch (err) {
    return handleApiError(err);
  }
}
