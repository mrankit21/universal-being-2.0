import { cache } from "react";
import type { Trip } from "@/types/trip";
import type { Testimonial } from "@/data/home/testimonials";
import { tripRegistry, tripSlugs } from "@/data/trips";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/db/mongoose";
import { TripModel } from "@/lib/db/models";
import { toEntity } from "@/lib/api/db-mappers";

/**
 * lib/api/trips.ts — Architecture §3/§5 data-flow rule: "MongoDB -> Express
 * REST (`/api/trips`, `/api/trips/:slug`) -> `lib/api/trips.ts` (typed fetch,
 * cached) -> Server Component -> props down."
 *
 * THIS IS THE SWAP POINT the original Phase-3/4 comment anticipated: when
 * `MONGODB_URI` is set (Step 7's Admin Panel backend), every function below
 * reads live, admin-editable data straight from MongoDB via Mongoose.
 * When it isn't set, it falls back to the local seed registry in
 * `data/trips/*` so the marketing site keeps working without a database in
 * local dev. Route files and every `components/trip/*` component still only
 * ever call these functions -- nothing else in the app changed.
 */

export interface TripListFilters {
  destinationSlug?: string;
  difficulty?: Trip["difficulty"];
  /** Free-text match against title/destinationName. */
  query?: string;
  /** Only trips at or below this base price. */
  maxPrice?: number;
}

function isPublished(trip: Trip) {
  return trip.status === "published";
}

/** Backfills `itinerary[].images`, `accommodation[].images`, and
 * `seo.keywords` for Trip documents written before those fields existed —
 * `.lean()` reads return exactly what's stored, without Mongoose schema
 * defaults applied, so older documents can arrive missing them. Mirrors the
 * same fallback the Admin Panel's TripForm applies on load. */
function normalizeTrip(trip: Trip): Trip {
  return {
    ...trip,
    itinerary: (trip.itinerary ?? []).map((day) => ({ ...day, images: day.images ?? [] })),
    accommodation: (trip.accommodation ?? []).map((stay) => ({ ...stay, images: stay.images ?? [], amenities: stay.amenities ?? [] })),
    mealPlan: { ...trip.mealPlan, snacks: trip.mealPlan?.snacks ?? false },
    reviewIds: trip.reviewIds ?? [],
    seo: { ...trip.seo, keywords: trip.seo?.keywords ?? [] },
  };
}

/** Resolves a Trip's `reviewIds` (Step 7.6D §9) against the site-wide
 * Testimonial collection, same reference-by-id pattern `lib/api/home.ts`
 * already uses for the Homepage's `testimonialIds`. Only published
 * testimonials are returned, and DB-off/local-dev environments simply get
 * an empty list — the trip's legacy embedded `reviews[]` still renders
 * regardless via `TripReviews`. */
export async function getTripReviewTestimonials(trip: Trip): Promise<Testimonial[]> {
  if (!isDatabaseConfigured() || !trip.reviewIds?.length) return [];
  await connectToDatabase();
  const { TestimonialModel } = await import("@/lib/db/models");
  const { testimonialDocToEntity } = await import("@/lib/api/home");
  const docs = await TestimonialModel.find({ _id: { $in: trip.reviewIds }, published: true }).lean();
  const byId = new Map(docs.map((d) => [String(d._id), d]));
  // Preserve admin-chosen order; drop ids that no longer resolve (deleted/unpublished).
  return trip.reviewIds
    .map((id) => byId.get(id))
    .filter((d): d is NonNullable<typeof d> => Boolean(d))
    .map(testimonialDocToEntity);
}

async function getAllTripsFromDb(): Promise<Trip[]> {
  await connectToDatabase();
  const docs = await TripModel.find({ status: "published" }).sort({ updatedAt: -1 }).lean();
  return docs.map((doc) => normalizeTrip(toEntity(doc) as unknown as Trip));
}

export async function getAllTrips(): Promise<Trip[]> {
  if (isDatabaseConfigured()) return getAllTripsFromDb();
  return tripSlugs.map((slug) => tripRegistry[slug]).filter(isPublished);
}

export const getTripBySlug = cache(async function getTripBySlug(slug: string): Promise<Trip | null> {
  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const doc = await TripModel.findOne({ slug, status: "published" }).lean();
    if (!doc) return null;
    return normalizeTrip(toEntity(doc) as unknown as Trip);
  }
  const trip = tripRegistry[slug];
  if (!trip || !isPublished(trip)) return null;
  return trip;
});

export async function getTripSlugs(): Promise<string[]> {
  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const docs = await TripModel.find({ status: "published" }).select("slug").lean();
    return docs.map((d) => d.slug);
  }
  return tripSlugs;
}

export async function getFeaturedTrips(): Promise<Trip[]> {
  const trips = await getAllTrips();
  return trips.filter((t) => t.featured);
}

export async function getTripsByDestination(destinationSlug: string): Promise<Trip[]> {
  const trips = await getAllTrips();
  return trips.filter((t) => t.destinationSlug === destinationSlug);
}

export async function searchTrips(filters: TripListFilters): Promise<Trip[]> {
  let trips = await getAllTrips();

  if (filters.destinationSlug) {
    trips = trips.filter((t) => t.destinationSlug === filters.destinationSlug);
  }
  if (filters.difficulty) {
    trips = trips.filter((t) => t.difficulty === filters.difficulty);
  }
  if (typeof filters.maxPrice === "number") {
    const maxPrice = filters.maxPrice;
    trips = trips.filter((t) => (t.price.discounted ?? t.price.base) <= maxPrice);
  }
  if (filters.query) {
    const q = filters.query.trim().toLowerCase();
    if (q) {
      trips = trips.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.destinationName.toLowerCase().includes(q) ||
          t.shortDescription.toLowerCase().includes(q)
      );
    }
  }

  return trips;
}

/** "You might also like" — Step 7.6E Part 5: scored by destination, theme,
 * difficulty, and duration proximity (highest score first), excluding the
 * current trip. Server-computed per Architecture §5 rather than manually
 * curated per trip, and never a hardcoded array. */
export async function getRelatedTrips(trip: Trip, limit = 3): Promise<Trip[]> {
  const all = await getAllTrips();
  const others = all.filter((t) => t.slug !== trip.slug);

  const scored = others.map((t) => {
    let score = 0;
    if (t.destinationSlug === trip.destinationSlug) score += 3;
    if (t.themeKey === trip.themeKey) score += 2;
    if (t.difficulty === trip.difficulty) score += 1;
    const dayDelta = Math.abs(t.duration.days - trip.duration.days);
    if (dayDelta <= 1) score += 1;
    return { trip: t, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.trip);
}
