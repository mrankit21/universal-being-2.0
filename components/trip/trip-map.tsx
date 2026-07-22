import type { Trip } from "@/types/trip";
import { SectionHeading } from "@/components/primitives/section-heading";

export interface TripMapProps {
  trip: Trip;
}

/**
 * TripMap — Architecture §2's `TripMap`. Uses the key-less Google Maps
 * "output=embed" query URL by default (built from `Trip.mapQuery`), or a
 * fully custom `Trip.mapEmbedUrl` when the admin supplies one (e.g. a
 * multi-pin itinerary map). No API key required for either path.
 */
export function TripMap({ trip }: TripMapProps) {
  const src =
    trip.mapEmbedUrl ??
    `https://www.google.com/maps?q=${encodeURIComponent(trip.mapQuery)}&output=embed`;

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <SectionHeading title="Location" className="mb-5" />
      <div className="overflow-hidden rounded-lg border border-border">
        <iframe
          src={src}
          title={`Map showing ${trip.destinationName}`}
          className="h-80 w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </section>
  );
}
