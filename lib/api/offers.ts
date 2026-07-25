import { cache } from "react";

import { isDatabaseConfigured, connectToDatabase } from "@/lib/db/mongoose";
import { CouponModel, type CouponDocument } from "@/lib/db/models";

export interface PublicOffer {
  code: string;
  description?: string;
  type: "percentage" | "flat";
  value: number;
  minAmount: number;
  maxDiscount?: number;
  endDate?: string;
}

function toPublicOffer(doc: CouponDocument): PublicOffer {
  return {
    code: doc.code,
    description: doc.description,
    type: doc.type,
    value: doc.value,
    minAmount: doc.minAmount,
    maxDiscount: doc.maxDiscount,
    endDate: doc.endDate,
  };
}

/**
 * Active, currently-valid coupons for the public `/offers` page — same
 * "active" + date-window rules `validateCoupon` enforces at booking time,
 * just without a specific trip/amount to check against. Falls back to an
 * empty list (never throws) when no database is configured, same pattern
 * as `lib/api/trips.ts`, so the page still renders in local dev.
 */
export const getActiveOffers = cache(async function getActiveOffers(): Promise<PublicOffer[]> {
  if (!isDatabaseConfigured()) return [];

  try {
    await connectToDatabase();
    const today = new Date().toISOString().slice(0, 10);
    const docs = await CouponModel.find({
      active: true,
      $and: [
        { $or: [{ startDate: { $exists: false } }, { startDate: { $lte: today } }] },
        { $or: [{ endDate: { $exists: false } }, { endDate: { $gte: today } }] },
      ],
    })
      .sort({ createdAt: -1 })
      .lean<CouponDocument[]>();

    return docs
      .filter((doc) => doc.usageLimit === undefined || doc.usedCount < doc.usageLimit)
      .map(toPublicOffer);
  } catch {
    // Database configured but unreachable — degrade to empty state rather
    // than crashing the page.
    return [];
  }
});
