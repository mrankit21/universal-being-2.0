import type { Destination, DestinationPointOfInterestCategory } from "@/types/destination";
import { themeRegistry } from "@/data/themes";
import { TripImage } from "@/components/trip/trip-image";
import { SectionHeading } from "@/components/primitives/section-heading";
import { Tag } from "@/components/primitives/tag";

export interface DestinationPointsOfInterestProps {
  destination: Destination;
}

const CATEGORY_LABEL: Record<DestinationPointOfInterestCategory, string> = {
  famous: "Famous",
  historical: "Historical",
  adventure: "Adventure",
};

const CATEGORY_TONE: Record<DestinationPointOfInterestCategory, "brass" | "neutral" | "teal"> = {
  famous: "brass",
  historical: "neutral",
  adventure: "teal",
};

/**
 * DestinationPointsOfInterest — "Places to see" section on the Destination
 * Detail Page. Each entry is admin-authored (name, description, category,
 * own photo) via the Points of Interest field on the Destination form.
 * Mirrors `DestinationGallery`'s section shape/placement, rendered right
 * after it so the page reads: hero → photos → places to see → trips.
 */
export function DestinationPointsOfInterest({ destination }: DestinationPointsOfInterestProps) {
  const theme = themeRegistry[destination.themeKey];

  if (destination.pointsOfInterest.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <SectionHeading title={`Places to see in ${destination.name}`} className="mb-5" />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {destination.pointsOfInterest.map((poi, i) => (
          <div key={i} className="space-y-3">
            <TripImage asset={poi.image} theme={theme} variant="cover" containerClassName="rounded-lg">
              <Tag tone={CATEGORY_TONE[poi.category]} className="absolute left-3 top-3">
                {CATEGORY_LABEL[poi.category]}
              </Tag>
            </TripImage>
            <div>
              <h3 className="font-medium">{poi.name}</h3>
              {poi.description && (
                <p className="mt-1 text-sm text-muted-foreground">{poi.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
