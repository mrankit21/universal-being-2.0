import { describe, it, expect } from "vitest";
import { getTripAvailability } from "./availability";
import type { Trip, DepartureDate } from "@/types/trip";

const NOW = new Date("2026-07-20T00:00:00.000Z");

function makeDeparture(overrides: Partial<DepartureDate>): DepartureDate {
  return {
    id: "dep",
    startDate: "2026-08-01",
    endDate: "2026-08-05",
    seatsTotal: 10,
    seatsAvailable: 10,
    status: "open",
    ...overrides,
  };
}

function makeTrip(departureDates: DepartureDate[], availableSeats = 0): Trip {
  return { departureDates, availableSeats } as unknown as Trip;
}

describe("getTripAvailability", () => {
  it("filters out unpublished departures", () => {
    const published = makeDeparture({ id: "pub", isPublished: true });
    const hidden = makeDeparture({ id: "hidden", isPublished: false });
    const trip = makeTrip([published, hidden]);
    const result = getTripAvailability(trip, NOW);

    expect(result.publishedDepartures.map((d) => d.id)).toEqual(["pub"]);
  });

  it("treats a missing isPublished field as published (backward compatibility)", () => {
    const legacy = makeDeparture({ id: "legacy" });
    delete (legacy as { isPublished?: boolean }).isPublished;
    const trip = makeTrip([legacy]);
    const result = getTripAvailability(trip, NOW);

    expect(result.publishedDepartures).toHaveLength(1);
  });

  it("excludes departures that have already ended", () => {
    const past = makeDeparture({ id: "past", startDate: "2026-01-01", endDate: "2026-01-05" });
    const future = makeDeparture({ id: "future", startDate: "2026-09-01", endDate: "2026-09-05" });
    const trip = makeTrip([past, future]);
    const result = getTripAvailability(trip, NOW);

    expect(result.upcomingDepartures.map((d) => d.id)).toEqual(["future"]);
  });

  it("sorts upcoming departures soonest-first", () => {
    const later = makeDeparture({ id: "later", startDate: "2026-12-01", endDate: "2026-12-05" });
    const sooner = makeDeparture({ id: "sooner", startDate: "2026-08-01", endDate: "2026-08-05" });
    const trip = makeTrip([later, sooner]);
    const result = getTripAvailability(trip, NOW);

    expect(result.upcomingDepartures.map((d) => d.id)).toEqual(["sooner", "later"]);
  });

  it("only picks a bookable next departure with status open or filling-fast", () => {
    const soldOut = makeDeparture({
      id: "sold-out",
      startDate: "2026-08-01",
      endDate: "2026-08-05",
      status: "sold-out",
    });
    const fillingFast = makeDeparture({
      id: "filling-fast",
      startDate: "2026-09-01",
      endDate: "2026-09-05",
      status: "filling-fast",
    });
    const trip = makeTrip([soldOut, fillingFast]);
    const result = getTripAvailability(trip, NOW);

    expect(result.nextDeparture?.id).toBe("filling-fast");
  });

  it("falls back to the earliest upcoming departure when none are bookable", () => {
    const soldOut = makeDeparture({ id: "sold-out", status: "sold-out" });
    const trip = makeTrip([soldOut]);
    const result = getTripAvailability(trip, NOW);

    expect(result.nextDeparture?.id).toBe("sold-out");
    expect(result.isAvailable).toBe(false);
  });

  it("returns null nextDeparture when there are no upcoming departures at all", () => {
    const past = makeDeparture({ id: "past", startDate: "2026-01-01", endDate: "2026-01-05" });
    const trip = makeTrip([past], 5);
    const result = getTripAvailability(trip, NOW);

    expect(result.nextDeparture).toBeNull();
  });

  it("sums seatsLeft only across bookable (open/filling-fast) upcoming departures", () => {
    const open = makeDeparture({ id: "open", status: "open", seatsAvailable: 4 });
    const fillingFast = makeDeparture({ id: "filling-fast", status: "filling-fast", seatsAvailable: 3 });
    const soldOut = makeDeparture({ id: "sold-out", status: "sold-out", seatsAvailable: 2 });
    const trip = makeTrip([open, fillingFast, soldOut]);
    const result = getTripAvailability(trip, NOW);

    expect(result.seatsLeft).toBe(7);
  });

  it("never lets a negative seatsAvailable pull the total below zero", () => {
    const negative = makeDeparture({ id: "neg", status: "open", seatsAvailable: -5 });
    const trip = makeTrip([negative]);
    const result = getTripAvailability(trip, NOW);

    expect(result.seatsLeft).toBe(0);
  });

  it("falls back to trip.availableSeats when the trip has no departureDates at all", () => {
    const trip = makeTrip([], 12);
    const result = getTripAvailability(trip, NOW);

    expect(result.seatsLeft).toBe(12);
    expect(result.isAvailable).toBe(true);
  });

  it("is not available when there are no departures and no legacy seats", () => {
    const trip = makeTrip([], 0);
    const result = getTripAvailability(trip, NOW);

    expect(result.isAvailable).toBe(false);
  });
});
