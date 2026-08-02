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
  /** Pickup Variant Architecture (2026-07). Tags this batch as belonging to
   * one entry in `Trip.pickupVariants`. Optional/backward-compatible — a
   * batch with no tag is a plain trip-level batch exactly as before, still
   * fully bookable through the unchanged booking flow. Per-variant helpers
   * filter `Trip.departureDates` by this id; nothing about how
   * `/api/bookings` looks up or reserves a batch changes. */
  pickupVariantId?: string;
  /** This batch's own "Book Your Slot" deposit amount, mirroring
   * `priceOverride`'s existing per-batch override pattern. Optional — when
   * unset, `computeBookingPricing` falls back to `Trip.price.bookingAmount`
   * exactly as it always has. Lets each Pickup Variant's batches carry their
   * own deposit amount without changing the booking pricing engine's
   * signature or call sites. */
  bookingAmountOverride?: number;
}

/** Room Sharing markup (2026-07). Base price everywhere else in the app
 * always means Quad Sharing — this only adds a per-person surcharge on top
 * when the traveller picks Double or Triple on the booking form. Optional
 * on purpose: old trips with no `sharingTypeMarkup` at all just behave as
 * if both markups are 0 (`computeBookingPricing` falls back), so nothing
 * about an existing trip's price changes until an admin opts in. */
export type SharingType = "quad" | "triple" | "double";

export interface SharingTypeMarkup {
  /** Extra ₹ per person added to the Quad base price for Double Sharing. */
  double?: number;
  /** Extra ₹ per person added to the Quad base price for Triple Sharing. */
  triple?: number;
}

export interface TripPrice {
  base: number;
  /** Present + lower than `base` → renders struck-through via `<Price />`. */
  discounted?: number;
  bookingAmount: number;
  currency: string;
  /** See `SharingTypeMarkup` doc comment above. Admin-editable per trip,
   * defaults applied client-side (Admin form pre-fills ₹1000/₹500) rather
   * than via a Zod `.default()`, to avoid the same silent-overwrite bug
   * `.partial()` + `.default()` caused elsewhere in this schema. */
  sharingTypeMarkup?: SharingTypeMarkup;
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

/**
 * Hotel Category Architecture (2026-07). A purely informational "3 Star /
 * 4 Star / 5 Star" card shown on the Trip page so visitors know roughly
 * what tier of stay to expect. Deliberately NOT a hotel inventory system —
 * no pricing, no specific property, no availability. The Operations team
 * allocates the actual hotel manually after booking; this is just a
 * lightweight, fully admin-editable label + blurb. A fixed set of up to
 * four tiers (`stars` 0 = "< 3 Star", 3, 4, 5), each independently
 * enabled/disabled and with editable copy — nothing about a category's
 * identity (`stars`) is meant to change, only whether it's shown and what
 * it says.
 */
export interface HotelCategory {
  id: string;
  /** 0 stands for "< 3 Star"; otherwise 3, 4, or 5. */
  stars: 0 | 3 | 4 | 5;
  /** Admin-editable heading, e.g. "3 Star". Defaults to the obvious label
   * for `stars` but can be reworded freely. */
  title: string;
  /** Short admin-editable blurb, e.g. "Comfortable stays with all basic
   * amenities." Optional — self-hides when empty. */
  shortDescription?: string;
  /** Hide this tier from the public Trip page without deleting it. */
  isEnabled: boolean;
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

/**
 * Pickup Variant Architecture (2026-07). One bookable "Delhi Pickup" /
 * "Jaipur Pickup" / "Udaipur Pickup" — etc, unlimited — variant of a Parent
 * Trip. Fully admin-managed (Trip Editor's "Pickup Variants" tab):
 * add/edit/delete/reorder, no code change required to add a new pickup city.
 *
 * Deliberately does NOT carry its own price/departureDates arrays. Instead:
 *   - its batches are ordinary `Trip.departureDates` entries tagged with
 *     this variant's `id` via `DepartureDate.pickupVariantId`, each
 *     optionally carrying its own `priceOverride` / `bookingAmountOverride`
 *     (both pre-existing/mirrored per-batch override fields) — so every
 *     batch, regardless of which pickup city it belongs to, flows through
 *     the exact same booking/payment/seat-locking pipeline
 *     (`/api/bookings`, `computeBookingPricing`) with zero changes to that
 *     pipeline's logic.
 *   - `startingPrice` / `bookingAmount` below are this variant's *defaults*
 *     — shown on the pickup selector before a specific batch is chosen, and
 *     used to prefill a new batch created under this variant in Admin.
 */
export type PickupVariantStatus = "active" | "draft" | "archived";

export interface PickupVariant {
  id: string;
  /** "Delhi Pickup", "Jaipur Pickup", … — shown on the pickup selector. */
  name: string;
  pickupCity: string;
  dropCity: string;
  /** Ordered list of stop names for this pickup's route, e.g.
   * ["Delhi", "Jaipur", "Udaipur", "Delhi"]. */
  route: string[];
  duration: { days: number; nights: number; label: string };
  /** Default/display "starting from" price for this pickup, in `Trip.price.currency`. */
  startingPrice: number;
  discountedPrice?: number;
  /** Default "Book Your Slot" deposit amount for this pickup's batches. */
  bookingAmount: number;
  gstNote?: string;
  paymentNote?: string;
  /** This pickup's own day-by-day itinerary (routes commonly differ by
   * pickup city — e.g. a Delhi pickup adds a travel day a Jaipur pickup
   * doesn't need). */
  itinerary: DayPlan[];
  /**
   * Pickup Variant Architecture — Phase 1 completion (2026-07).
   * - `active` — visible on the public Trip page's pickup selector.
   * - `draft` — visible only in Admin; hidden from the website while it's
   *   still being set up.
   * - `archived` — hidden from the website but preserved in Admin for
   *   historical/reporting purposes (e.g. a discontinued pickup city that
   *   still has past bookings referencing it).
   * Optional for backward compatibility with variants saved before this
   * field existed — `getEffectiveVariantStatus` in `lib/trip/pickup-variants.ts`
   * derives `active`/`archived` from the older `isPublished` flag when this
   * is unset, so no data migration is required.
   */
  status?: PickupVariantStatus;
  /** @deprecated Superseded by `status` (`isPublished === false` ⇒
   * `archived`). Kept optional so variants saved before `status` existed
   * keep resolving to the correct effective status — see
   * `getEffectiveVariantStatus`. New code should read/write `status`. */
  isPublished?: boolean;
  /** Pickup Variant Architecture — Phase 1 completion (2026-07). Marks this
   * as the Parent Trip's Default Pickup Variant — the one selected
   * automatically when a visitor lands on the Trip page, before they've
   * chosen a city themselves. Exactly one variant per Trip should have this
   * set `true`; Admin enforces that by clearing it on every other variant
   * whenever one is marked default. Optional/backward compatible — when no
   * variant has this set (e.g. variants saved before this field existed),
   * `getDefaultPickupVariant` falls back to the first active variant in
   * admin-configured order, matching the previous behaviour exactly. */
  isDefault?: boolean;
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
  /** Marks this Trip as the "Parent Trip" of its `circuitGroup` — editable
   * directly from the Trip Editor's Basic Info tab (Trip Architecture Fix,
   * 2026-07, revised to close the "no admin control" gap). Every duration
   * variant in a circuit remains a fully independent, independently-editable
   * Trip document (own itinerary, pricing, batches, routes) — this flag
   * only decides:
   *   1. which ONE sibling surfaces as the `/trips` listing card
   *      (`getListedTrips()`),
   *   2. whose `heroImage`/`coverImage`/`thumbnail`/`gallery` cascade down
   *      to every other sibling that hasn't uploaded its own
   *      (`withSharedCircuitImages()`, additive for gallery), and
   *   3. whose images are preferred when a linked Destination page borrows
   *      imagery from its Trips (`pickRepresentativeTrip()` in
   *      `lib/api/destinations.ts`), unless that Destination has its own
   *      per-Trip "Featured" override set.
   * At most one Trip per `circuitGroup` should have this set `true`.
   * Optional — when unset for every sibling in a group, both (1) and (2)
   * fall back to the shortest-duration sibling, so this ships with zero
   * required data migration on existing Trip documents. */
  isCircuitParent?: boolean;
  /** "Destination Routes" list (see `DestinationRoute`). Optional — self-hides
   * when unset or empty, same backward-compatible pattern as everywhere else
   * in this file. */
  destinationRoutes?: DestinationRoute[];

  /** Pickup Variant Architecture (2026-07). Unlimited pickup-city variants
   * of this Parent Trip — see `PickupVariant` doc comment. Optional/
   * backward-compatible: empty or unset means this Trip has no pickup
   * variants and the Trip page renders exactly as it always has, reading
   * `pickup`/`drop`/`duration`/`price`/`departureDates`/`itinerary` above
   * directly. When present, `TripPickupVariants` (Trip page) lets the
   * visitor choose a pickup city and swaps those same fields for the
   * selected variant's. Child Trips are not used in this phase. */
  pickupVariants?: PickupVariant[];

  /** Hotel Category Architecture (2026-07). Up to four informational
   * "3 Star / 4 Star / 5 Star" cards — see `HotelCategory` doc comment.
   * Optional/backward-compatible: empty or unset self-hides this section
   * on the Trip page exactly like every other optional list here. Trip-
   * level (not per Pickup Variant) since hotel tier is informational and
   * doesn't vary by pickup city the way price/route/itinerary do. */
  hotelCategories?: HotelCategory[];

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
  /** "Active Homepage"-style switch (Site Settings), but per-trip: which
   * page design is live at `/trips/[slug]` for this trip — the original
   * composition ("v1", default) or its Trip 2.0 counterpart ("v2"),
   * once one exists with the same slug. See `app/trips/[slug]/page.tsx`. */
  activeVersion?: "v1" | "v2";

  seo: TripSeo;

  /** True while any field on this trip is placeholder/dev content rather than
   * real copy supplied by the business. Never read by rendering logic beyond
   * an optional dev-only badge — purely an editorial/admin signal. */
  isPlaceholderContent: boolean;

  createdAt: string;
  updatedAt: string;
}
