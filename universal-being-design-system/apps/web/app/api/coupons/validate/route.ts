/**
 * POST /api/coupons/validate — Step 8C, Part 5. Public, informational
 * endpoint the booking form calls when the customer clicks "Apply" so they
 * see the discount before submitting. Not the authoritative check —
 * `/api/bookings` re-validates and re-applies server-side at booking-create
 * time regardless of what this endpoint returned, so this can never be
 * used to book at a discount that wasn't actually valid.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { couponValidateSchema } from "@/lib/validators/coupon.schema";
import { validateCoupon } from "@/lib/coupons/validate-coupon";
import { ok, handleApiError } from "@/lib/api-helpers/respond";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const parsed = couponValidateSchema.parse(await req.json());
    const result = await validateCoupon(parsed);
    return ok({
      valid: result.valid,
      reason: result.reason,
      discountAmount: result.discountAmount,
      code: result.coupon?.code,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
