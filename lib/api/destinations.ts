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

/** Backfills `gallery`, `highlights`, `pointsOfInterest`, `tripAssignments`,
 * and `bestSeason` for Destination documents written before those fields
 * existed. `.lean()` reads return exactly what's stored, without Mongoose
 * schema defaults applied, so older documents can arrive missing them —
 * same gap `lib/api/trips.ts`'s `normalizeTrip` backfills for Trip docs.
 * Without this, a legacy destination crashed `next build` the moment
 * `withTripImageFallback` or `getOrderedDestinationTrips` read `.length`/
 * `.map` on one of these fields. */
function normalizeDestination(destination: Destination): Destination {
  return {
    ...destination,
    gallery: destination.gallery ?? [],
    highlights: destination.highlights ?? [],
    pointsOfInterest: destination.pointsOfInterest ?? [],
    tripAssignments: destination.tripAssignments ?? [],
    bestSeason: destination.bestSeason ?? [],
  };
}

/** The trip whose images stand in for a destination's still-placeholder
 * image slots. Priority order: (1) the trip flagged "Featured" *within this
 * destination* (Display Order §3, an explicit per-destination override —
 * `destination-trip-assignment-field.tsx`), (2) the trip flagged
 * `isCircuitParent` (Trip Editor's "Mark as Circuit Parent" — the same flag
 * `lib/api/trips.ts` uses to cascade images down to sibling/child Trips, so
 * a destination's imagery and its Trips' imagery come from the same single
 * source by default), (3) any globally-featured trip, (4) simply the first
 * trip returned. Kept as one small helper so every fallback slot below
 * picks the same trip, instead of each image field independently guessing
 * which trip "represents" the destination. */
function pickRepresentativeTrip(trips: (Trip & { destinationFeatured?: boolean })[]): Trip | undefined {
  if (trips.length === 0) return undefined;
  return (
    trips.find((t) => t.destinationFeatured) ??
    trips.find((t) => t.isCircuitParent) ??
    trips.find((t) => t.featured) ??
    trips[0]
  );
}

/** Borrows imagery from this destination's trips wherever the destination
 * hasn't had its own photos uploaded yet (Architecture's "shared reference,
 * not duplicated content" pattern, applied one level down: a Destination and
 * its Trips commonly cover the same place, e.g. "Udaipur" the destination
 * and "Udaipur Lake Trail" the trip). Until an admin uploads
 * destination-specific hero/cover/thumbnail photos, those single-image slots
 * are filled with the representative trip's matching image (see
 * `pickRepresentativeTrip`) instead of showing the generic themed
 * placeholder — and, being single slots, a real destination upload always
 * fully replaces the borrowed one. Gallery works differently since it's a
 * list: the destination's own gallery photos always show, and the trip's
 * gallery is appended after them (deduped), so admins can keep adding their
 * own photos on top of the borrowed set instead of it disappearing the
 * moment they upload one. */
function withTripImageFallback(
  destination: Destination,
  trips: (Trip & { destinationFeatured?: boolean })[]
): Destination {
  const trip = pickRepresentativeTrip(trips);
  if (!trip) return destination;

  const resolved = { ...destination };

  if (destination.heroImage.isPlaceholder && !trip.heroImage.isPlaceholder) {
    resolved.heroImage = trip.heroImage;
    // Only borrow the mobile crop alongside the desktop one — never mix a
    // destination's own heroImageMobile with a trip's desktop heroImage.
    resolved.heroImageMobile = trip.heroImageMobile ?? trip.heroImage;
  }

  if (destination.coverImage.isPlaceholder && !trip.coverImage.isPlaceholder) {
    resolved.coverImage = trip.coverImage;
  }

  if ((!destination.thumbnail || destination.thumbnail.isPlaceholder) && !trip.thumbnail.isPlaceholder) {
    resolved.thumbnail = trip.thumbnail;
  }

  // Gallery is additive, not all-or-nothing: the destination's own REAL
  // photos always show, and every assigned trip's gallery is appended
  // after them (deduped by url/publicId) — so uploading a photo directly
  // on the destination adds photos alongside the borrowed ones instead of
  // replacing them. (hero/cover/thumbnail stay replace-only above, and stay
  // sourced from just the single `trip` representative — there's only one
  // slot each, nothing to "merge" a second image into.)
  //
  // Deliberately pulled from ALL `trips` here, not just the representative
  // one above: a destination can have several trips, and whichever one gets
  // picked as "representative" (Featured -> Circuit Parent -> globally
  // featured -> first) is often not the trip an admin actually uploaded
  // gallery photos to. Restricting the gallery merge to that one trip made
  // a destination's gallery look empty/missing the moment its
  // representative trip happened to have no gallery of its own, even
  // though its *other* assigned trips had full galleries saved.
  //
  // `destination.gallery` is filtered down to non-placeholder entries here:
  // `buildGallery()` (the destination seeder) pre-fills every new
  // destination with 6 `isPlaceholder: true` "photo coming soon" slots as
  // a scaffold for the admin to eventually replace one by one. Any slot an
  // admin hasn't gotten to yet is still sitting in the array, so showing
  // `destination.gallery` as-is put empty "coming soon" cards *ahead of*
  // real, useful trip photos in the carousel — the destination LOOKED like
  // its gallery was missing even when real photos were one swipe away.
  // Only actual uploads (real or trip-borrowed) belong in this list now.
  //
  // `trip.gallery` and `destination.gallery` fall back to `[]` here because
  // the Mongoose schema `default: []` only fills in the field for documents
  // created *after* it was added — a trip or destination saved to MongoDB
  // before then still comes back from `.lean()` with `gallery: undefined`,
  // which previously crashed this whole page during `next build`.
  const destinationGallery = (destination.gallery ?? []).filter((img) => !img.isPlaceholder);
  const seen = new Set(destinationGallery.map((img) => img.publicId ?? img.url));
  const extra: typeof destinationGallery = [];
  for (const t of trips) {
    for (const img of t.gallery ?? []) {
      if (img.isPlaceholder) continue;
      const key = img.publicId ?? img.url;
      if (seen.has(key)) continue;
      seen.add(key);
      extra.push(img);
    }
  }
  if (destinationGallery.length > 0 || extra.length > 0) {
    resolved.gallery = [...destinationGallery, ...extra];
  } else {
    // No real photos anywhere (destination or any assigned trip) — clear
    // out to an empty array rather than leaving the original placeholder-
    // filled `destination.gallery` in place, so `DestinationGallery`'s
    // `gallery.length === 0` check correctly hides the whole "Photos"
    // section instead of rendering a wall of "coming soon" cards.
    resolved.gallery = [];
  }

  return resolved;
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
      return docs.map((doc) => withThumbnailFallback(normalizeDestination(toEntity(doc) as unknown as Destination)));
    } catch (err) {
      console.error("[getAllDestinations] MongoDB unreachable, falling back to static destination registry:", err);
    }
  }
  return staticDestinations();
}

/** Destinations eligible for homepage-facing widgets (e.g. Theme Explorer)
 * — published AND `homepageVisible` (Step 7.6C-B Part 2 §2: deleting or
 * hiding a destination removes it from the homepage without a code change).
 * Also resolves `withTripImageFallback` per destination, same as the
 * Destination Listing/Detail pages, so this widget doesn't show "Photo
 * coming soon" once a trip under that destination already has real photos.
 */
export async function getHomepageVisibleDestinations(): Promise<Destination[]> {
  const destinations = await getAllDestinations();
  const visible = destinations.filter((d) => d.homepageVisible !== false);
  return Promise.all(
    visible.map(async (destination) => {
      const trips = await getTripsByDestination(destination.slug);
      return withTripImageFallback(destination, trips);
    })
  );
}

export const getDestinationBySlug = cache(async function getDestinationBySlug(
  slug: string
): Promise<Destination | null> {
  if (isDatabaseConfigured()) {
    try {
      await connectToDatabase();
      const doc = await DestinationModel.findOne({ slug, status: "published" }).lean();
      if (doc) return withThumbnailFallback(normalizeDestination(toEntity(doc) as unknown as Destination));
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
 * component independently importing the trips data layer. Also resolves
 * `withTripImageFallback` here since the trips are already fetched for the
 * count -- so listing cards get the same borrowed imagery as the detail
 * page, not just the hero/gallery. */
export async function getDestinationsWithTripCounts(): Promise<
  (Destination & { tripCount: number })[]
> {
  const destinations = await getAllDestinations();
  const withCounts = await Promise.all(
    destinations.map(async (destination) => {
      const trips = await getTripsByDestination(destination.slug);
      const resolved = withTripImageFallback(destination, trips);
      return { ...resolved, tripCount: trips.length };
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
  const orderBySlug = new Map((destination.tripAssignments ?? []).map((a) => [a.tripSlug, a]));

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

/** Everything the Destination Detail Page needs in one call: the ordered
 * trip list (unchanged from `getOrderedDestinationTrips`) plus a destination
 * whose hero/cover/thumbnail/gallery already have `withTripImageFallback`
 * applied against that same trip list -- so `DestinationHero`,
 * `DestinationGallery`, and `DestinationJsonLd` can keep reading
 * `destination.heroImage` etc. directly with no component changes. */
export async function getDestinationBySlugWithResolvedImages(slug: string): Promise<{
  destination: Destination;
  trips: (Trip & { destinationFeatured: boolean })[];
} | null> {
  const destination = await getDestinationBySlug(slug);
  if (!destination) return null;

  const trips = await getOrderedDestinationTrips(destination);
  return { destination: withTripImageFallback(destination, trips), trips };
}