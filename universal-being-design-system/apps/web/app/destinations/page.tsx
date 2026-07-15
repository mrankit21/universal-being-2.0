import type { Metadata } from "next";

import { getDestinationsWithTripCounts } from "@/lib/api/destinations";
import { DestinationCard } from "@/components/destination/destination-card";
import { SectionHeading } from "@/components/primitives/section-heading";

export const metadata: Metadata = {
  title: "Destinations | Universal Being",
  description: "Every destination Universal Being runs small-group trips to — from Himalayan valleys to Rajasthan's lake city.",
};

/**
 * Destination Listing Page — requirement #6. Server Component: fetches via
 * `lib/api/destinations.ts` (never touches `data/destinations/*` directly)
 * and renders one `DestinationCard` per published destination. Adding a
 * destination in the future Admin Panel is enough to add a card here.
 */
export default async function DestinationsPage() {
  const destinations = await getDestinationsWithTripCounts();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <SectionHeading
        eyebrow="Where we go"
        title="Destinations"
        description="Small-group trips across the Himalayas and Rajasthan, each run with a dedicated trip leader."
        className="mb-8"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {destinations.map((destination) => (
          <DestinationCard key={destination.slug} destination={destination} />
        ))}
      </div>
    </div>
  );
}
