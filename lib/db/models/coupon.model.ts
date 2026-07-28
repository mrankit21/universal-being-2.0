/**
 * Coupon Mongoose model (Step 8C, Part 5 — Coupon System).
 *
 * Admin-managed (CRUD under `/api/admin/coupons`), validated automatically
 * by the Booking Engine (`lib/coupons/validate-coupon.ts`) at booking-create
 * time. A coupon can be global (`tripIds: []`) or restricted to specific
 * trips (`tripIds: [...]`). `usedCount` / `perUserUsage` enforce the usage
 * caps; both update only after a booking successfully applies the coupon,
 * never speculatively.
 */
import { Schema, model, models, type Model, type Document } from "mongoose";

export type CouponType = "percentage" | "flat";

export interface CouponDocument extends Document {
  code: string; // stored uppercase, unique
  description?: string;
  type: CouponType;
  value: number; // percent (0-100) or flat rupee amount, per `type`
  minAmount: number; // minimum bookingAmountDue/totalAmount to qualify
  maxDiscount?: number; // cap on discount for percentage coupons
  startDate?: string;
  endDate?: string;
  usageLimit?: number; // total redemptions across all users, undefined = unlimited
  usedCount: number;
  perUserLimit?: number; // redemptions per customerEmail, undefined = unlimited
  tripIds: string[]; // empty = valid for every trip (global)
  active: boolean;
  /** True for at most one coupon at a time — the admin toggle that decides
   * "this is the code shown in the site-wide promo popup." Enforced in the
   * PATCH route (setting this true on one coupon flips it false on every
   * other), not here, since Mongoose has no cross-document constraint. */
  showInPopup: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

const CouponSchema = new Schema<CouponDocument>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String },
    type: { type: String, enum: ["percentage", "flat"], required: true },
    value: { type: Number, required: true, min: 0 },
    minAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number },
    startDate: { type: String },
    endDate: { type: String },
    usageLimit: { type: Number },
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number },
    tripIds: { type: [String], default: [] },
    active: { type: Boolean, default: true },
    showInPopup: { type: Boolean, default: false, index: true },
    createdBy: { type: String },
  },
  { timestamps: true }
);

export const CouponModel: Model<CouponDocument> =
  models.Coupon || model<CouponDocument>("Coupon", CouponSchema);

/** Per-user redemption ledger — separate from the Coupon doc itself so
 * concurrent redemptions across different users never contend on the same
 * document, and so `perUserLimit` can be enforced with a simple count query
 * instead of growing an unbounded array on the coupon. */
export interface CouponRedemptionDocument extends Document {
  couponId: string;
  couponCode: string;
  bookingId: string;
  customerEmail: string;
  discountAmount: number;
  createdAt: string;
  updatedAt: string;
}

const CouponRedemptionSchema = new Schema<CouponRedemptionDocument>(
  {
    couponId: { type: String, required: true, index: true },
    couponCode: { type: String, required: true, index: true },
    bookingId: { type: String, required: true, index: true },
    customerEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    discountAmount: { type: Number, required: true },
  },
  { timestamps: true }
);

export const CouponRedemptionModel: Model<CouponRedemptionDocument> =
  models.CouponRedemption || model<CouponRedemptionDocument>("CouponRedemption", CouponRedemptionSchema);
