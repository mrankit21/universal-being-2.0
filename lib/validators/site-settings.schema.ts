import { z } from "zod";
import { imageAssetSchema } from "./shared.schema";

const globalSectionBackdropSchema = z.object({
  image: imageAssetSchema.optional(),
  opacityStep: z.number().min(1).max(7).default(6),
});

export const siteSettingsSchema = z.object({
  brandName: z.string().min(1),
  tagline: z.string().default(""),
  brandStory: z.string().default(""),
  activeHomepageVersion: z.enum(["v1", "v2", "auto"]).default("v1"),
  activeTripsVersion: z.enum(["v1", "v2", "auto"]).default("v1"),
  headerColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #b34700")
    .optional(),
  bottomNavColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #1d2610")
    .optional(),
  contact: z.object({
    phone: z.string().default(""),
    whatsapp: z.string().default(""),
    email: z.string().default(""),
    address: z.string().default(""),
  }),
  socialLinks: z
    .array(z.object({ platform: z.string(), href: z.string(), label: z.string(), icon: imageAssetSchema.optional() }))
    .default([]),
  seoDefaults: z.object({
    title: z.string().default(""),
    description: z.string().default(""),
    ogImageUrl: z.string().optional(),
  }),
  logo: imageAssetSchema.optional(),
  logoDark: imageAssetSchema.optional(),
  favicon: imageAssetSchema.optional(),
  ogImage: imageAssetSchema.optional(),
  appleTouchIcon: imageAssetSchema.optional(),
  googleMapsEmbedUrl: z.string().optional(),
  footer: z.object({
    columns: z
      .array(z.object({ title: z.string(), links: z.array(z.object({ label: z.string(), href: z.string() })) }))
      .default([]),
    copyrightHolder: z.string().default(""),
    backgroundImage: imageAssetSchema.optional(),
    backgroundImageMobile: imageAssetSchema.optional(),
    overlayOpacity: z.number().min(0).max(1).default(0.7),
  }),
  trip2SectionBackdrops: z
    .object({
      itinerary: globalSectionBackdropSchema.optional(),
      inclusionsExclusions: globalSectionBackdropSchema.optional(),
      batchDates: globalSectionBackdropSchema.optional(),
      thingsToExperience: globalSectionBackdropSchema.optional(),
      didYouKnow: globalSectionBackdropSchema.optional(),
      stillDeciding: globalSectionBackdropSchema.optional(),
    })
    .optional(),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
export const siteSettingsUpdateSchema = siteSettingsSchema.partial();
