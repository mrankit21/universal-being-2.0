import type {
  Trip,
  DayPlan,
  DepartureDate,
  Faq,
  TripDifficulty,
  ImageAsset,
  AccommodationEntry,
  MealPlan,
  TripReview,
} from "@/types/trip";
import type { ThemeKey } from "@/types/theme";
import { placeholderImage } from "@/lib/image/resolve-image";
import { cancellationPolicyContent, termsAndConditionsContent } from "@/data/shared/real-content";

/**
 * buildTrip — the single factory every file in data/trips/*.ts calls. Keeps
 * every trip document structurally identical (same id/timestamp/SEO/policy
 * defaults) so the eventual Admin Panel `TripEditor` (Architecture §14) can
 * assume a consistent shape without each seed file re-deriving boilerplate
 * by hand. Narrative content (title, itinerary, pricing, etc.) is supplied
 * per-destination by the caller; this file supplies no destination-specific
 * copy of its own.
 */
export interface TripSeedInput {
  slug: string;
  title: string;
  destinationSlug: string;
  destinationName: string;
  themeKey: ThemeKey;
  shortDescription: string;
  fullDescription: string;
  durationDays: number;
  durationNights: number;
  difficulty: TripDifficulty;
  bestSeason: string[];
  groupSize: { min: number; max: number };
  pickup: string;
  drop: string;
  /** Vehicle used for pickup/drop (Step 7.6C-A). Optional — defaults to empty until an admin fills it in. */
  vehicle?: string;
  /** Optional hotel stays (Step 7.6C-A). Defaults to none. `images` is
   * optional here (defaults to `[]` in buildTrip) so existing seed files
   * predating Step 7.6D's Hotel Images field don't need edits. */
  accommodation?: Array<Omit<AccommodationEntry, "images"> & { images?: ImageAsset[] }>;
  /** Optional trip-wide meal plan (Step 7.6C-A). Defaults to none configured. */
  mealPlan?: MealPlan;
  /** Optional customer reviews (Step 7.6C-A). Defaults to none. */
  reviews?: TripReview[];
  /** Optional Testimonial-collection review references (Step 7.6D §9). Defaults to none. */
  reviewIds?: string[];
  priceBase: number;
  priceDiscounted?: number;
  bookingAmount: number;
  totalSeats: number;
  availableSeats: number;
  /** Upcoming batch start dates (ISO). Each generates a DepartureDate spanning `durationDays` nights. */
  batchStartDates: string[];
  inclusions: string[];
  exclusions: string[];
  highlights: string[];
  /** `images` is optional per day here (defaults to `[]` in buildTrip) so
   * existing seed files predating Step 7.6D's Itinerary Images field don't
   * need edits. */
  itinerary: Array<Omit<DayPlan, "images"> & { images?: ImageAsset[] }>;
  faqs: Faq[];
  mapQuery: string;
  rating: number;
  reviewCount: number;
  featured?: boolean;
  galleryCount?: number;
  /** Override the shared real cancellation/terms content if this specific trip needs it. */
  cancellationPolicyOverride?: string;
  termsAndConditionsOverride?: string[];
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function buildDepartureDates(input: TripSeedInput): DepartureDate[] {
  return input.batchStartDates.map((startDate, i) => {
    const isFirst = i === 0;
    const seatsAvailable = isFirst ? input.availableSeats : input.totalSeats;
    const status: DepartureDate["status"] =
      seatsAvailable === 0 ? "sold-out" : seatsAvailable <= 3 ? "filling-fast" : "open";
    return {
      id: `${input.slug}-batch-${i + 1}`,
      startDate,
      endDate: addDays(startDate, input.durationDays - 1),
      seatsTotal: input.totalSeats,
      seatsAvailable,
      status,
    };
  });
}

function buildGallery(title: string, count: number): ImageAsset[] {
  return Array.from({ length: count }, (_, i) => placeholderImage(`${title} — photo ${i + 1}`));
}

export function buildTrip(input: TripSeedInput): Trip {
  const now = "2026-07-11T00:00:00.000Z";
  const durationLabel = `${input.durationDays} days, ${input.durationNights} nights`;

  return {
    id: input.slug,
    slug: input.slug,
    title: input.title,
    destinationSlug: input.destinationSlug,
    destinationName: input.destinationName,
    themeKey: input.themeKey,

    shortDescription: input.shortDescription,
    fullDescription: input.fullDescription,

    heroImage: placeholderImage(`${input.title} hero photo`, 1920, 1080),
    coverImage: placeholderImage(`${input.title} cover photo`, 1200, 900),
    thumbnail: placeholderImage(`${input.title} thumbnail`, 400, 400),
    homepageHeroImage: placeholderImage(`${input.title} homepage hero photo`, 1920, 1080),
    gallery: buildGallery(input.title, input.galleryCount ?? 6),

    duration: { days: input.durationDays, nights: input.durationNights, label: durationLabel },
    difficulty: input.difficulty,
    bestSeason: input.bestSeason,
    groupSize: input.groupSize,
    pickup: input.pickup,
    drop: input.drop,
    vehicle: input.vehicle ?? "",

    accommodation: (input.accommodation ?? []).map((stay) => ({ ...stay, images: stay.images ?? [] })),
    mealPlan: input.mealPlan ?? { breakfast: false, lunch: false, dinner: false, snacks: false, description: "" },

    price: {
      base: input.priceBase,
      discounted: input.priceDiscounted,
      bookingAmount: input.bookingAmount,
      currency: "INR",
    },

    totalSeats: input.totalSeats,
    availableSeats: input.availableSeats,
    departureDates: buildDepartureDates(input),

    inclusions: input.inclusions,
    exclusions: input.exclusions,
    highlights: input.highlights,
    itinerary: input.itinerary.map((day) => ({ ...day, images: day.images ?? [] })),
    faqs: input.faqs,
    reviews: input.reviews ?? [],
    reviewIds: input.reviewIds ?? [],
    termsAndConditions: input.termsAndConditionsOverride ?? termsAndConditionsContent,
    cancellationPolicy: input.cancellationPolicyOverride ?? cancellationPolicyContent,

    mapQuery: input.mapQuery,

    rating: input.rating,
    reviewCount: input.reviewCount,

    featured: input.featured ?? false,
    status: "published",

    seo: {
      title: `${input.title} | Universal Being`,
      description: input.shortDescription,
      keywords: [],
    },

    isPlaceholderContent: true,

    createdAt: now,
    updatedAt: now,
  };
}
