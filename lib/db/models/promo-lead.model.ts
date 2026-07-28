/**
 * PromoLead Mongoose model — captures the Full Name + WhatsApp Number a
 * visitor submits in the site-wide promotional popup
 * (`components/marketing/promo-offer-popup.tsx`) in exchange for a coupon
 * code. Kept separate from `Customer` (lib/db/models/customer.model.ts)
 * because a lead hasn't created an account and may never book — this is a
 * marketing capture, not an auth identity.
 */
import { Schema, model, models, type Model, type Document } from "mongoose";

export interface PromoLeadDocument extends Document {
  fullName: string;
  whatsappNumber: string;
  couponCode: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

const PromoLeadSchema = new Schema<PromoLeadDocument>(
  {
    fullName: { type: String, required: true },
    whatsappNumber: { type: String, required: true, index: true },
    couponCode: { type: String, required: true },
    source: { type: String },
  },
  { timestamps: true }
);

export const PromoLeadModel: Model<PromoLeadDocument> =
  models.PromoLead || model<PromoLeadDocument>("PromoLead", PromoLeadSchema);
