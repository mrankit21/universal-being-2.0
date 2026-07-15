/**
 * Coupon System (Step 8C, Part 5) — validation + discount computation.
 *
 * Single choke point both `/api/coupons/validate` (client-side "Apply"
 * button, informational) and `/api/bookings` (server-side, authoritative)
 * call, so a coupon can never be accepted by one path and rejected by the
 * other. Reads-only here — actually recording a redemption
 * (`usedCount` increment + `CouponRedemption` row) happens separately, only
 * once a booking is durably created, via `redeemCoupon`.
 */
import { CouponModel, CouponRedemptionModel } from "@/lib/db/models/coupon.model";
import type { CouponDocument } from "@/lib/db/models/coupon.model";

export interface CouponValidationResult {
  valid: boolean;
  reason?: string;
  coupon?: CouponDocument;
  discountAmount: number;
}

export async function validateCoupon(params: {
  code: string;
  tripId: string;
  customerEmail: string;
  amount: number;
}): Promise<CouponValidationResult> {
  const code = params.code.trim().toUpperCase();
  if (!code) return { valid: false, reason: "Enter a coupon code.", discountAmount: 0 };

  const coupon = await CouponModel.findOne({ code });
  if (!coupon) return { valid: false, reason: "Coupon not found.", discountAmount: 0 };
  if (!coupon.active) return { valid: false, reason: "This coupon is no longer active.", discountAmount: 0 };

  const now = Date.now();
  if (coupon.startDate && new Date(coupon.startDate).getTime() > now) {
    return { valid: false, reason: "This coupon isn't active yet.", discountAmount: 0 };
  }
  if (coupon.endDate && new Date(coupon.endDate).getTime() < now) {
    return { valid: false, reason: "This coupon has expired.", discountAmount: 0 };
  }
  if (coupon.tripIds.length > 0 && !coupon.tripIds.includes(params.tripId)) {
    return { valid: false, reason: "This coupon isn't valid for this trip.", discountAmount: 0 };
  }
  if (params.amount < (coupon.minAmount || 0)) {
    return {
      valid: false,
      reason: `This coupon requires a minimum amount of ${coupon.minAmount}.`,
      discountAmount: 0,
    };
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, reason: "This coupon has reached its usage limit.", discountAmount: 0 };
  }
  if (coupon.perUserLimit) {
    const userUses = await CouponRedemptionModel.countDocuments({
      couponId: String(coupon._id),
      customerEmail: params.customerEmail.toLowerCase(),
    });
    if (userUses >= coupon.perUserLimit) {
      return { valid: false, reason: "You've already used this coupon the maximum number of times.", discountAmount: 0 };
    }
  }

  let discountAmount =
    coupon.type === "percentage" ? Math.round((params.amount * coupon.value) / 100) : Math.round(coupon.value);
  if (coupon.type === "percentage" && coupon.maxDiscount) {
    discountAmount = Math.min(discountAmount, coupon.maxDiscount);
  }
  discountAmount = Math.min(discountAmount, params.amount);

  return { valid: true, coupon, discountAmount };
}

/** Records a successful redemption — call only after the booking that used
 * this coupon has actually been created/paid, never speculatively. */
export async function redeemCoupon(params: {
  coupon: CouponDocument;
  bookingId: string;
  customerEmail: string;
  discountAmount: number;
}): Promise<void> {
  await CouponModel.updateOne({ _id: params.coupon._id }, { $inc: { usedCount: 1 } });
  await CouponRedemptionModel.create({
    couponId: String(params.coupon._id),
    couponCode: params.coupon.code,
    bookingId: params.bookingId,
    customerEmail: params.customerEmail.toLowerCase(),
    discountAmount: params.discountAmount,
  });
}
