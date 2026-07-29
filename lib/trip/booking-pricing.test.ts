import { describe, it, expect } from "vitest";
import { computeBookingPricing } from "./booking-pricing";
import type { Trip, DepartureDate } from "@/types/trip";

function makeTrip(price: Partial<Trip["price"]>): Trip {
  return {
    price: {
      base: 10000,
      bookingAmount: 2000,
      currency: "INR",
      ...price,
    },
  } as unknown as Trip;
}

function makeDeparture(overrides: Partial<DepartureDate> = {}): DepartureDate {
  return {
    id: "dep-1",
    startDate: "2026-10-01",
    endDate: "2026-10-05",
    seatsTotal: 20,
    seatsAvailable: 10,
    status: "open",
    ...overrides,
  };
}

describe("computeBookingPricing", () => {
  it("uses the base price with no discount and no departure override", () => {
    const trip = makeTrip({ base: 10000, discounted: undefined, bookingAmount: 2000 });
    const result = computeBookingPricing(trip, null, 2);

    expect(result.offerPrice).toBe(10000);
    expect(result.originalPrice).toBeNull();
    expect(result.totalAmount).toBe(20000);
    expect(result.discountAmount).toBe(0);
    expect(result.bookingAmountDue).toBe(4000);
    expect(result.remainingAmount).toBe(16000);
  });

  it("prefers the discounted price and surfaces originalPrice when it's lower than base", () => {
    const trip = makeTrip({ base: 10000, discounted: 8000, bookingAmount: 2000 });
    const result = computeBookingPricing(trip, null, 1);

    expect(result.offerPrice).toBe(8000);
    expect(result.originalPrice).toBe(10000);
    expect(result.discountAmount).toBe(2000);
    expect(result.totalAmount).toBe(8000);
  });

  it("a departure priceOverride wins over both discounted and base price", () => {
    const trip = makeTrip({ base: 10000, discounted: 8000, bookingAmount: 2000 });
    const departure = makeDeparture({ priceOverride: 12000 });
    const result = computeBookingPricing(trip, departure, 1);

    expect(result.offerPrice).toBe(12000);
    // priceOverride means no "struck-through original price" — it's a batch-specific price, not a discount.
    expect(result.originalPrice).toBeNull();
    expect(result.discountAmount).toBe(0);
  });

  it("does not treat discounted as a discount when it's not actually lower than base", () => {
    const trip = makeTrip({ base: 10000, discounted: 10000, bookingAmount: 2000 });
    const result = computeBookingPricing(trip, null, 1);

    expect(result.offerPrice).toBe(10000);
    expect(result.originalPrice).toBeNull();
    expect(result.discountAmount).toBe(0);
  });

  it("floors and clamps traveller counts to a minimum of 1", () => {
    const trip = makeTrip({ base: 5000, bookingAmount: 1000 });

    expect(computeBookingPricing(trip, null, 0).travellers).toBe(1);
    expect(computeBookingPricing(trip, null, -3).travellers).toBe(1);
    expect(computeBookingPricing(trip, null, 3.9).travellers).toBe(3);
    expect(computeBookingPricing(trip, null, NaN).travellers).toBe(1);
  });

  it("caps the per-person booking amount at the offer price so the deposit never exceeds the total", () => {
    // bookingAmount (deposit) configured higher than the actual offer price — should clamp, not overcharge.
    const trip = makeTrip({ base: 1000, discounted: 500, bookingAmount: 2000 });
    const result = computeBookingPricing(trip, null, 1);

    expect(result.bookingAmountPerPerson).toBe(500);
    expect(result.bookingAmountDue).toBe(500);
    expect(result.remainingAmount).toBe(0);
  });

  it("never lets bookingAmountDue exceed totalAmount, and remainingAmount never goes negative", () => {
    const trip = makeTrip({ base: 1000, bookingAmount: 1000 });
    const result = computeBookingPricing(trip, null, 1);

    expect(result.bookingAmountDue).toBeLessThanOrEqual(result.totalAmount);
    expect(result.remainingAmount).toBeGreaterThanOrEqual(0);
  });

  it("falls back to INR when trip.price.currency is missing", () => {
    const trip = makeTrip({ currency: "" });
    const result = computeBookingPricing(trip, null, 1);
    expect(result.currency).toBe("INR");
  });

  it("scales total, discount, and booking-amount-due linearly with traveller count", () => {
    const trip = makeTrip({ base: 10000, discounted: 7500, bookingAmount: 1500 });
    const one = computeBookingPricing(trip, null, 1);
    const four = computeBookingPricing(trip, null, 4);

    expect(four.totalAmount).toBe(one.totalAmount * 4);
    expect(four.discountAmount).toBe(one.discountAmount * 4);
    expect(four.bookingAmountDue).toBe(one.bookingAmountDue * 4);
  });

  describe("Room Sharing markup", () => {
    it("defaults to quad sharing with zero markup when no sharingType is passed", () => {
      const trip = makeTrip({ base: 10000, bookingAmount: 2000, sharingTypeMarkup: { double: 1000, triple: 500 } });
      const result = computeBookingPricing(trip, null, 1);

      expect(result.sharingType).toBe("quad");
      expect(result.sharingTypeMarkupPerPerson).toBe(0);
      expect(result.offerPrice).toBe(10000);
    });

    it("adds the per-person double markup on top of the offer price", () => {
      const trip = makeTrip({ base: 10000, bookingAmount: 2000, sharingTypeMarkup: { double: 1000, triple: 500 } });
      const result = computeBookingPricing(trip, null, 2, "double");

      expect(result.sharingTypeMarkupPerPerson).toBe(1000);
      expect(result.offerPrice).toBe(11000);
      // Markup applies per person, not once per booking.
      expect(result.totalAmount).toBe(22000);
    });

    it("adds the per-person triple markup on top of the offer price", () => {
      const trip = makeTrip({ base: 10000, bookingAmount: 2000, sharingTypeMarkup: { double: 1000, triple: 500 } });
      const result = computeBookingPricing(trip, null, 3, "triple");

      expect(result.sharingTypeMarkupPerPerson).toBe(500);
      expect(result.offerPrice).toBe(10500);
      expect(result.totalAmount).toBe(31500);
    });

    it("falls back to zero markup on trips with no sharingTypeMarkup configured (backward compatible)", () => {
      const trip = makeTrip({ base: 10000, bookingAmount: 2000 });
      const result = computeBookingPricing(trip, null, 1, "double");

      expect(result.sharingTypeMarkupPerPerson).toBe(0);
      expect(result.offerPrice).toBe(10000);
    });

    it("keeps originalPrice as the pre-markup struck-through price, and discountAmount unaffected by markup", () => {
      const trip = makeTrip({ base: 10000, discounted: 8000, bookingAmount: 2000, sharingTypeMarkup: { double: 1000 } });
      const result = computeBookingPricing(trip, null, 1, "double");

      expect(result.originalPrice).toBe(10000);
      expect(result.offerPrice).toBe(9000);
      expect(result.discountAmount).toBe(2000);
    });

    it("caps bookingAmountPerPerson using the markup-inclusive offer price", () => {
      const trip = makeTrip({ base: 500, bookingAmount: 2000, sharingTypeMarkup: { double: 1000 } });
      const result = computeBookingPricing(trip, null, 1, "double");

      // offerPrice = 500 + 1000 = 1500, so the 2000 configured deposit clamps to 1500.
      expect(result.offerPrice).toBe(1500);
      expect(result.bookingAmountPerPerson).toBe(1500);
    });
  });
});
