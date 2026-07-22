/** GET /api/admin/bookings/[id]/payment-history — Step 8C, Part 4 (full detail,
 * including raw webhook payloads, for admin troubleshooting). */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { getPaymentHistory } from "@/lib/payments/payment-history";
import { RefundModel } from "@/lib/db/models/refund.model";
import { ok, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requirePermission("bookings:read");
    await connectToDatabase();
    const { id } = await params;
    const [events, refunds] = await Promise.all([
      getPaymentHistory(id),
      RefundModel.find({ bookingId: id }).sort({ createdAt: -1 }).lean(),
    ]);
    return ok({ events, refunds });
  } catch (err) {
    return handleApiError(err);
  }
}
