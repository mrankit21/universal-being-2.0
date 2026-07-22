import type { Trip } from "@/types/trip";
import { TripCard } from "@/components/trip/trip-card";
import { SectionHeading } from "@/components/primitives/section-heading";

export interface RelatedTripsProps {
  trips: Trip[];
}

/** RelatedTrips — renders the server-computed list from `getRelatedTrips()`
 * (Architecture §5: "server-computed by category + tags, not manually
 * curated per page"). Purely presentational; the computation lives in
 * `lib/api/trips.ts`. */
export function RelatedTrips({ trips }: RelatedTripsProps) {
  if (trips.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <SectionHeading title="You might also like" className="mb-5" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {trips.map((trip) => (
          <TripCard key={trip.slug} trip={trip} />
        ))}
      </div>
    </section>
  );
}
