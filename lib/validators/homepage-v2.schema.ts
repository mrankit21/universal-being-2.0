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
  }),
  quickLinks: z.array(homepageV2QuickLinkSchema).default([]),
  featuredTrips: z.array(homepageV2FeaturedTripSchema).default([]),
});

export type HomepageV2Input = z.infer<typeof homepageV2Schema>;
export const homepageV2UpdateSchema = homepageV2Schema.partial();
