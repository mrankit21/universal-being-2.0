/**
 * Pickup Variant Architecture (2026-07) — shared helpers used by both the
 * Admin Panel (Pickup Variant Manager) and the public Trip page.
 *
 * A Pickup Variant never carries its own price/departureDates array (see
 * `PickupVariant` doc comment in `types/trip.ts`) — its batches are plain
 * `Trip.departureDates` entries tagged with `pickupVariantId`. That's what
 * lets every batch, regardless of pickup city, flow through the existing
 * `/api/bookings` + `computeBookingPricing` pipeline completely unchanged.
 * These helpers are just the read-side glue: given a Trip and a chosen
 * variant, produce the variant's own batches and an "effective" Trip view
 * with that variant's fields swapped in, so every existing display
 * component (`TripBookingCard`, `TripPricingTable`, `TripItinerary`, …)
 * can keep accepting a plain `Trip` prop with zero changes to their own code.
 */
import type { Trip, PickupVariant, PickupVariantStatus, DepartureDate } from "@/types/trip";

/**
 * Resolves a variant's effective status, falling back to the older
 * `isPublished` boolean for variants saved before `status` existed:
 * `isPublished === false` maps to `archived` (the old "Hidden" meant
 * "not on the website," which is what `archived` also guarantees), and
 * anything else defaults to `active` — the same "visible unless explicitly
 * hidden" behaviour this had before. No data migration required.
 */
export function getEffectiveVariantStatus(variant: PickupVariant): PickupVariantStatus {
  if (variant.status) return variant.status;
  return variant.isPublished === false ? "archived" : "active";
}

/** Pickup variants visible on the public Trip page — status `active` only.
 * `draft` (admin-only, still being set up) and `archived` (kept for
 * history) are both hidden from the website. In admin-configured
 * (reorderable) order. */
export function getPublishedPickupVariants(trip: Trip): PickupVariant[] {
  return (trip.pickupVariants ?? []).filter((v) => getEffectiveVariantStatus(v) === "active");
}

/**
 * The Parent Trip's Default Pickup Variant — the one the public Trip page
 * selects automatically before a visitor picks a city themselves. Prefers
 * the variant explicitly flagged `isDefault`; falls back to the first
 * active variant in admin-configured order when none is flagged (e.g.
 * variants saved before `isDefault` existed), which matches the exact
 * behaviour this had previously. Only considers active (published)
 * variants — a draft or archived variant is never selected automatically.
 */
export function getDefaultPickupVariant(trip: Trip): PickupVariant | undefined {
  const active = getPublishedPickupVariants(trip);
  return active.find((v) => v.isDefault) ?? active[0];
}

/** This variant's own batches — `Trip.departureDates` entries tagged with
 * its id. Untagged batches (`pickupVariantId` unset) never appear here;
 * they're legacy/trip-level batches from before Pickup Variants existed. */
export function getVariantBatches(trip: Trip, variantId: string): DepartureDate[] {
  return (trip.departureDates ?? []).filter((d) => d.pickupVariantId === variantId);
}

/**
 * Builds a Trip-shaped object with the selected Pickup Variant's fields
 * swapped in for display: `pickup`/`drop`/`duration`/`itinerary` and a
 * `departureDates` array narrowed to just this variant's batches. `price`
 * reflects the variant's own starting/discounted/booking-amount defaults so
 * `TripBookingCard`/`TripPricingTable` show the right numbers before a
 * specific batch is picked; the actual per-batch `priceOverride` /
 * `bookingAmountOverride` (if set) still win once a batch is selected,
 * exactly as `computeBookingPricing` already resolves for any trip.
 *
 * Every other Trip field (id, slug, title, gallery, accommodation, meals,
 * inclusions, FAQs, policies, SEO, …) is untouched — this only overrides the
 * handful of fields that are meant to differ per pickup city.
 *
 * Deliberately does NOT touch `destinationRoutes` — that field is the
 * pre-existing "alternate circuit routes" feature (other Trip documents in
 * the same `circuitGroup`), which is unrelated to a pickup variant's own
 * route. A variant's own route (`PickupVariant.route`) is rendered directly
 * from the selected variant by `TripPickupVariants` instead, so the two
 * features never collide or overwrite one another.
 */
export function withPickupVariant(trip: Trip, variant: PickupVariant): Trip {
  const batches = getVariantBatches(trip, variant.id);
  return {
    ...trip,
    pickup: variant.pickupCity,
    drop: variant.dropCity,
    duration: variant.duration,
    itinerary: variant.itinerary,
    departureDates: batches,
    totalSeats: batches.reduce((sum, d) => sum + (d.seatsTotal || 0), 0) || trip.totalSeats,
    availableSeats: batches.reduce((sum, d) => sum + (d.seatsAvailable || 0), 0) || trip.availableSeats,
    price: {
      base: variant.startingPrice,
      discounted: variant.discountedPrice,
      bookingAmount: variant.bookingAmount,
      currency: trip.price.currency,
    },
  };
}
