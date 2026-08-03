import type { Metadata } from "next";

import { getPublishedTrip2Trips } from "@/lib/api/trip2";
import { Trip2Listing } from "@/components/home/v2/trip2-listing";
import { SectionHeading } from "@/components/primitives/section-heading";

export const metadata: Metadata = {
  title: "Trips | Universal Being",
  description: "Every Trip 2.0 trip Universal Being currently runs, searchable by title or destination.",
};

/**
 * Trip 2.0 Listing Page (`/trip2`) — the Trip 2.0 counterpart of
 * `app/trips/page.tsx`. Exists so that once Site Settings' "Trips
 * Version" is forced to "v2", there's a real listing surface pointing at
 * Trip 2.0 pages (`/trips` itself redirects here in that mode — see that
 * file). Server Component fetches every published Trip 2.0 document via
 * `getPublishedTrip2Trips()`; the interactive search shell (`Trip2Listing`)
 * narrows that already-fetched list client-side.
 */
export default async function Trip2ListingPage() {
  const trips = await getPublishedTrip2Trips();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <SectionHeading
        eyebrow="All trips"
        title="Every trip we run"
        description="Small groups, fixed trip leaders, and a themed page for every destination."
        className="mb-8"
      />
      <Trip2Listing trips={trips} />
    </div>
  );
}
