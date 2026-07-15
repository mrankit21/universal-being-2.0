/** Zod schema for `Trip` (Architecture §6/§9 — shared frontend/backend
 * validation, "eliminates frontend/backend validation drift"). Every Admin
 * Panel trip form and every `POST/PATCH /api/admin/trips` route validates
 * against this one schema. */
import { z } from "zod";
import { imageAssetSchema, seoSchema, themeKeySchema } from "./shared.schema";

export const dayPlanSchema = z.object({
  day: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().default(""),
  activities: z.array(z.string()).default([]),
  meals: z.array(z.enum(["breakfast", "lunch", "dinner"])).default([]),
  stay: z.string().optional(),
  images: z.array(imageAssetSchema).default([]),
});

export const departureDateSchema = z.object({
  id: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  seatsTotal: z.number().int().min(0),
  seatsAvailable: z.number().int().min(0),
  priceOverride: z.number().optional(),
  status: z.enum(["open", "filling-fast", "sold-out", "closed"]).default("open"),
  isPublished: z.boolean().default(true),
});

export const faqSchema = z.object({
  id: z.string(),
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const accommodationEntrySchema = z.object({
  id: z.string(),
  hotelName: z.string().default(""),
  roomType: z.string().default(""),
  roomSharing: z.string().optional(),
  amenities: z.array(z.string()).default([]),
  location: z.string().optional(),
  notes: z.string().optional(),
  images: z.array(imageAssetSchema).default([]),
});

export const mealPlanSchema = z.object({
  breakfast: z.boolean().default(false),
  lunch: z.boolean().default(false),
  dinner: z.boolean().default(false),
  snacks: z.boolean().default(false),
  description: z.string().default(""),
});

export const tripReviewSchema = z.object({
  id: z.string(),
  customerName: z.string().min(1),
  customerPhoto: imageAssetSchema,
  rating: z.number().min(1).max(5),
  reviewText: z.string().min(1),
  reviewDate: z.string().optional(),
});

export const tripSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase kebab-case"),
  title: z.string().min(1),
  destinationSlug: z.string().min(1),
  destinationName: z.string().min(1),
  themeKey: themeKeySchema,
  shortDescription: z.string().default(""),
  fullDescription: z.string().default(""),
  heroImage: imageAssetSchema,
  coverImage: imageAssetSchema,
  thumbnail: imageAssetSchema,
  homepageHeroImage: imageAssetSchema,
  gallery: z.array(imageAssetSchema).default([]),
  duration: z.object({
    days: z.number().int().positive(),
    nights: z.number().int().min(0),
    label: z.string(),
  }),
  difficulty: z.enum(["easy", "moderate", "challenging"]),
  bestSeason: z.array(z.string()).default([]),
  bestTimeToVisit: z.string().optional(),
  altitude: z.string().optional(),
  groupSize: z.object({ min: z.number().int().positive(), max: z.number().int().positive() }),
  pickup: z.string().default(""),
  drop: z.string().default(""),
  startingCity: z.string().optional(),
  endingCity: z.string().optional(),
  vehicle: z.string().default(""),
  travelNotes: z.string().optional(),
  accommodation: z.array(accommodationEntrySchema).default([]),
  mealPlan: mealPlanSchema.default({ breakfast: false, lunch: false, dinner: false, snacks: false, description: "" }),
  price: z.object({
    base: z.number().min(0),
    discounted: z.number().min(0).optional(),
    bookingAmount: z.number().min(0),
    currency: z.string().default("INR"),
  }),
  totalSeats: z.number().int().min(0),
  availableSeats: z.number().int().min(0),
  departureDates: z.array(departureDateSchema).default([]),
  inclusions: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  highlights: z.array(z.string()).default([]),
  itinerary: z.array(dayPlanSchema).default([]),
  faqs: z.array(faqSchema).default([]),
  reviews: z.array(tripReviewSchema).default([]),
  reviewIds: z.array(z.string()).default([]),
  termsAndConditions: z.array(z.string()).default([]),
  cancellationPolicy: z.string().default(""),
  mapEmbedUrl: z.string().optional(),
  mapQuery: z.string().default(""),
  rating: z.number().min(0).max(5).default(0),
  reviewCount: z.number().int().min(0).default(0),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  seo: seoSchema,
  isPlaceholderContent: z.boolean().default(false),
});

export type TripInput = z.infer<typeof tripSchema>;
export const tripUpdateSchema = tripSchema.partial();
