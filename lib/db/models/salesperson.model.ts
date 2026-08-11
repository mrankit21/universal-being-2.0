/**
 * Salesperson model — a small, admin-managed list of names used to assign
 * leads (Trip2Lead / PromoLead) to whoever is following up on them. Kept
 * as its own tiny collection (rather than a hardcoded enum) so admins can
 * add/remove salespeople from the Leads page without a code change —
 * same reasoning as Announcement's `kind` list being data, not an enum
 * baked into the UI.
 */
import mongoose, { Schema, model, type Model, type Document } from "mongoose";
const models = mongoose.models;

export interface SalespersonDocument extends Document {
  name: string;
  createdAt: string;
  updatedAt: string;
}

const SalespersonSchema = new Schema<SalespersonDocument>(
  { name: { type: String, required: true, unique: true, trim: true } },
  { timestamps: true }
);

export const SalespersonModel: Model<SalespersonDocument> =
  models.Salesperson || model<SalespersonDocument>("Salesperson", SalespersonSchema);
