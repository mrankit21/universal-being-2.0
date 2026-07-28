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
    const body = await req.json();
    const parsed = couponUpdateSchema.parse(body);
    // Only forward keys the client actually sent in the RAW body. Filtering
    // on `v !== undefined` is not enough: fields with a `.default()` (e.g.
    // `active`) get that default silently applied by zod even when the
    // client never sent the key, so they come back *defined* and slip
    // through a definedness filter — overwriting the real value. Checking
    // the pre-zod `body` for the key is the only reliable way to tell
    // "client sent this" from "zod defaulted this".
    const update = Object.fromEntries(
      Object.entries(parsed).filter(([k]) => Object.prototype.hasOwnProperty.call(body, k))
    );

    if (parsed.code) {
      const dupe = await CouponModel.findOne({ code: parsed.code.toUpperCase(), _id: { $ne: id } }).lean();
      if (dupe) return fail("A coupon with this code already exists.", 409);
    }

    // Only one coupon can be "the" popup coupon at a time — the admin
    // toggle reads as a single on/off switch per coupon, but under the
    // hood turning it on here means turning it off everywhere else, so
    // the popup never has two candidates to choose between.
    if (update.showInPopup === true) {
      await CouponModel.updateMany({ _id: { $ne: id }, showInPopup: true }, { showInPopup: false });
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
