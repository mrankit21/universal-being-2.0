import { z } from "zod";

export const themeKeySchema = z.enum([
  "brand",
  "rajasthan",
  "winter",
  "monsoon",
  "beach",
  "mountain",
  "forest",
]);

export const imageAssetSchema = z.object({
  provider: z.enum(["imagekit", "cloudinary", "local", "placeholder"]),
  publicId: z.string().optional(),
  url: z.string(),
  alt: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  blurHash: z.string().optional(),
  focalPoint: z.object({ x: z.number(), y: z.number() }).optional(),
  isPlaceholder: z.boolean(),
});

export const seoSchema = z.object({
  title: z.string(),
  description: z.string(),
  ogImage: imageAssetSchema.optional(),
  keywords: z.array(z.string()).default([]),
  canonicalUrl: z.string().optional(),
});
