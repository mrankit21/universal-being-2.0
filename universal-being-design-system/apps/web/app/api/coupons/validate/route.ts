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
import { couponValidateRateLimit } from "@/lib/rate-limit/client";
import { enforceRateLimit } from "@/lib/rate-limit/enforce";
import { getClientIp } from "@/lib/rate-limit/get-client-ip";
import { isIpWhitelisted } from "@/lib/rate-limit/whitelist";

export async function POST(req: NextRequest) {
  try {
    // 10/min per IP — this is a public, unauthenticated, informational
    // endpoint that still costs a DB read per call, so it's worth capping
    // even though it's not the authoritative coupon check.
    const ip = getClientIp(req);
    const limited = await enforceRateLimit(
      couponValidateRateLimit,
      ip,
      "Too many requests. Please wait a moment and try again.",
      { bypass: isIpWhitelisted(ip) }
    );
    if (limited) return limited;

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
