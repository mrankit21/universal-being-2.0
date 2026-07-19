/** Destination Mongoose model — mirrors `types/destination.ts` (Architecture §3, §14). */
import { Schema, model, models, type Model, type Document } from "mongoose";
import { ImageAssetSchema, SeoSchema } from "./shared.schemas";

export interface DestinationTripAssignmentDoc {
  tripSlug: string;
  order: number;
  featured: boolean;
}

export interface DestinationDocument extends Document {
  slug: string;
  name: string;
  region: string;
  state: string;
  themeKey: string;
  tagline: string;
  shortDescription: string;
  longDescription: string;
  heroImage: unknown;
  heroImageMobile?: unknown;
  coverImage: unknown;
  thumbnail?: unknown;
  gallery: unknown[];
  bestSeason: string[];
  altitude?: string;
  highlights: string[];
  featured: boolean;
  homepageVisible: boolean;
  tripAssignments: DestinationTripAssignmentDoc[];
  status: "draft" | "published";
  seo: unknown;
  isPlaceholderContent: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Step 7.6C-B Part 2 — Destination ↔ Trip relationship metadata. Membership
 * is still driven by `Trip.destinationSlug` (untouched); this subdocument
 * only carries the destination-scoped extras (display order, "featured
 * within this destination"). See `types/destination.ts` for the full
 * rationale. */
const DestinationTripAssignmentSchema = new Schema(
  {
    tripSlug: { type: String, required: true },
    order: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
  },
  { _id: false }
);

const DestinationSchema = new Schema<DestinationDocument>(
  {
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    region: { type: String, required: true, default: "" },
    state: { type: String, required: true, default: "" },
    themeKey: {
      type: String,
      required: true,
      enum: ["brand", "rajasthan", "winter", "monsoon", "beach", "mountain", "forest", "udaipur", "spiti", "manali", "goa", "jibhi"],
    },
    tagline: { type: String, default: "" },
    shortDescription: { type: String, default: "" },
    longDescription: { type: String, default: "" },
    heroImage: { type: ImageAssetSchema, required: true },
    heroImageMobile: { type: ImageAssetSchema },
    coverImage: { type: ImageAssetSchema, required: true },
    /** Optional — falls back to `coverImage` at the `lib/api/destinations.ts`
     * read layer for destinations created before this field existed. */
    thumbnail: { type: ImageAssetSchema, required: false },
    gallery: { type: [ImageAssetSchema], default: [] },
    bestSeason: { type: [String], default: [] },
    altitude: { type: String },
    highlights: { type: [String], default: [] },
    featured: { type: Boolean, default: false, index: true },
    homepageVisible: { type: Boolean, default: true, index: true },
    tripAssignments: { type: [DestinationTripAssignmentSchema], default: [] },
    status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
    seo: { type: SeoSchema, required: true },
    isPlaceholderContent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const DestinationModel: Model<DestinationDocument> =
  models.Destination || model<DestinationDocument>("Destination", DestinationSchema);
