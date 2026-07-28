/**
 * GET /api/coupons/popup-active — public, unauthenticated. Returns the one
 * coupon an admin has flagged "Show in Popup" (Coupons admin page), if it's
 * also currently `active` and within its date window — or `null` if there
 * isn't one, in which case `PromoOfferPopup` renders nothing at all.
 *
 * If the coupon is trip-scoped (`tripIds` non-empty), also resolves those
 * IDs to trip titles here, so the popup can say "Valid on: Manali
 * Getaway" instead of a generic "select trips only" — resolving names
 * server-side means the popup never has to ship or expose raw Mongo IDs.
 *
 * Deliberately returns only what a visitor is allowed to see (code +
 * display copy), never the admin-only fields (usage counts, createdBy,
 * etc.) that `/api/admin/coupons` exposes.
 */
import { connectToDatabase } from "@/lib/db/mongoose";
import { CouponModel } from "@/lib/db/models/coupon.model";
import { TripModel } from "@/lib/db/models/trip.model";
import { ok, handleApiError } from "@/lib/api-helpers/respond";

export async function GET() {
  try {
    await connectToDatabase();
    const now = new Date().toISOString();

    const coupon = await CouponModel.findOne({
      showInPopup: true,
      active: true,
      $and: [
        { $or: [{ startDate: { $exists: false } }, { startDate: "" }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: { $exists: false } }, { endDate: "" }, { endDate: { $gte: now } }] },
      ],
    }).lean();

    if (!coupon) return ok(null);

    // Resolve trip titles server-side rather than making the popup do a
    // second round-trip (or ship raw Mongo IDs to a visitor) — the popup
    // only ever needs to display names, never the IDs themselves.
    let tripNames: string[] = [];
    if (coupon.tripIds.length > 0) {
      const trips = await TripModel.find({ _id: { $in: coupon.tripIds } }, { title: 1 }).lean();
      tripNames = trips.map((t) => t.title);
    }

    return ok({
      code: coupon.code,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      tripNames,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
