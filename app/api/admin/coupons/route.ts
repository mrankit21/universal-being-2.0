/** GET/POST /api/admin/coupons — Coupon System admin CRUD (Step 8C, Part 5). */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { CouponModel } from "@/lib/db/models/coupon.model";
import { couponCreateSchema } from "@/lib/validators/coupon.schema";
import { ok, created, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("coupons:read");
    await connectToDatabase();
    const { searchParams } = req.nextUrl;
    const active = searchParams.get("active");
    const filter: Record<string, unknown> = {};
    if (active === "true") filter.active = true;
    if (active === "false") filter.active = false;

    const coupons = await CouponModel.find(filter).sort({ createdAt: -1 }).lean();
    return ok(coupons);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("coupons:write");
    await connectToDatabase();
    const parsed = couponCreateSchema.parse(await req.json());

    const existing = await CouponModel.findOne({ code: parsed.code.toUpperCase() }).lean();
    if (existing) return fail("A coupon with this code already exists.", 409);

    const coupon = await CouponModel.create({
      ...parsed,
      code: parsed.code.toUpperCase(),
      tripIds: parsed.tripIds ?? [],
      active: parsed.active ?? true,
      createdBy: user.email,
    });

    return created(coupon);
  } catch (err) {
    return handleApiError(err);
  }
}
