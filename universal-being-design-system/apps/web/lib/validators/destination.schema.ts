import { z } from "zod";
import { imageAssetSchema, seoSchema, themeKeySchema } from "./shared.schema";

/** Step 7.6C-B Part 2 — Destination ↔ Trip relationship metadata. See
 * `types/destination.ts#DestinationTripAssignment` for the full rationale;
 * kept as a separate exported schema so the admin trip-assignment field can
 * validate a single entry client-side too. */
export const destinationTripAssignmentSchema = z.object({
  tripSlug: z.string().min(1),
  order: z.number().default(0),
  featured: z.boolean().default(false),
});

export const destinationSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase kebab-case"),
  name: z.string().min(1),
  region: z.string().default(""),
  state: z.string().default(""),
  themeKey: themeKeySchema,
  tagline: z.string().default(""),
  shortDescription: z.string().default(""),
  longDescription: z.string().default(""),
  heroImage: imageAssetSchema,
  heroImageMobile: imageAssetSchema.optional(),
  coverImage: imageAssetSchema,
  /** Optional — public read layer falls back to `coverImage` when unset. */
  thumbnail: imageAssetSchema.optional(),
  gallery: z.array(imageAssetSchema).default([]),
  bestSeason: z.array(z.string()).default([]),
  altitude: z.string().optional(),
  highlights: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  homepageVisible: z.boolean().default(true),
  tripAssignments: z.array(destinationTripAssignmentSchema).default([]),
  status: z.enum(["draft", "published"]).default("draft"),
  seo: seoSchema,
  isPlaceholderContent: z.boolean().default(false),
});

export type DestinationInput = z.infer<typeof destinationSchema>;
export const destinationUpdateSchema = destinationSchema.partial();
