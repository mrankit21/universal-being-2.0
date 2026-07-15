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
import type { Trip, DepartureDate } from "@/types/trip";

export interface BookingPriceBreakdown {
  /** Per-person price actually charged (after discount / batch override). */
  offerPrice: number;
  /** Per-person pre-discount price — present only when higher than offerPrice. */
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
}

export function computeBookingPricing(
  trip: Trip,
  departure: DepartureDate | null | undefined,
  travellers: number
): BookingPriceBreakdown {
  const safeTravellers = Math.max(1, Math.floor(travellers) || 1);
  const currency = trip.price.currency || "INR";

  const offerPrice = departure?.priceOverride ?? trip.price.discounted ?? trip.price.base;
  const originalPrice =
    !departure?.priceOverride && trip.price.discounted && trip.price.discounted < trip.price.base
      ? trip.price.base
      : null;

  const bookingAmountPerPerson = Math.min(trip.price.bookingAmount || 0, offerPrice);

  const totalAmount = offerPrice * safeTravellers;
  const discountAmount = originalPrice ? (originalPrice - offerPrice) * safeTravellers : 0;
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
  };
}
