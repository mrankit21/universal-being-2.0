import { z } from "zod";
import { imageAssetSchema } from "./shared.schema";

/**
 * Trip2 validators — same shape as `lib/db/models/trip2.model.ts`, same
 * pattern as `lib/validators/homepage-v2.schema.ts`. `trip2UpdateSchema`
 * is `.partial()`, so every route that uses it on PATCH must filter the
 * parsed result against the RAW request body's own keys before merging
 * (see the long comment in `app/api/admin/trips/[id]/route.ts` for why —
 * zod silently applies every field's `.default()` even for keys the
 * client never sent, so a naive "defined" filter isn't enough and will
 * quietly wipe untouched fields).
 */

export const trip2QuickLinkSchema = z.object({
  icon: z.string().default("Sparkles"),
  label: z.string().default(""),
  href: z.string().default("#"),
  order: z.number().default(0),
});

export const trip2GalleryImageSchema = z.object({
  image: imageAssetSchema.optional(),
  caption: z.string().default(""),
  order: z.number().default(0),
});

export const trip2HotelTierSchema = z.object({
  stars: z.number().int().min(1).max(5).default(3),
  label: z.string().default(""),
  description: z.string().default(""),
});

export const trip2ItineraryDaySchema = z.object({
  day: z.number().int().min(1).default(1),
  title: z.string().default(""),
  location: z.string().default(""),
  image: imageAssetSchema.optional(),
  description: z.string().default(""),
});

export const trip2PickupVariantSchema = z.object({
  city: z.string().default(""),
  note: z.string().default(""),
});

export const trip2BatchDateSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  seatsTotal: z.number().int().min(0).default(16),
  seatsAvailable: z.number().int().min(0).default(16),
  status: z.enum(["open", "filling-fast", "sold-out"]).default("open"),
});

export const trip2ExperienceSchema = z.object({
  tag: z.string().default(""),
  title: z.string().default(""),
  description: z.string().default(""),
  href: z.string().default("#"),
  image: imageAssetSchema.optional(),
});

export const trip2FactSchema = z.object({
  icon: z.string().default("Globe2"),
  title: z.string().default(""),
  description: z.string().default(""),
  href: z.string().default("#"),
});

export const trip2FaqSchema = z.object({
  question: z.string().default(""),
  answer: z.string().default(""),
});

export const trip2Schema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers and hyphens"),
  status: z.enum(["draft", "published"]).default("draft"),
  title: z.string().default(""),
  shortDescription: z.string().default(""),
  location: z.string().default(""),
  durationLabel: z.string().default(""),
  groupSizeLabel: z.string().default(""),
  heroImage: imageAssetSchema.optional(),
  bookHref: z.string().default(""),
  quickLinks: z.array(trip2QuickLinkSchema).default([]),
  gallery: z.array(trip2GalleryImageSchema).default([]),
  hotelTiers: z.array(trip2HotelTierSchema).default([]),
  itinerary: z.array(trip2ItineraryDaySchema).default([]),
  inclusions: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  price: z
    .object({
      basePrice: z.number().min(0).default(0),
      discountedPrice: z.number().min(0).optional(),
      bookingAmount: z.number().min(0).default(0),
    })
    .default({ basePrice: 0, bookingAmount: 0 }),
  pickupVariants: z.array(trip2PickupVariantSchema).default([]),
  batchDates: z.array(trip2BatchDateSchema).default([]),
  thingsToExperience: z.array(trip2ExperienceSchema).default([]),
  didYouKnow: z.array(trip2FactSchema).default([]),
  faqs: z.array(trip2FaqSchema).default([]),
  leadFormDestination: z.string().default(""),
});

export type Trip2Input = z.infer<typeof trip2Schema>;
export const trip2UpdateSchema = trip2Schema.partial();
