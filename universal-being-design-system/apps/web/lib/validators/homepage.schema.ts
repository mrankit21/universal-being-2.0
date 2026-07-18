import { z } from "zod";
import { imageAssetSchema } from "./shared.schema";

const SECTION_KEYS = ["hero", "featuredTrips", "themeExplorer", "valueProps", "testimonials", "promoBanner", "cta"] as const;

export const heroSlideSchema = z.object({
  destinationLabel: z.string().default(""),
  image: imageAssetSchema.optional(),
  heading: z.string().default(""),
  subtitle: z.string().default(""),
  badges: z.array(z.string()).default([]),
  ctaLabel: z.string().default("Explore"),
  ctaHref: z.string().default("/trips"),
  secondaryCtaLabel: z.string().default("Explore all trips"),
  secondaryCtaHref: z.string().default("/trips"),
  overlayOpacity: z.number().min(0).max(1).default(0.45),
  order: z.number().default(0),
  enabled: z.boolean().default(true),
  themeKey: z.string().default("brand"),
});

export const homepageSchema = z.object({
  heroSlides: z.array(heroSlideSchema).max(6, "A maximum of 6 hero slides is supported.").default([]),
  promoBanner: z.object({
    enabled: z.boolean().default(false),
    heading: z.string().default(""),
    body: z.string().default(""),
    image: imageAssetSchema.optional(),
    ctaLabel: z.string().optional(),
    ctaHref: z.string().optional(),
  }),
  ctaSection: z.object({
    heading: z.string().default(""),
    body: z.string().default(""),
    ctaLabel: z.string().default("Plan Your Trip"),
    ctaHref: z.string().default("/trips"),
    backgroundImage: imageAssetSchema.optional(),
  }),
  featuredTrips: z
    .array(z.object({ tripSlug: z.string(), enabled: z.boolean().default(true) }))
    .default([]),
  testimonialIds: z.array(z.string()).default([]),
  sectionOrder: z.array(z.enum(SECTION_KEYS)).default(["hero", "featuredTrips", "themeExplorer", "valueProps", "testimonials", "promoBanner", "cta"]),
  sectionVisibility: z
    .object({
      hero: z.boolean().default(true),
      featuredTrips: z.boolean().default(true),
      themeExplorer: z.boolean().default(true),
      valueProps: z.boolean().default(true),
      testimonials: z.boolean().default(true),
      cta: z.boolean().default(true),
    })
    .default({
      hero: true,
      featuredTrips: true,
      themeExplorer: true,
      valueProps: true,
      testimonials: true,
      cta: true,
    }),
});

export type HomepageInput = z.infer<typeof homepageSchema>;
export const homepageUpdateSchema = homepageSchema.partial();
