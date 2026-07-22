import type { Metadata } from "next";

import { getListedTrips } from "@/lib/api/trips";
import { TripListing } from "@/components/trip/trip-listing";
import { SectionHeading } from "@/components/primitives/section-heading";

export const metadata: Metadata = {
  title: "Trips | Universal Being",
  description: "Every small-group trip Universal Being currently runs, searchable and filterable by difficulty.",
};

/**
 * Trip Listing Page (`/trips`) — requirement #4/#6. Server Component fetches
 * one Parent Trip per destination circuit via `getListedTrips()` (Trip
 * Architecture Fix, 2026-07) — duration variants live inside each Parent's
 * own detail page, not as separate listing cards. The interactive
 * search/filter shell (`TripListing`) is a client component that narrows
 * this already-fetched list. Matches the earlier `/trips` + `TripDiscovery`
 * split, now against the real `Trip` type.
 */
export default async function TripsPage() {
  const trips = await getListedTrips();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <SectionHeading
        eyebrow="All trips"
        title="Every trip we run"
        description="Small groups, fixed trip leaders, and a themed page for every destination."
        className="mb-8"
      />
      <TripListing trips={trips} />
    </div>
  );
}
