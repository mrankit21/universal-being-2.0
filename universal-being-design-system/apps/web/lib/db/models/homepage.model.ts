/**
 * Homepage Mongoose model — a single-document collection (Architecture §14
 * pattern applied to marketing content) backing every homepage section
 * requirement #5 lists: Hero Slider, Homepage Sections, Featured Trips,
 * Testimonials, CTA Sections, Promotional Banner. `sectionOrder` lets admins
 * reorder sections without a redeploy; `sectionVisibility` lets them hide a
 * section without losing its content; each section's own content lives in
 * its own sub-document so the homepage renderer can loop `sectionOrder` and
 * render whichever section type it finds.
 *
 * Step 7.6C-B Part 1 — Homepage CMS + database-first homepage:
 * `hero` (single banner) is replaced by `heroSlides` (up to 6, Media
 * Library-backed, orderable, individually enable/disable-able) per the
 * brief's Hero Slider spec. Existing singleton docs written before this
 * change only had `hero` — `lib/api/home.ts` migrates that legacy shape
 * into a single hero slide the first time it's read, so no content is lost.
 */
import { Schema, model, models, type Model, type Document } from "mongoose";
import { ImageAssetSchema } from "./shared.schemas";

export type HomepageSectionKey =
  | "hero"
  | "featuredTrips"
  | "themeExplorer"
  | "valueProps"
  | "testimonials"
  | "promoBanner"
  | "cta";

export interface HeroSlideDoc {
  destinationLabel: string;
  image: unknown;
  heading: string;
  subtitle: string;
  /** Badge chips under the CTAs, e.g. "3 days, 2 nights", "12–18 people",
   * "4.7★ (97)". Fully admin-editable per slide — Step 7.6D. */
  badges: string[];
  ctaLabel: string;
  ctaHref: string;
  /** The Hero's secondary ("Explore all trips") button — previously
   * hardcoded in `HeroSection`, now per-slide and admin-editable (7.6D). */
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  overlayOpacity: number;
  order: number;
  enabled: boolean;
  themeKey: string;
}

export interface HomepageDocument extends Document {
  /** @deprecated legacy single-hero shape, kept only so pre-Part-1 docs still
   * validate on read; migrated into `heroSlides` by `lib/api/home.ts`. */
  hero?: {
    heading: string;
    subheading: string;
    backgroundImage: unknown;
    ctaLabel: string;
    ctaHref: string;
    themeKey: string;
  };
  heroSlides: HeroSlideDoc[];
  promoBanner: {
    enabled: boolean;
    heading: string;
    body: string;
    image?: unknown;
    ctaLabel?: string;
    ctaHref?: string;
  };
  ctaSection: {
    heading: string;
    body: string;
    ctaLabel: string;
    ctaHref: string;
    backgroundImage?: unknown;
  };
  featuredTrips: { tripSlug: string; enabled: boolean }[];
  testimonialIds: string[];
  sectionOrder: HomepageSectionKey[];
  sectionVisibility: Record<Exclude<HomepageSectionKey, "promoBanner">, boolean>;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

const HeroSlideSchema = new Schema<HeroSlideDoc>(
  {
    destinationLabel: { type: String, default: "" },
    image: { type: ImageAssetSchema },
    heading: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    badges: { type: [String], default: [] },
    ctaLabel: { type: String, default: "Explore" },
    ctaHref: { type: String, default: "/trips" },
    secondaryCtaLabel: { type: String, default: "Explore all trips" },
    secondaryCtaHref: { type: String, default: "/trips" },
    overlayOpacity: { type: Number, default: 0.45, min: 0, max: 1 },
    order: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
    themeKey: { type: String, default: "brand" },
  },
  { _id: false }
);

const HomepageSchema = new Schema<HomepageDocument>(
  {
    // Legacy field — no longer written by new code, kept for old records.
    hero: {
      heading: { type: String },
      subheading: { type: String },
      backgroundImage: { type: ImageAssetSchema },
      ctaLabel: { type: String },
      ctaHref: { type: String },
      themeKey: { type: String },
    },
    heroSlides: {
      type: [HeroSlideSchema],
      default: [],
      validate: {
        validator: (v: unknown[]) => v.length <= 6,
        message: "Homepage hero slider supports a maximum of 6 slides.",
      },
    },
    promoBanner: {
      enabled: { type: Boolean, default: false },
      heading: { type: String, default: "" },
      body: { type: String, default: "" },
      image: { type: ImageAssetSchema },
      ctaLabel: { type: String },
      ctaHref: { type: String },
    },
    ctaSection: {
      heading: { type: String, default: "" },
      body: { type: String, default: "" },
      ctaLabel: { type: String, default: "Plan Your Trip" },
      ctaHref: { type: String, default: "/trips" },
      backgroundImage: { type: ImageAssetSchema },
    },
    featuredTrips: {
      type: [
        new Schema(
          { tripSlug: { type: String, required: true }, enabled: { type: Boolean, default: true } },
          { _id: false }
        ),
      ],
      default: [],
    },
    testimonialIds: { type: [String], default: [] },
    sectionOrder: {
      type: [String],
      default: ["hero", "featuredTrips", "themeExplorer", "valueProps", "testimonials", "promoBanner", "cta"],
    },
    sectionVisibility: {
      type: {
        hero: { type: Boolean, default: true },
        featuredTrips: { type: Boolean, default: true },
        themeExplorer: { type: Boolean, default: true },
        valueProps: { type: Boolean, default: true },
        testimonials: { type: Boolean, default: true },
        cta: { type: Boolean, default: true },
      },
      default: {},
    },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

export const HomepageModel: Model<HomepageDocument> =
  models.Homepage || model<HomepageDocument>("Homepage", HomepageSchema);
