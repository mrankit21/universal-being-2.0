/**
 * HomepageV2 Mongoose model — single-document collection backing the
 * "Homepage 2.0" admin panel (Hero Parallax, Floating Quick Links,
 * Featured Trips Stack). Kept as its own singleton, separate from
 * `HomepageModel` (the original homepage's CMS), so editing one version
 * never touches the other's content — see `SiteSettingsDocument.activeHomepageVersion`
 * for the toggle that decides which one `app/page.tsx` renders.
 */
import { Schema, model, models, type Model, type Document } from "mongoose";
import { ImageAssetSchema } from "./shared.schemas";

export type QuickLinkVariant = "featured" | "image" | "icon";

export interface HomepageV2GalleryImageDoc {
  image?: unknown;
  title: string;
}

export interface HomepageV2QuickLinkDoc {
  title: string;
  href: string;
  variant: QuickLinkVariant;
  /** Lucide icon name (e.g. "Bus", "MapPinned") — resolved to a component
   * client-side by `components/home/v2/floating-quick-links.tsx`'s
   * `QUICK_LINK_ICONS` map. Only used for "icon"-variant tiles. */
  icon: string;
  /** Background photo — only used for "featured" and "image"-variant tiles.
   * For "featured", this is the fallback shown when `gallery` is empty. */
  image?: unknown;
  /** Auto-playing image/title rotation for the "featured" tile only (the
   * visitabudhabi.ae-style "Must-See" card). When this has 2+ entries, the
   * tile cycles through them automatically; `image`/`title` above are
   * ignored in favor of the gallery. */
  gallery: HomepageV2GalleryImageDoc[];
  tag: string;
  description: string;
  /** Span both grid columns. Ignored for "featured", which is always
   * full-width. */
  wide: boolean;
  order: number;
  enabled: boolean;
}

export interface HomepageV2FeaturedTripDoc {
  tripSlug: string;
  /** Optional overrides — when blank, the live homepage falls back to the
   * trip's own destination/theme for the tag pill. */
  tag: string;
  tagTone: "brass" | "teal" | "stone";
  enabled: boolean;
}

export interface HomepageV2Document extends Document {
  hero: {
    eyebrow: string;
    heading: string;
    subheading: string;
    ctaLabel: string;
    ctaHref: string;
    /** Background image on tablet/desktop viewports (≥768px). */
    imageDesktop?: unknown;
    /** Background image on phone viewports (<768px). Falls back to
     * `imageDesktop` when unset — most laptop-shot photos crop badly on a
     * phone screen, so this lets admins supply a separate portrait/tighter
     * crop instead of relying on `bg-cover` alone. */
    imageMobile?: unknown;
  };
  quickLinks: HomepageV2QuickLinkDoc[];
  featuredTrips: HomepageV2FeaturedTripDoc[];
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

const GalleryImageSchema = new Schema<HomepageV2GalleryImageDoc>(
  {
    image: { type: ImageAssetSchema },
    title: { type: String, default: "" },
  },
  { _id: false }
);

const QuickLinkSchema = new Schema<HomepageV2QuickLinkDoc>(
  {
    title: { type: String, default: "" },
    href: { type: String, default: "/" },
    variant: { type: String, enum: ["featured", "image", "icon"], default: "icon" },
    icon: { type: String, default: "MapPinned" },
    image: { type: ImageAssetSchema },
    gallery: { type: [GalleryImageSchema], default: [] },
    tag: { type: String, default: "" },
    description: { type: String, default: "" },
    wide: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const FeaturedTripSchema = new Schema<HomepageV2FeaturedTripDoc>(
  {
    tripSlug: { type: String, required: true },
    tag: { type: String, default: "" },
    tagTone: { type: String, enum: ["brass", "teal", "stone"], default: "brass" },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const HomepageV2Schema = new Schema<HomepageV2Document>(
  {
    hero: {
      eyebrow: { type: String, default: "" },
      heading: { type: String, default: "" },
      subheading: { type: String, default: "" },
      ctaLabel: { type: String, default: "Explore Trips" },
      ctaHref: { type: String, default: "/trips" },
      imageDesktop: { type: ImageAssetSchema },
      imageMobile: { type: ImageAssetSchema },
    },
    quickLinks: { type: [QuickLinkSchema], default: [] },
    featuredTrips: { type: [FeaturedTripSchema], default: [] },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

export const HomepageV2Model: Model<HomepageV2Document> =
  models.HomepageV2 || model<HomepageV2Document>("HomepageV2", HomepageV2Schema);
