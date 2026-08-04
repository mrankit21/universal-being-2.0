/**
 * HomepageV2 Mongoose model — single-document collection backing the
 * "Homepage 2.0" admin panel (Hero Parallax, Floating Quick Links,
 * Featured Trips Stack). Kept as its own singleton, separate from
 * `HomepageModel` (the original homepage's CMS), so editing one version
 * never touches the other's content — see `SiteSettingsDocument.activeHomepageVersion`
 * for the toggle that decides which one `app/page.tsx` renders.
 */
import mongoose, { Schema, model, type Model, type Document } from "mongoose";
const models = mongoose.models;
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
  /** Optional homepage-only cover image override. When set (and not a
   * placeholder), the Featured Trips card here uses this instead of the
   * trip's own cover/hero image — lets admins pick a card-specific photo
   * without touching the trip's actual listing/detail-page cover. */
  coverImage?: unknown;
  enabled: boolean;
}

/** One "Did you know" zigzag-card slide in the Fun Facts carousel
 * (`components/home/v2/fun-facts-zigzag.tsx`). */
export interface HomepageV2FunFactDoc {
  title: string;
  body: string;
  /** Lucide icon name, resolved client-side against `FUN_FACT_ICONS` in
   * `components/home/v2/fun-facts-zigzag.tsx`. */
  icon: string;
  learnMoreHref: string;
  order: number;
  enabled: boolean;
}

/** Same "themed backdrop + overlay opacity" section background pattern as
 * v1's Why Travel With Us / Testimonials sections — reused here for
 * Featured Trips' optional full-section (not per-card) background. */
export interface HomepageV2SectionBackgroundDoc {
  backgroundImage?: unknown;
  backgroundImageMobile?: unknown;
  overlayOpacity: number;
}

/** "Find your destination" — the visitabudhabi.ae-style full-bleed banner
 * that sits right under the Featured Trips stack: a heading + short body
 * copy over a themed backdrop image (admins usually pick a crop that
 * visually continues the Featured Trips section background above it). */
export interface HomepageV2FindDestinationDoc {
  heading: string;
  body: string;
  backgroundImage?: unknown;
  backgroundImageMobile?: unknown;
  overlayOpacity: number;
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
    /** Extra photos beyond `imageDesktop`. When non-empty, the live hero
     * becomes a swipeable/auto-cycling gallery — `imageDesktop` shown
     * first, then these, in order — same "slide down" transition as
     * Trip 2.0's hero gallery (`components/trip/v2/trip-hero-v2.tsx`).
     * Leave empty to keep a single still photo. */
    heroImages?: unknown[];
  };
  quickLinks: HomepageV2QuickLinkDoc[];
  featuredTrips: HomepageV2FeaturedTripDoc[];
  /** Optional full-bleed background behind the whole Featured Trips
   * section. Unset renders the plain section background as before. */
  featuredTripsSection?: HomepageV2SectionBackgroundDoc;
  funFacts: HomepageV2FunFactDoc[];
  /** Optional full-bleed background behind the whole Fun Facts section —
   * same "themed backdrop + overlay opacity" pattern as
   * `featuredTripsSection`. Unset keeps the plain `bg-ub-teal-600` backdrop. */
  funFactsSection?: HomepageV2SectionBackgroundDoc;
  /** "Find your destination" banner — right under Featured Trips. Unset/no
   * heading falls back to the default reference copy. */
  findDestination?: HomepageV2FindDestinationDoc;
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
    coverImage: { type: ImageAssetSchema },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const FunFactSchema = new Schema<HomepageV2FunFactDoc>(
  {
    title: { type: String, default: "" },
    body: { type: String, default: "" },
    icon: { type: String, default: "Globe" },
    learnMoreHref: { type: String, default: "" },
    order: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const SectionBackgroundSchema = new Schema<HomepageV2SectionBackgroundDoc>(
  {
    backgroundImage: { type: ImageAssetSchema },
    backgroundImageMobile: { type: ImageAssetSchema },
    overlayOpacity: { type: Number, default: 0.6 },
  },
  { _id: false }
);

const FindDestinationSchema = new Schema<HomepageV2FindDestinationDoc>(
  {
    heading: { type: String, default: "Find your destination" },
    body: {
      type: String,
      default: "Your next adventure is waiting. Discover amazing places with Universal Being.",
    },
    backgroundImage: { type: ImageAssetSchema },
    backgroundImageMobile: { type: ImageAssetSchema },
    overlayOpacity: { type: Number, default: 0.5 },
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
      heroImages: { type: [ImageAssetSchema], default: [] },
    },
    quickLinks: { type: [QuickLinkSchema], default: [] },
    featuredTrips: { type: [FeaturedTripSchema], default: [] },
    featuredTripsSection: { type: SectionBackgroundSchema, default: () => ({ overlayOpacity: 0.6 }) },
    funFacts: { type: [FunFactSchema], default: [] },
    funFactsSection: { type: SectionBackgroundSchema, default: () => ({ overlayOpacity: 0.6 }) },
    findDestination: { type: FindDestinationSchema, default: () => ({}) },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

export const HomepageV2Model: Model<HomepageV2Document> =
  models.HomepageV2 || model<HomepageV2Document>("HomepageV2", HomepageV2Schema);
