/**
 * Booking Engine Foundation — Part 4 "Price Calculation". Single source of
 * truth for turning `Trip.price` + a chosen `DepartureDate` + traveller
 * count into the full price breakdown (offer price, original price,
 * discount, booking amount due, remaining amount, total). Pure function,
 * no I/O — imported by `components/trip/booking-form.tsx` for the live
 * client-side summary AND by `app/api/bookings/route.ts` so the server
 * always recomputes the same numbers itself rather than trusting whatever
 * the client posts (Part 3 "Booking Validation" / anti-tampering).
 *
 * Mirrors the exact same "discounted ?? base" + `priceOverride` rule
 * `TripPricingTable` and `TripBookingCard` already use (`lib/trip/
 * availability.ts`), so the number shown pre-booking never drifts from
 * the number charged.
 */
import type { Trip, DepartureDate, SharingType } from "@/types/trip";

export interface BookingPriceBreakdown {
  /** Per-person price actually charged (after discount / batch override /
   * sharing-type markup). */
  offerPrice: number;
  /** Per-person pre-discount, pre-markup price — present only when higher
   * than the pre-markup offer price. Deliberately never includes the
   * sharing-type markup, so the struck-through "original price" always
   * reads as a discount off the Quad base, not an inflated double/triple
   * number. */
  originalPrice: number | null;
  /** Per-person booking (deposit) amount required to hold the seats. */
  bookingAmountPerPerson: number;
  currency: string;
  travellers: number;
  /** offerPrice * travellers */
  totalAmount: number;
  /** (originalPrice - offerPrice) * travellers, 0 when no discount. */
  discountAmount: number;
  /** bookingAmountPerPerson * travellers, capped at totalAmount. */
  bookingAmountDue: number;
  /** totalAmount - bookingAmountDue. */
  remainingAmount: number;
  /** Room Sharing selected for this booking. Always present — defaults to
   * "quad" (the base price, no markup) when the caller doesn't pass one. */
  sharingType: SharingType;
  /** Per-person surcharge added on top of the Quad base price for the
   * selected sharing type. 0 for Quad, or when the trip has no
   * `sharingTypeMarkup` configured (backward compatible). */
  sharingTypeMarkupPerPerson: number;
}

export function computeBookingPricing(
  trip: Trip,
  departure: DepartureDate | null | undefined,
  travellers: number,
  sharingType: SharingType = "quad"
): BookingPriceBreakdown {
  const safeTravellers = Math.max(1, Math.floor(travellers) || 1);
  const currency = trip.price.currency || "INR";

  // Base/discounted/override price is always the Quad Sharing price — the
  // sharing-type markup is layered on top of it below, never baked into
  // `trip.price.base` itself.
  const quadOfferPrice = departure?.priceOverride ?? trip.price.discounted ?? trip.price.base;
  const originalPrice =
    !departure?.priceOverride && trip.price.discounted && trip.price.discounted < trip.price.base
      ? trip.price.base
      : null;

  // Room Sharing markup (2026-07). Double/Triple add a flat per-person
  // surcharge on top of the Quad price; missing `sharingTypeMarkup` (older
  // trips) or an unset double/triple value both fall back to 0, so this is
  // a no-op unless a trip explicitly opts in.
  const sharingTypeMarkupPerPerson =
    sharingType === "double"
      ? trip.price.sharingTypeMarkup?.double ?? 0
      : sharingType === "triple"
        ? trip.price.sharingTypeMarkup?.triple ?? 0
        : 0;

  const offerPrice = quadOfferPrice + sharingTypeMarkupPerPerson;

  // Pickup Variant Architecture (2026-07): a batch tagged to a pickup
  // variant may carry its own deposit amount, mirroring `priceOverride`'s
  // existing per-batch pattern. Falls back to the trip-level amount exactly
  // as before when unset, so nothing changes for any trip without variants.
  const bookingAmountPerPerson = Math.min(departure?.bookingAmountOverride ?? trip.price.bookingAmount ?? 0, offerPrice);

  const totalAmount = offerPrice * safeTravellers;
  const discountAmount = originalPrice ? (originalPrice - quadOfferPrice) * safeTravellers : 0;
  const bookingAmountDue = Math.min(bookingAmountPerPerson * safeTravellers, totalAmount);
  const remainingAmount = Math.max(0, totalAmount - bookingAmountDue);

  return {
    offerPrice,
    originalPrice,
    bookingAmountPerPerson,
    currency,
    travellers: safeTravellers,
    totalAmount,
    discountAmount,
    bookingAmountDue,
    remainingAmount,
    sharingType,
    sharingTypeMarkupPerPerson,
  };
}
