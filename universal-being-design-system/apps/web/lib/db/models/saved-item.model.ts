/**
 * SavedItem Mongoose model — a customer's wishlist/save entries. Each
 * document is one (customer, itemType, itemSlug) pair — a customer
 * hearting a trip or destination card. Mirrors the same slug-referencing
 * pattern the rest of the app uses (e.g. `Trip.destinationSlug`) instead
 * of storing a duplicate copy of the trip/destination data: `/saved`
 * re-hydrates against `lib/api/trips.ts` / `lib/api/destinations.ts` at
 * read time, so admin edits to a trip are always reflected.
 */
import { Schema, model, models, type Model, type Document } from "mongoose";

export type SavedItemType = "trip" | "destination";

export interface SavedItemDocument extends Document {
  customerId: string;
  itemType: SavedItemType;
  itemSlug: string;
  createdAt: string;
  updatedAt: string;
}

const SavedItemSchema = new Schema<SavedItemDocument>(
  {
    customerId: { type: String, required: true, index: true },
    itemType: { type: String, enum: ["trip", "destination"], required: true },
    itemSlug: { type: String, required: true },
  },
  { timestamps: true }
);

// A customer can only save the same trip/destination once — the POST
// route treats an 11000 duplicate-key error as "already saved" (idempotent).
SavedItemSchema.index({ customerId: 1, itemType: 1, itemSlug: 1 }, { unique: true });

export const SavedItemModel: Model<SavedItemDocument> =
  models.SavedItem || model<SavedItemDocument>("SavedItem", SavedItemSchema);
