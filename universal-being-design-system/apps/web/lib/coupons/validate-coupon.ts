/**
 * Coupon System (Step 8C, Part 5) — validation + discount computation.
 *
 * Single choke point both `/api/coupons/validate` (client-side "Apply"
 * button, informational) and `/api/bookings` (server-side, authoritative)
 * call, so a coupon can never be accepted by one path and rejected by the
 * other. Reads-only here — actually recording a redemption
 * (`usedCount` increment + `CouponRedemption` row) happens separately, via
 * `redeemCoupon`, which does its own atomic re-check of the usage limit
 * (see that function's docstring) since a plain read here can go stale
 * between validation and redemption under concurrent load.
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

/**
 * Records a successful redemption — call only once a booking slot has
 * already been reserved (mirrors the seat-reservation pattern in
 * `app/api/bookings/route.ts`: reserve the resource atomically, *then*
 * create the record that depends on it).
 *
 * The `usedCount` increment is done via a conditional `findOneAndUpdate`
 * rather than `validateCoupon`'s earlier plain read + a later unconditional
 * `$inc` — that combination is a classic check-then-act race: two concurrent
 * bookings can both read `usedCount < usageLimit` as true before either one
 * writes, and both then increment, letting a `usageLimit: 1` coupon be used
 * twice. Folding the "is there still a slot" check into the same atomic
 * `findOneAndUpdate` that performs the increment closes that window — the
 * query filter and the write happen as one indivisible operation on
 * MongoDB's side, so only one concurrent caller can ever match a coupon
 * whose last slot is being taken.
 *
 * Returns `false` (no redemption recorded) if the limit was hit by a
 * concurrent request in between validation and this call — the caller must
 * treat that as a failed coupon application, not a fatal error.
 */
export async function redeemCoupon(params: {
  coupon: CouponDocument;
  bookingId: string;
  customerEmail: string;
  discountAmount: number;
}): Promise<boolean> {
  // Unset/0 usageLimit means "no limit" — expressed explicitly via $ifNull
  // so a missing field and a literal 0 are both treated as unlimited,
  // matching validateCoupon's `if (coupon.usageLimit && ...)` read-time
  // check. Otherwise, only match (and therefore only increment) if
  // usedCount is still strictly less than usageLimit at write time.
  const updated = await CouponModel.findOneAndUpdate(
    {
      _id: params.coupon._id,
      $expr: {
        $or: [
          { $eq: [{ $ifNull: ["$usageLimit", 0] }, 0] },
          { $lt: ["$usedCount", "$usageLimit"] },
        ],
      },
    },
    { $inc: { usedCount: 1 } },
    { new: true }
  );

  if (!updated) {
    // Limit was hit by a concurrent request between validateCoupon() and
    // this call. No document matched, so nothing was incremented and no
    // redemption record is created — the caller must undo whatever it
    // reserved on the assumption this would succeed.
    return false;
  }

  await CouponRedemptionModel.create({
    couponId: String(params.coupon._id),
    couponCode: params.coupon.code,
    bookingId: params.bookingId,
    customerEmail: params.customerEmail.toLowerCase(),
    discountAmount: params.discountAmount,
  });
  return true;
}

/**
 * Reverses a redemption made by `redeemCoupon()` for a booking that never
 * completed payment (expired reservation, or admin cancellation before
 * payment). Mirrors the compensating-transaction pattern already used for
 * seats in `app/api/bookings/route.ts`'s `catch (createErr)` block —
 * anything reserved atomically on the assumption a booking would succeed
 * must be given back if it doesn't.
 *
 * No-ops (returns `false`) if the booking never actually had a coupon
 * applied, or if this has already been released — callers don't need to
 * guard the call themselves, and it's safe to call more than once for the
 * same booking (lazy expiry, cron sweep, admin cancel can all race) without
 * double-decrementing `usedCount`: the `findOneAndDelete` only ever
 * succeeds once per `bookingId`, and the `usedCount` decrement only runs
 * when that delete actually removed a row.
 */
export async function releaseCouponRedemption(bookingId: string): Promise<boolean> {
  const redemption = await CouponRedemptionModel.findOneAndDelete({ bookingId });
  if (!redemption) return false; // no coupon was applied, or already released

  await CouponModel.updateOne({ _id: redemption.couponId }, { $inc: { usedCount: -1 } }).catch(() => null);

  return true;
}
