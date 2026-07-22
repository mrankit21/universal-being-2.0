/**
 * Trip Domain Model — Step 6 (Trip Management System).
 *
 * Mirrors the Trip document spec in universal-being-architecture-1.md §3/13/14:
 * the shape is generic across every destination (desert, hill-station, lake
 * city) — flavor comes entirely from `themeKey` and content fields, never
 * from schema branching. This is the ONE Trip type; when the Express/MongoDB
 * API lands, `packages/types` re-exports this file verbatim so frontend and
 * backend never drift (Architecture §1).
 *
 * Nothing in components/trip or app/trips imports raw data files directly —
 * everything reads through `lib/api/trips.ts` against this type, which is
 * what makes the eventual Admin Panel a drop-in: the panel will write the
 * same shape to a database, and `lib/api/trips.ts` swaps its data source
 * from local seed arrays to `fetch("/api/trips")` with zero component edits.
 */

import type { ThemeKey } from "@/types/theme";

/** Provider-agnostic image slot (Architecture §13). Never a bare string URL. */
export interface ImageAsset {
  provider: "imagekit" | "cloudinary" | "local" | "placeholder";
  publicId?: string;
  /** Canonical fallback URL. Empty string is valid when `isPlaceholder` is true. */
  url: string;
  alt: string;
  width: number;
  height: number;
  blurHash?: string;
  focalPoint?: { x: number; y: number };
  /**
   * True when no real photography exists yet for this slot. Rendered via a
   * themed placeholder (see `components/trip/trip-image.tsx`) instead of a
   * broken/fake stock photo, matching the pattern already established by
   * `data/home/featured-trips.ts`. The Admin Panel's Gallery tab (Architecture
   * §14) is what flips this to false once a real ImageKit upload lands.
   */
  isPlaceholder: boolean;
}

export type MealKey = "breakfast" | "lunch" | "dinner";

/** One day of a trip's itinerary — drives `TripItinerary`'s accordion/carousel. */
export interface DayPlan {
  day: number;
  title: string;
  description: string;
  activities: string[];
  meals: MealKey[];
  /** Free-text stay description. A `hotelId` reference (Architecture §14) is
   * a later Admin Panel addition once a Hotel collection exists — kept as
   * text now so this ships without inventing a hotel database. */
  stay?: string;
  /** Destination/place name for this day (e.g. "Old Manali", "Kaza"). Used
   * by `TripItinerary` to group consecutive same-location days under a
   * shared photo banner ("2 Days in Gangtok" style). Left empty on pure
   * transit/travel days so they render as plain cards. */
  location?: string;
  /** Photos for this specific day (Step 7.6D §6 "Itinerary → Images").
   * Sourced from the Media Library like every other trip image slot. */
  images: ImageAsset[];
}

export type DepartureStatus = "open" | "filling-fast" | "sold-out" | "closed";

/** A single bookable batch — the admin-editable "Batch Dates" surface. */
export interface DepartureDate {
  id: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  seatsTotal: number;
  seatsAvailable: number;
  /** Overrides `Trip.price` for this batch only (e.g. festival surge pricing). */
  priceOverride?: number;
  status: DepartureStatus;
  /** Step 7.6E Part 2 "Departure Management → Publish". Defaults to `true`
   * (via `?? true` at every read site) so batches saved before this field
   * existed keep showing exactly as they did. Lets admins hide a batch from
   * the public Trip page (e.g. still being finalized) without deleting it. */
  isPublished?: boolean;
}

export interface TripPrice {
  base: number;
  /** Present + lower than `base` → renders struck-through via `<Price />`. */
  discounted?: number;
  bookingAmount: number;
  currency: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

/** One hotel/stay entry for the Accommodation section (admin-editable —
 * Step 7.6C-A §6). Kept as free-text fields (no Hotel collection yet) so
 * this ships without inventing a hotel database, same rationale as
 * `DayPlan.stay`. */
export interface AccommodationEntry {
  id: string;
  hotelName: string;
  roomType: string;
  /** Free-text room sharing basis (Step 7.6D §3 "Accommodation → Room
   * Sharing") — e.g. "Double sharing", "Triple sharing", "Single occupancy". */
  roomSharing?: string;
  /** Hotel amenities list (Step 7.6D §3 "Accommodation → Amenities") — e.g.
   * "WiFi", "Bonfire", "Room Heater". */
  amenities?: string[];
  location?: string;
  notes?: string;
  /** Hotel photos (Step 7.6D §7 "Accommodation → Hotel Images"), sourced
   * from the Media Library like every other trip image slot. */
  images: ImageAsset[];
}

/** Trip-wide meal plan summary (Step 7.6C-A §7) — distinct from the
 * per-day `DayPlan.meals` markers already covering the itinerary; this is
 * the overall "what's included at meal time" description shown once on the
 * Trip Details page. */
export interface MealPlan {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  /** Step 7.6D §4 "Meals → Snacks". */
  snacks: boolean;
  description: string;
}

/** One customer review (Step 7.6C-A §12) — unlimited list, fully
 * admin-managed. Distinct from the site-wide `Testimonial` collection: this
 * is the trip's own review list rendered directly on its Trip Details page. */
export interface TripReview {
  id: string;
  customerName: string;
  customerPhoto: ImageAsset;
  rating: number;
  reviewText: string;
  reviewDate?: string;
}

export type TripDifficulty = "easy" | "moderate" | "challenging";
export type TripStatus = "draft" | "published" | "archived";

export interface TripSeo {
  title: string;
  description: string;
  ogImage?: ImageAsset;
  /** Meta keywords (Step 7.6D §14 "SEO → Keywords"). Low SEO value on
   * modern search engines but kept as an admin-editable list since the
   * spec calls for it explicitly and some directory/aggregator sites still
   * read it. */
  keywords: string[];
  /** Canonical URL override (Step 7.6D §10 "SEO → Canonical URL"). Optional
   * — when unset, the page's own URL is canonical. */
  canonicalUrl?: string;
}

/**
 * One alternate multi-stop route built from the same destination — the
 * "Destination Routes" list on the Trip Details page. Optional link target
 * lets each row point at a real Trip once one exists for that route.
 */
export interface DestinationRoute {
  id: string;
  /** Ordered list of stop names, e.g. ["Leh", "Nubra Valley", "Pangong"]. */
  stops: string[];
  href?: string;
}

export interface Trip {
  id: string;
  slug: string;
  title: string;

  /** FK into Destination — see `types/destination.ts`. Denormalized `destinationName`
   * kept alongside for cheap listing renders without a join. */
  destinationSlug: string;
  destinationName: string;

  /** FK into theme config, never hardcoded per trip (Architecture §4). */
  themeKey: ThemeKey;

  shortDescription: string;
  fullDescription: string;

  heroImage: ImageAsset;
  /** Optional dedicated crop for narrow viewports — falls back to
   * `heroImage` when not set. A wide hero photo with subjects spread
   * toward the edges can lose one of them when cropped into a much
   * narrower phone-width box; this lets admins supply a portrait-friendly
   * crop instead. */
  heroImageMobile?: ImageAsset;
  coverImage: ImageAsset;
  thumbnail: ImageAsset;
  /** Dedicated image slot for this trip's homepage placement (Step 7.6C-A
   * §3) — kept separate from `coverImage` so the homepage crop/composition
   * can differ from the trip page's own card image. */
  homepageHeroImage: ImageAsset;
  gallery: ImageAsset[];

  duration: { days: number; nights: number; label: string };
  difficulty: TripDifficulty;
  bestSeason: string[];
  /** Step 7.6E Part 1 "Trip Highlights → Best Time" — a single admin-written
   * label (e.g. "Oct – Feb") shown on the Trip Highlights facts strip.
   * Distinct from `bestSeason[]` (the multi-chip list used elsewhere) so the
   * highlights strip always has one clean line to show. Optional/backward
   * compatible — falls back to `bestSeason.join(", ")` when unset. */
  bestTimeToVisit?: string;
  /** Step 7.6E Part 1 "Trip Highlights → Altitude". Optional free text
   * (e.g. "13,050 ft") — not every trip has a meaningful altitude. */
  altitude?: string;
  groupSize: { min: number; max: number };
  pickup: string;
  drop: string;
  /** Step 7.6E Part 1 "Trip Highlights → Starting City". Optional — falls
   * back to not rendering that fact when unset. */
  startingCity?: string;
  /** Step 7.6E Part 1 "Trip Highlights → Ending City". */
  endingCity?: string;
  /** Vehicle used for pickup/drop transport (Step 7.6C-A §8). */
  vehicle: string;
  /** Free-text transportation notes (Step 7.6D §5 "Transportation → Travel
   * Notes") — e.g. luggage limits, boarding instructions. */
  travelNotes?: string;

  accommodation: AccommodationEntry[];
  mealPlan: MealPlan;

  price: TripPrice;

  /** Groups this Trip with its sibling duration variants — e.g. a 4D Quick
   * Loop, 6D, and 9D Extended Explorer of the same Ladakh circuit are three
   * separate, fully independent Trip documents (own itinerary, pricing,
   * batches) that merely share this same string. `getCircuitSiblings()` in
   * `lib/api/trips.ts` looks up every other published Trip with the same
   * `circuitGroup` and `TripDurationSelector` renders one card per sibling
   * (this Trip included), each linking straight to its own Trip page —
   * no shared/duplicated data, no decorative price label. Optional —
   * when unset, or when this is the only published Trip with that value,
   * `TripDurationSelector` self-hides and the page renders exactly as it
   * did before this field existed. */
  circuitGroup?: string;
  /** "Destination Routes" list (see `DestinationRoute`). Optional — self-hides
   * when unset or empty, same backward-compatible pattern as everywhere else
   * in this file. */
  destinationRoutes?: DestinationRoute[];

  /** Convenience mirror of the next open batch — quick-editable in Admin
   * without opening the batch editor. `departureDates[]` remains the source
   * of truth for actual booking math. */
  totalSeats: number;
  availableSeats: number;
  departureDates: DepartureDate[];

  inclusions: string[];
  exclusions: string[];
  highlights: string[];
  itinerary: DayPlan[];
  faqs: Faq[];
  reviews: TripReview[];
  /** Reviews assigned from the site-wide `Testimonial` collection (Step
   * 7.6D §9 "Reviews → assign from MongoDB"). Distinct from the legacy
   * embedded `reviews[]` above, which is kept for backward compatibility
   * with Trips written before this existed. Resolved to full Testimonial
   * docs by `lib/api/trips.ts#getTripReviewTestimonials`, same
   * reference-by-id pattern the Homepage already uses for
   * `testimonialIds`. No duplicate ids. */
  reviewIds: string[];
  termsAndConditions: string[];
  cancellationPolicy: string;

  mapEmbedUrl?: string;
  mapQuery: string;

  rating: number;
  reviewCount: number;

  /** Admin Panel "Publish/Unpublish" + "Mark Featured Trips" (requirement #10). */
  featured: boolean;
  status: TripStatus;

  seo: TripSeo;

  /** True while any field on this trip is placeholder/dev content rather than
   * real copy supplied by the business. Never read by rendering logic beyond
   * an optional dev-only badge — purely an editorial/admin signal. */
  isPlaceholderContent: boolean;

  createdAt: string;
  updatedAt: string;
}
