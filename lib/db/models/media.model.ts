/**
 * MediaAsset Mongoose model — the Media Library's record store, and the
 * single source of truth for every image used across the site (Step 7.6A —
 * Media CMS Foundation). Mirrors the `ImageAsset` shape (Architecture §13)
 * plus DAM-only bookkeeping (title/slug, category, tags, usage references)
 * so the same asset object that gets embedded on a Trip/Destination/
 * Homepage doc can also be listed, searched, previewed, replaced, and
 * reused from the Media Library grid.
 *
 * NOTE — scope: this model intentionally does not add a `mediaId` back-ref
 * on Trip/Destination/Homepage/Testimonial documents. Those collections are
 * out of scope for this phase (see Step 7.6A spec: "Do NOT connect Media
 * Library to Homepage/Trips/Destinations — that happens in 7.6B"). Instead,
 * `usageReferences` is computed read-only by scanning those collections for
 * matching image URLs (see `lib/media/usage.ts`) and cached back onto the
 * asset whenever it's read, so callers get an always-fresh "Used In" list
 * without this phase touching any other collection's schema.
 */
import mongoose, { Schema, model, type Model, type Document } from "mongoose";
const models = mongoose.models;

/** Media Library categories (Step 7.6A spec). Kept distinct from the older,
 * coarser `folder` enum — `folder` is retained only so pre-7.6A documents
 * keep validating; new code should read/write `category`. */
export const MEDIA_CATEGORIES = [
  "homepage-hero",
  "trip-hero",
  "trip-gallery",
  "destination-hero",
  "destination-gallery",
  "logos",
  "icons",
  "banners",
  "general",
  "future-videos",
  "trip-section-backdrop",
] as const;

export type MediaCategory = (typeof MEDIA_CATEGORIES)[number];

export const MEDIA_CATEGORY_LABELS: Record<MediaCategory, string> = {
  "homepage-hero": "Homepage Hero",
  "trip-hero": "Trip Hero",
  "trip-gallery": "Trip Gallery",
  "destination-hero": "Destination Hero",
  "destination-gallery": "Destination Gallery",
  logos: "Logos",
  icons: "Icons",
  banners: "Banners",
  general: "General",
  "future-videos": "Future Videos",
  "trip-section-backdrop": "Trip Section Backdrop",
};

/** Legacy folder → new category mapping, used only as a read-time fallback
 * for documents created before this phase. */
export const LEGACY_FOLDER_TO_CATEGORY: Record<string, MediaCategory> = {
  destinations: "destination-gallery",
  gallery: "trip-gallery",
  hero: "trip-hero",
  logos: "logos",
  general: "general",
};

export type MediaFolder = "destinations" | "gallery" | "hero" | "logos" | "general";

/** One resolved "where is this used" entry. Computed, not hand-maintained. */
export interface MediaUsageReference {
  model: "Trip" | "Destination" | "Homepage" | "Testimonial" | "Announcement" | "SiteSettings";
  id: string;
  label: string;
  field: string;
  href?: string;
}

export interface MediaDocument extends Document {
  provider: "imagekit" | "cloudinary" | "local" | "placeholder";
  publicId?: string;
  url: string;
  thumbnailUrl?: string;
  title: string;
  slug: string;
  alt: string;
  width: number;
  height: number;
  blurHash?: string;
  /** @deprecated use `category` */
  folder?: MediaFolder;
  category: MediaCategory;
  /** Where this asset was uploaded from — keeps the Media Library page and
   * a Trip's own per-trip uploads from ever mixing. "library" = uploaded
   * from the main Media Library page (default, unchanged legacy behavior).
   * "trip" = uploaded directly from a specific Trip's edit screen; only
   * ever shown back inside that same Trip's editor, never in the Media
   * Library grid. Purely additive — every pre-existing document has no
   * `scope` and is treated as "library" via the schema default. */
  scope: "library" | "trip";
  tags: string[];
  filename: string;
  mimeType?: string;
  bytes?: number;
  uploadedBy?: string;
  usageReferences: MediaUsageReference[];
  usageComputedAt?: Date;
  /** Trip-First CMS wizard (SmartMediaUpload) bookkeeping — optional, only
   * populated when the asset was created through the Asset Type wizard.
   * `assetType` mirrors ASSET_TYPES in components/admin/smart-media-upload;
   * `usage` mirrors USAGE_TYPES there ("trip-hero-image", "gallery-image",
   * "header-logo", etc). Trip assets with a `usage` also get written
   * directly onto the matching Trip field by lib/media/attach-to-trip. */
  assetType?: string;
  relatedTripSlug?: string;
  relatedTripTitle?: string;
  relatedDestinationSlug?: string;
  relatedDestinationName?: string;
  usage?: string;
  heroSlideNumber?: number;
  galleryPosition?: number;
  createdAt: string;
  updatedAt: string;
}

const MediaUsageReferenceSchema = new Schema<MediaUsageReference>(
  {
    model: { type: String, enum: ["Trip", "Destination", "Homepage", "Testimonial", "Announcement", "SiteSettings"], required: true },
    id: { type: String, required: true },
    label: { type: String, required: true },
    field: { type: String, required: true },
    href: { type: String },
  },
  { _id: false }
);

const MediaSchema = new Schema<MediaDocument>(
  {
    // "cloudinary" is kept in the enum only so pre-migration records still
    // validate on read/save — all new uploads write "imagekit".
    provider: { type: String, enum: ["imagekit", "cloudinary", "local", "placeholder"], default: "imagekit" },
    publicId: { type: String },
    url: { type: String, required: true },
    thumbnailUrl: { type: String },
    title: { type: String, required: true, default: "Untitled" },
    slug: { type: String, required: true, index: true },
    alt: { type: String, default: "" },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    blurHash: { type: String },
    // Legacy field — no longer written by new code, kept for old records.
    folder: {
      type: String,
      enum: ["destinations", "gallery", "hero", "logos", "general"],
    },
    category: {
      type: String,
      enum: MEDIA_CATEGORIES,
      default: "general",
      index: true,
    },
    scope: {
      type: String,
      enum: ["library", "trip"],
      default: "library",
      index: true,
    },
    tags: { type: [String], default: [], index: true },
    filename: { type: String, required: true },
    mimeType: { type: String },
    bytes: { type: Number },
    uploadedBy: { type: String },
    usageReferences: { type: [MediaUsageReferenceSchema], default: [] },
    usageComputedAt: { type: Date },
    assetType: { type: String, index: true },
    relatedTripSlug: { type: String, index: true },
    relatedTripTitle: { type: String },
    relatedDestinationSlug: { type: String, index: true },
    relatedDestinationName: { type: String },
    usage: { type: String, index: true },
    heroSlideNumber: { type: Number, min: 1, max: 6 },
    galleryPosition: { type: Number, min: 1, max: 6 },
  },
  { timestamps: true }
);

MediaSchema.index({ title: "text", filename: "text", alt: "text", tags: "text" });

export const MediaModel: Model<MediaDocument> = models.Media || model<MediaDocument>("Media", MediaSchema);
