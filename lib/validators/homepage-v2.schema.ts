import { z } from "zod";
import { imageAssetSchema } from "./shared.schema";

export const homepageV2GalleryImageSchema = z.object({
  image: imageAssetSchema.optional(),
  title: z.string().default(""),
});

export const homepageV2QuickLinkSchema = z.object({
  title: z.string().default(""),
  href: z.string().default("/"),
  variant: z.enum(["featured", "image", "icon"]).default("icon"),
  icon: z.string().default("MapPinned"),
  image: imageAssetSchema.optional(),
  gallery: z.array(homepageV2GalleryImageSchema).default([]),
  tag: z.string().default(""),
  description: z.string().default(""),
  wide: z.boolean().default(false),
  order: z.number().default(0),
  enabled: z.boolean().default(true),
});

export const homepageV2FeaturedTripSchema = z.object({
  tripSlug: z.string().min(1),
  tag: z.string().default(""),
  tagTone: z.enum(["brass", "teal", "stone"]).default("brass"),
  /** Optional homepage-only cover image override — when set, this replaces
   * the trip's own cover/hero image on the Featured Trips card here, without
   * touching the trip's actual cover photo used everywhere else on the site. */
  coverImage: imageAssetSchema.optional(),
  enabled: z.boolean().default(true),
});

export const homepageV2FunFactSchema = z.object({
  title: z.string().default(""),
  body: z.string().default(""),
  icon: z.string().default("Globe"),
  learnMoreHref: z.string().default(""),
  order: z.number().default(0),
  enabled: z.boolean().default(true),
});

export const homepageV2SectionBackgroundSchema = z.object({
  backgroundImage: imageAssetSchema.optional(),
  backgroundImageMobile: imageAssetSchema.optional(),
  overlayOpacity: z.number().min(0).max(1).default(0.6),
});

export const homepageV2FindDestinationSchema = z.object({
  heading: z.string().default("Find your destination"),
  body: z
    .string()
    .default("Your next adventure is waiting. Discover amazing places with Universal Being."),
  backgroundImage: imageAssetSchema.optional(),
  backgroundImageMobile: imageAssetSchema.optional(),
  overlayOpacity: z.number().min(0).max(1).default(0.5),
  enabled: z.boolean().default(true),
});

export const homepageV2Schema = z.object({
  hero: z.object({
    eyebrow: z.string().default(""),
    heading: z.string().default(""),
    subheading: z.string().default(""),
    ctaLabel: z.string().default("Explore Trips"),
    ctaHref: z.string().default("/trips"),
    imageDesktop: imageAssetSchema.optional(),
    imageMobile: imageAssetSchema.optional(),
    heroImages: z.array(imageAssetSchema).default([]),
  }),
  quickLinks: z.array(homepageV2QuickLinkSchema).default([]),
  featuredTrips: z.array(homepageV2FeaturedTripSchema).default([]),
  /** Optional full-bleed background behind the whole Featured Trips
   * section (not per-card) — same "themed backdrop + overlay opacity"
   * pattern as v1's Why Travel With Us / Testimonials section
   * backgrounds. Leave unset for the plain section background. */
  featuredTripsSection: homepageV2SectionBackgroundSchema.optional(),
  funFacts: z.array(homepageV2FunFactSchema).default([]),
  /** Optional full-bleed background behind the whole Fun Facts section —
   * same pattern as `featuredTripsSection`. Leave unset for the plain
   * teal section background. */
  funFactsSection: homepageV2SectionBackgroundSchema.optional(),
  /** "Find your destination" banner right under Featured Trips — heading +
   * body copy over an optional themed backdrop image. */
  findDestination: homepageV2FindDestinationSchema.optional(),
});

export type HomepageV2Input = z.infer<typeof homepageV2Schema>;
export const homepageV2UpdateSchema = homepageV2Schema.partial();
