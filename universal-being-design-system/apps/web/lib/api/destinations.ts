import { cache } from "react";
import type { Destination } from "@/types/destination";
import type { Trip } from "@/types/trip";
import { destinationRegistry, destinationSlugs } from "@/data/destinations";
import { getTripsByDestination } from "@/lib/api/trips";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/db/mongoose";
import { DestinationModel } from "@/lib/db/models";
import { toEntity } from "@/lib/api/db-mappers";

/**
 * lib/api/destinations.ts -- Architecture §3: "Next.js fetches via `lib/api/*`
 * -- never talks to MongoDB directly." Same swap-point pattern as
 * `lib/api/trips.ts`: reads MongoDB (admin-editable) when `MONGODB_URI` is
 * configured, otherwise falls back to the local seed registry. No page or
 * component imports `data/destinations/*` or `lib/db/*` directly.
 */

/** Fills in the one field older/seed destination records may not have set
 * yet, so every caller (listing cards, homepage) can read `thumbnail`
 * unconditionally instead of every component re-deriving the fallback. */
function withThumbnailFallback(destination: Destination): Destination {
  if (destination.thumbnail?.url) return destination;
  return { ...destination, thumbnail: destination.coverImage };
}

function staticDestinations(): Destination[] {
  return destinationSlugs
    .map((slug) => destinationRegistry[slug])
    .filter((d) => d.status === "published")
    .map(withThumbnailFallback);
}

export async function getAllDestinations(): Promise<Destination[]> {
  if (isDatabaseConfigured()) {
    try {
      await connectToDatabase();
      const docs = await DestinationModel.find({ status: "published" }).sort({ name: 1 }).lean();
      // Temporary safety net (Phase 4): DB reachable but Destinations
      // collection not seeded yet -- show static data instead of an empty
      // page. Once `npm run seed:destinations` has run this branch stops
      // being hit and the DB becomes the sole source.
      if (docs.length === 0) return staticDestinations();
      return docs.map((doc) => withThumbnailFallback(toEntity(doc) as unknown as Destination));
    } catch (err) {
      console.error("[getAllDestinations] MongoDB unreachable, falling back to static destination registry:", err);
    }
  }
  return staticDestinations();
}

/** Destinations eligible for homepage-facing widgets (e.g. Theme Explorer)
 * — published AND `homepageVisible` (Step 7.6C-B Part 2 §2: deleting or
 * hiding a destination removes it from the homepage without a code change).
 */
export async function getHomepageVisibleDestinations(): Promise<Destination[]> {
  const destinations = await getAllDestinations();
  return destinations.filter((d) => d.homepageVisible !== false);
}

export const getDestinationBySlug = cache(async function getDestinationBySlug(
  slug: string
): Promise<Destination | null> {
  if (isDatabaseConfigured()) {
    try {
      await connectToDatabase();
      const doc = await DestinationModel.findOne({ slug, status: "published" }).lean();
      if (doc) return withThumbnailFallback(toEntity(doc) as unknown as Destination);
      // Not found by slug -- before returning 404, check whether the
      // collection is empty (unseeded) rather than this slug genuinely
      // not existing. Same temporary safety net as getAllDestinations().
      const anyPublished = await DestinationModel.exists({ status: "published" });
      if (anyPublished) return null; // collection has data, this slug truly doesn't exist
    } catch (err) {
      console.error("[getDestinationBySlug] MongoDB unreachable, falling back to static destination registry:", err);
    }
  }
  const destination = destinationRegistry[slug];
  if (!destination || destination.status !== "published") return null;
  return withThumbnailFallback(destination);
});

export async function getDestinationSlugs(): Promise<string[]> {
  if (isDatabaseConfigured()) {
    try {
      await connectToDatabase();
      const docs = await DestinationModel.find({ status: "published" }).select("slug").lean();
      if (docs.length === 0) return destinationSlugs;
      return docs.map((d) => d.slug);
    } catch (err) {
      console.error("[getDestinationSlugs] MongoDB unreachable, falling back to static destination registry:", err);
    }
  }
  return destinationSlugs;
}

/** A destination plus a live count of its published trips -- used on the
 * Destination Listing Page so cards can show "6 trips" without every card
 * component independently importing the trips data layer. */
export async function getDestinationsWithTripCounts(): Promise<
  (Destination & { tripCount: number })[]
> {
  const destinations = await getAllDestinations();
  const withCounts = await Promise.all(
    destinations.map(async (destination) => {
      const trips = await getTripsByDestination(destination.slug);
      return { ...destination, tripCount: trips.length };
    })
  );
  return withCounts;
}

/** Trips assigned to this destination (still via `Trip.destinationSlug`,
 * Trips CMS untouched), ordered by the destination's own `tripAssignments`
 * (Display Order — Step 7.6C-B Part 2 §3), with each trip flagged if it's
 * marked "Featured" within this destination. Trips with no assignment entry
 * yet (e.g. just reassigned here) sort after ordered ones, oldest-first. */
export async function getOrderedDestinationTrips(
  destination: Destination
): Promise<(Trip & { destinationFeatured: boolean })[]> {
  const trips = await getTripsByDestination(destination.slug);
  const orderBySlug = new Map(destination.tripAssignments.map((a) => [a.tripSlug, a]));

  return trips
    .map((trip) => ({
      trip,
      assignment: orderBySlug.get(trip.slug),
    }))
    .sort((a, b) => {
      const aOrder = a.assignment?.order ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b.assignment?.order ?? Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.trip.title.localeCompare(b.trip.title);
    })
    .map(({ trip, assignment }) => ({ ...trip, destinationFeatured: assignment?.featured ?? false }));
}