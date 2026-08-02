/** Theme Mongoose model — DB mirror of `types/theme.ts`'s `ThemeConfig`
 * (Architecture §4: "One ThemeConfig per mood... stored in data/themes/*.ts
 * and mirrored in DB so admins can tune it without a deploy"). Stored as a
 * flexible `Mixed` config blob keyed by the same field names as `ThemeConfig`
 * so the Theme Engine can consume it with zero mapping — only the admin
 * Theme Management UI and this model need to know about persistence. */
import mongoose, { Schema, model, type Model, type Document } from "mongoose";
const models = mongoose.models;

export interface ThemeDocument extends Document {
  key: string;
  name: string;
  config: Record<string, unknown>; // full ThemeConfig minus `key`/`name`, kept flexible for admin tuning
  isSeasonal: boolean;
  seasonalStart?: string; // MM-DD
  seasonalEnd?: string; // MM-DD
  isActiveHomepageTheme: boolean;
  createdAt: string;
  updatedAt: string;
}

const ThemeSchema = new Schema<ThemeDocument>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
      enum: ["brand", "rajasthan", "winter", "monsoon", "beach", "mountain", "forest"],
    },
    name: { type: String, required: true },
    config: { type: Schema.Types.Mixed, required: true },
    isSeasonal: { type: Boolean, default: false },
    seasonalStart: { type: String },
    seasonalEnd: { type: String },
    isActiveHomepageTheme: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ThemeModel: Model<ThemeDocument> = models.Theme || model<ThemeDocument>("Theme", ThemeSchema);
