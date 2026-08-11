/**
 * PromoLead Mongoose model — captures the Full Name + WhatsApp Number a
 * visitor submits in the site-wide promotional popup
 * (`components/marketing/promo-offer-popup.tsx`) in exchange for a coupon
 * code. Kept separate from `Customer` (lib/db/models/customer.model.ts)
 * because a lead hasn't created an account and may never book — this is a
 * marketing capture, not an auth identity.
 */
import mongoose, { Schema, model, type Model, type Document } from "mongoose";
const models = mongoose.models;

export interface PromoLeadDocument extends Document {
  fullName: string;
  whatsappNumber: string;
  couponCode: string;
  source?: string;
  contacted: boolean;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

const PromoLeadSchema = new Schema<PromoLeadDocument>(
  {
    fullName: { type: String, required: true },
    whatsappNumber: { type: String, required: true, index: true },
    couponCode: { type: String, required: true },
    source: { type: String },
    // Mirrors Trip2Lead's `contacted` flag so both lead types share one
    // admin follow-up queue (see app/api/admin/leads).
    contacted: { type: Boolean, default: false },
    // See the matching comment on Trip2LeadDocument — plain Salesperson
    // name, not an ObjectId ref.
    assignedTo: { type: String },
  },
  { timestamps: true }
);

export const PromoLeadModel: Model<PromoLeadDocument> =
  models.PromoLead || model<PromoLeadDocument>("PromoLead", PromoLeadSchema);
