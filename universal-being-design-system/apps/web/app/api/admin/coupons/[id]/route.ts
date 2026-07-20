import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { CouponModel } from "@/lib/db/models/coupon.model";
import { couponUpdateSchema } from "@/lib/validators/coupon.schema";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requirePermission("coupons:read");
    await connectToDatabase();
    const { id } = await params;
    const coupon = await CouponModel.findById(id).lean();
    if (!coupon) return fail("Coupon not found", 404);
    return ok(coupon);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requirePermission("coupons:write");
    await connectToDatabase();
    const { id } = await params;
    const parsed = couponUpdateSchema.parse(await req.json());
    // See destinations/[id]/route.ts — `.partial()` leaves untouched fields
    // as explicit `undefined` rather than omitting them, which Mongoose
    // would otherwise $set (i.e. unset) on the document. No runValidators
    // here so this wasn't throwing, but it was still silently wiping other
    // fields on every partial edit.
    const update = Object.fromEntries(Object.entries(parsed).filter(([, v]) => v !== undefined));

    if (parsed.code) {
      const dupe = await CouponModel.findOne({ code: parsed.code.toUpperCase(), _id: { $ne: id } }).lean();
      if (dupe) return fail("A coupon with this code already exists.", 409);
    }

    const coupon = await CouponModel.findByIdAndUpdate(
      id,
      { ...update, ...(parsed.code ? { code: parsed.code.toUpperCase() } : {}) },
      { new: true }
    );
    if (!coupon) return fail("Coupon not found", 404);
    return ok(coupon);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requirePermission("coupons:write");
    await connectToDatabase();
    const { id } = await params;
    // Soft-delete via `active: false` rather than a hard delete — a coupon
    // that was already redeemed needs to stay resolvable for
    // `CouponRedemption` history / reporting.
    const coupon = await CouponModel.findByIdAndUpdate(id, { active: false }, { new: true });
    if (!coupon) return fail("Coupon not found", 404);
    return ok(coupon);
  } catch (err) {
    return handleApiError(err);
  }
}
