/** Announcement Mongoose model — DB mirror of `types/layout.ts`'s
 * `AnnouncementConfig`, extended with the admin-only `enabled`/`expiresAt`
 * fields requirement #6 asks for. */
import mongoose, { Schema, model, type Model, type Document } from "mongoose";
const models = mongoose.models;
import { ImageAssetSchema } from "./shared.schemas";

export interface AnnouncementDocument extends Document {
  kind: "trip" | "offer" | "coupon" | "limited-seats" | "festival";
  message: string;
  href?: string;
  linkLabel?: string;
  dismissible: boolean;
  enabled: boolean;
  expiresAt?: string;
  /** Optional Banner Image (Step 7.6B §6), sourced from the Media Library. */
  image?: unknown;
  createdAt: string;
  updatedAt: string;
}

const AnnouncementSchema = new Schema<AnnouncementDocument>(
  {
    kind: {
      type: String,
      enum: ["trip", "offer", "coupon", "limited-seats", "festival"],
      required: true,
      default: "offer",
    },
    message: { type: String, required: true },
    href: { type: String },
    linkLabel: { type: String },
    dismissible: { type: Boolean, default: true },
    enabled: { type: Boolean, default: true, index: true },
    expiresAt: { type: String },
    image: { type: ImageAssetSchema },
  },
  { timestamps: true }
);

export const AnnouncementModel: Model<AnnouncementDocument> =
  models.Announcement || model<AnnouncementDocument>("Announcement", AnnouncementSchema);
