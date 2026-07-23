import { cache } from "react";
import type { Trip, ImageAsset } from "@/types/trip";
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

/** True only for an admin-uploaded image — `_builder.ts`'s seed placeholder
 * always sets `isPlaceholder: true` and an empty `url`, so that flag (not
 * just "field exists") is what distinguishes "never uploaded" from "real
 * photo". */
function hasRealImage(img?: ImageAsset | null): img is ImageAsset {
  return !!img && !img.isPlaceholder && !!img.url;
}

function hasRealGallery(gallery?: ImageAsset[] | null): boolean {
  return !!gallery && gallery.some(hasRealImage);
}

/** Single source of truth for "which Trip is the Parent of this
 * `circuitGroup`" — shared by `getListedTrips()` (which sibling gets the
 * `/trips` listing card) and `withSharedCircuitImages()` (whose images
 * cascade to the rest of the circuit). `group` must include every Trip
 * sharing that `circuitGroup`, this Trip included. Picks the Trip flagged
 * `isCircuitParent` (admin's explicit choice, Trip Editor → Basic Info);
 * when nobody in the group is flagged, falls back to the shortest-duration
 * sibling — this exists purely so a circuit with zero data migration still
 * behaves sensibly, NOT as a substitute for flagging a real parent. Example:
 * Udaipur's 2D Flying Visit / 3D Heritage Walk / 4D Kumbhalgarh Extension —
 * without a flag, the 2D (shortest) would silently become "parent" even
 * though the 3D is the intended one; flagging the 3D fixes that. */
function pickCircuitParent(group: Trip[]): Trip | undefined {
  if (group.length === 0) return undefined;
  const flagged = group.find((t) => t.isCircuitParent);
  if (flagged) return flagged;
  return group.reduce((shortest, t) => (t.duration.days < shortest.duration.days ? t : shortest));
}

/** Circuit Group Shared Media: every duration variant in a circuit shows
 * the Parent Trip's Hero/Cover/Thumbnail/Gallery (see `pickCircuitParent`)
 * — an admin uploads photos once, on the Parent, and every sibling (child)
 * Trip page shows them too. Only the images move; everything else
 * (itinerary, routes, pricing, batches, FAQs...) stays that Trip's own.
 *
 * Hero/Cover/Thumbnail are single-image slots: a child's own real upload
 * always wins over the Parent's for that field. Gallery is additive
 * instead — the Parent's gallery is the shared base, and any extra photos
 * a child has uploaded directly onto itself are appended after (deduped by
 * `publicId`/`url`), so a child can add its own bonus photos on top of the
 * inherited set without losing them. The Parent Trip itself is returned
 * completely untouched (nothing to inherit from itself).
 *
 * Purely a read-time fallback — nothing is written back to the DB, so this
 * never risks an overwrite-style data loss, and unflagging/reflagging the
 * parent takes effect immediately on next read. */
function withSharedCircuitImages(trip: Trip, group: Trip[]): Trip {
  const parent = pickCircuitParent(group);
  if (!parent || parent.slug === trip.slug) return trip;

  const ownHasHero = hasRealImage(trip.heroImage);
  const ownHasCover = hasRealImage(trip.coverImage);
  const ownHasThumbnail = hasRealImage(trip.thumbnail);
  const ownHasGallery = hasRealGallery(trip.gallery);

  const resolved: Trip = {
    ...trip,
    heroImage: ownHasHero ? trip.heroImage : parent.heroImage,
    heroImageMobile: hasRealImage(trip.heroImageMobile)
      ? trip.heroImageMobile
      : (parent.heroImageMobile ?? parent.heroImage),
    coverImage: ownHasCover ? trip.coverImage : parent.coverImage,
    thumbnail: ownHasThumbnail ? trip.thumbnail : parent.thumbnail,
  };

  const parentGallery = parent.gallery ?? [];
  if (parentGallery.length > 0) {
    const seen = new Set(parentGallery.map((img) => img.publicId ?? img.url));
    const ownExtra = ownHasGallery ? (trip.gallery ?? []).filter((img) => !seen.has(img.publicId ?? img.url)) : [];
    resolved.gallery = [...parentGallery, ...ownExtra];
  }

  return resolved;
}

/** Applies `withSharedCircuitImages` across a whole trip list by grouping
 * on `circuitGroup` first — used by `getAllTrips()` so listings/cards get
 * the same fallback as the single-trip detail page. */
function applySharedCircuitImages(trips: Trip[]): Trip[] {
  const byGroup = new Map<string, Trip[]>();
  for (const t of trips) {
    if (!t.circuitGroup) continue;
    const arr = byGroup.get(t.circuitGroup) ?? [];
    arr.push(t);
    byGroup.set(t.circuitGroup, arr);
  }
  return trips.map((t) => (t.circuitGroup ? withSharedCircuitImages(t, byGroup.get(t.circuitGroup) ?? []) : t));
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
    // Same "field added after some documents already existed" gap as the
    // fields above — `gallery`, `highlights`, `departureDates`, and
    // `bestSeason` are all rendered with an unguarded `.length`/`.map`
    // somewhere downstream (TripGallery, TripHighlights, getTripAvailability,
    // the Destination page's image-borrowing logic), so a legacy document
    // missing any of them crashed `next build` on static generation.
    gallery: trip.gallery ?? [],
    highlights: trip.highlights ?? [],
    departureDates: trip.departureDates ?? [],
    bestSeason: trip.bestSeason ?? [],
    destinationRoutes: trip.destinationRoutes ?? [],
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
  try {
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
  } catch (err) {
    console.error("[getTripReviewTestimonials] MongoDB unreachable, returning no reviews:", err);
    return [];
  }
}

async function getAllTripsFromDb(): Promise<Trip[]> {
  await connectToDatabase();
  const docs = await TripModel.find({ status: "published" }).sort({ updatedAt: -1 }).lean();
  return docs.map((doc) => normalizeTrip(toEntity(doc) as unknown as Trip));
}

function staticTrips(): Trip[] {
  return tripSlugs.map((slug) => tripRegistry[slug]).filter(isPublished);
}

export async function getAllTrips(): Promise<Trip[]> {
  if (isDatabaseConfigured()) {
    try {
      const dbTrips = await getAllTripsFromDb();
      // Temporary safety net (Phase 4): DB is reachable but the Trips
      // collection hasn't been seeded yet -- show static data instead of an
      // empty page. Once `npm run seed:trips` has run, dbTrips.length > 0
      // and this branch stops being hit; the DB becomes the sole source.
      if (dbTrips.length === 0) return applySharedCircuitImages(staticTrips());
      return applySharedCircuitImages(dbTrips);
    } catch (err) {
      console.error("[getAllTrips] MongoDB unreachable, falling back to static trip registry:", err);
    }
  }
  return applySharedCircuitImages(staticTrips());
}

/**
 * Trip Architecture Fix (2026-07): the `/trips` listing must show one card
 * per destination circuit ("Parent Trip"), not one card per duration
 * variant — duration variants (2D/3D/4D siblings sharing a `circuitGroup`)
 * stay reachable via `TripDurationSelector` on the Parent's own detail page
 * (`getCircuitSiblings()`), unchanged.
 *
 * Picks a single representative per `circuitGroup` via `pickCircuitParent`
 * (the sibling flagged `isCircuitParent`, or — when none is flagged — the
 * shortest-duration sibling), so this works with zero data migration on
 * existing Trip documents. Trips with no `circuitGroup` (standalone
 * destinations) pass through untouched, one card each, same as today.
 */
export async function getListedTrips(): Promise<Trip[]> {
  const trips = await getAllTrips();

  const byGroup = new Map<string, Trip[]>();
  const standalone: Trip[] = [];
  for (const t of trips) {
    if (!t.circuitGroup) {
      standalone.push(t);
      continue;
    }
    const arr = byGroup.get(t.circuitGroup) ?? [];
    arr.push(t);
    byGroup.set(t.circuitGroup, arr);
  }

  const parents = Array.from(byGroup.values())
    .map((siblings) => pickCircuitParent(siblings))
    .filter((t): t is Trip => Boolean(t));

  return [...standalone, ...parents];
}

export const getTripBySlug = cache(async function getTripBySlug(slug: string): Promise<Trip | null> {
  if (isDatabaseConfigured()) {
    try {
      await connectToDatabase();
      const doc = await TripModel.findOne({ slug, status: "published" }).lean();
      if (doc) {
        const trip = normalizeTrip(toEntity(doc) as unknown as Trip);
        if (!trip.circuitGroup) return trip;
        // Fetch the rest of the circuit directly (cheaper than a full
        // getAllTrips() call) purely to borrow images for fields this
        // trip hasn't had its own uploaded for yet.
        const siblingDocs = await TripModel.find({
          circuitGroup: trip.circuitGroup,
          status: "published",
        }).lean();
        const siblings = siblingDocs.map((d) => normalizeTrip(toEntity(d) as unknown as Trip));
        return withSharedCircuitImages(trip, siblings);
      }
      // Not found by slug -- before returning 404, check whether the
      // collection is empty (unseeded) rather than this slug genuinely
      // not existing. Same temporary safety net as getAllTrips().
      const anyPublished = await TripModel.exists({ status: "published" });
      if (anyPublished) return null; // collection has data, this slug truly doesn't exist
    } catch (err) {
      console.error("[getTripBySlug] MongoDB unreachable, falling back to static trip registry:", err);
    }
  }
  const trip = tripRegistry[slug];
  if (!trip || !isPublished(trip)) return null;
  if (!trip.circuitGroup) return trip;
  const siblings = Object.values(tripRegistry).filter(
    (t) => t.circuitGroup === trip.circuitGroup && isPublished(t)
  );
  return withSharedCircuitImages(trip, siblings);
});

export async function getTripSlugs(): Promise<string[]> {
  if (isDatabaseConfigured()) {
    try {
      await connectToDatabase();
      const docs = await TripModel.find({ status: "published" }).select("slug").lean();
      if (docs.length === 0) return tripSlugs;
      return docs.map((d) => d.slug);
    } catch (err) {
      console.error("[getTripSlugs] MongoDB unreachable, falling back to static trip registry:", err);
    }
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

/** Powers the real "Choose Trip Duration" cards (`TripDurationSelector`):
 * every other *published* Trip sharing this Trip's `circuitGroup`, plus
 * this Trip itself, sorted by duration ascending. Each sibling is a fully
 * independent Trip document — its own itinerary, pricing, and batch dates
 * — the group tag only says "these are the same circuit at different
 * lengths." Returns an empty array (selector self-hides) when `circuitGroup`
 * is unset or no other published Trip shares it. Works against MongoDB or
 * the local seed registry, same swap point as every other function here. */
export async function getCircuitSiblings(trip: Trip): Promise<Trip[]> {
  if (!trip.circuitGroup) return [];
  const all = await getAllTrips();
  const siblings = all.filter((t) => t.circuitGroup === trip.circuitGroup);
  if (siblings.length < 2) return [];
  return siblings.sort((a, b) => a.duration.days - b.duration.days);
}

/** "You might also like" — Step 7.6E Part 5: scored by destination, theme,
 * difficulty, and duration proximity (highest score first), excluding the
 * current trip. Server-computed per Architecture §5 rather than manually
 * curated per trip, and never a hardcoded array.
 *
 * Candidates are restricted to standalone trips and circuit Parents only
 * (same rule as `getListedTrips()`) — a circuit's non-parent duration
 * variants (e.g. Udaipur's Flying Visit / Kumbhalgarh Extension children)
 * never appear here, even though they'd otherwise score highest for
 * sharing the same destination. They stay reachable via the Parent's own
 * `TripDurationSelector` (`getCircuitSiblings()`), not as a separate
 * "related" card. */
export async function getRelatedTrips(trip: Trip, limit = 3): Promise<Trip[]> {
  const all = await getAllTrips();
  const others = all.filter((t) => t.slug !== trip.slug && (!t.circuitGroup || t.isCircuitParent));

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