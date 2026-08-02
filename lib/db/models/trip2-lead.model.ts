/**
 * Trip2Lead Mongoose model — captures the Name / WhatsApp / Destination /
 * Travel Timing a visitor submits in `LetsPlanYourTripV2`
 * ("Let's Plan Your Trip", the end-of-page callback card added 2026-07).
 * Kept separate from `PromoLead` (the site-wide popup's lead capture)
 * since this one carries trip-planning context — destination and travel
 * timing — that a coupon-popup lead never has, and is scoped to a
 * specific Trip 2.0 page via `tripSlug`. Same reasoning as keeping
 * `Trip2Model` separate from `TripModel`: different shape, different
 * surface, easier to reason about and query independently.
 */
import { Schema, model, models, type Model, type Document } from "mongoose";

export interface Trip2LeadDocument extends Document {
  name: string;
  whatsappNumber: string;
  destination: string;
  travelTiming?: string;
  tripSlug?: string;
  source?: string;
  contacted: boolean;
  createdAt: string;
  updatedAt: string;
}

const Trip2LeadSchema = new Schema<Trip2LeadDocument>(
  {
    name: { type: String, required: true },
    whatsappNumber: { type: String, required: true, index: true },
    destination: { type: String, required: true },
    travelTiming: { type: String },
    tripSlug: { type: String, index: true },
    source: { type: String },
    // Lets the admin panel mark a lead as "called back" without deleting
    // it — a lightweight follow-up queue rather than a full CRM.
    contacted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Trip2LeadModel: Model<Trip2LeadDocument> =
  models.Trip2Lead || model<Trip2LeadDocument>("Trip2Lead", Trip2LeadSchema);
