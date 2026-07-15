/**
 * Step 7.6E Part 3 — Availability. Single source of truth for "seats left /
 * next departure / upcoming departures" so the public Trip page (pricing
 * table, booking card) and any future surface all compute it the exact same
 * way instead of re-deriving it ad hoc. Pure function, no I/O — reused by
 * server components at render time (Architecture §5, "server-computed
 * rather than manually curated").
 */
import type { Trip, DepartureDate } from "@/types/trip";

export interface TripAvailability {
  /** Every departure batch that should be visible on the public site —
   * `isPublished !== false` keeps this backward compatible with batches
   * saved before that field existed (Step 7.6E Part 2). */
  publishedDepartures: DepartureDate[];
  /** Published batches that haven't ended yet, soonest first. */
  upcomingDepartures: DepartureDate[];
  /** The single next bookable batch — first upcoming batch that isn't
   * sold out/closed. `null` when nothing is open. */
  nextDeparture: DepartureDate | null;
  /** Sum of `seatsAvailable` across upcoming, published, non-closed
   * batches. Falls back to `trip.availableSeats` when a trip has no
   * `departureDates[]` yet (older/simpler trips), same fallback
   * `TripPricingTable` already relied on. */
  seatsLeft: number;
  /** True when there's at least one open/filling-fast upcoming batch. */
  isAvailable: boolean;
}

function isPublished(d: DepartureDate) {
  return d.isPublished ?? true;
}

function hasEnded(d: DepartureDate, now: Date) {
  const end = new Date(d.endDate || d.startDate);
  return !isNaN(end.getTime()) && end.getTime() < now.getTime();
}

export function getTripAvailability(trip: Trip, now: Date = new Date()): TripAvailability {
  const publishedDepartures = trip.departureDates.filter(isPublished);

  const upcomingDepartures = publishedDepartures
    .filter((d) => !hasEnded(d, now))
    .slice()
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const bookable = upcomingDepartures.filter((d) => d.status === "open" || d.status === "filling-fast");
  const nextDeparture = bookable[0] ?? upcomingDepartures[0] ?? null;

  const seatsLeft = upcomingDepartures.length
    ? bookable.reduce((sum, d) => sum + Math.max(0, d.seatsAvailable), 0)
    : trip.availableSeats;

  return {
    publishedDepartures,
    upcomingDepartures,
    nextDeparture,
    seatsLeft,
    isAvailable: bookable.length > 0 || (upcomingDepartures.length === 0 && trip.availableSeats > 0),
  };
}
