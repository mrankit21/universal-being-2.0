import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getListedTrips } from "@/lib/api/trips";
import { getSiteSettings } from "@/lib/api/site-settings";
import { resolveVersion } from "@/lib/utils/device-version";
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
 *
 * Trip 2.0 (2026-08): when Site Settings' "Trips Version" resolves to
 * "v2" for this visitor — forced site-wide with "v2", or device-resolved
 * under "auto" (phone → v2, laptop/desktop → v1; see
 * lib/utils/device-version.ts) — the old Trip collection stops being a
 * public surface for them and this route redirects straight to `/trip2`,
 * so there is never a moment where both listings are reachable side by
 * side for the same visitor.
 */
export default async function TripsPage() {
  const siteSettings = await getSiteSettings();
  if ((await resolveVersion(siteSettings.activeTripsVersion)) === "v2") {
    redirect("/trip2");
  }

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
