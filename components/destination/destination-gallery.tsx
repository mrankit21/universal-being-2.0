import type { Destination } from "@/types/destination";
import { themeRegistry } from "@/data/themes";
import { TripImage } from "@/components/trip/trip-image";
import { CarouselBase } from "@/components/animation/carousel-base";
import { SectionHeading } from "@/components/primitives/section-heading";

export interface DestinationGalleryProps {
  destination: Destination;
}

/**
 * DestinationGallery — Step 7.6C-B Part 2. The Destination Detail Page's
 * missing "Gallery" surface (Destination CMS §4: "Destination Pages should
 * load: … Gallery … from MongoDB"). Mirrors `components/trip/trip-gallery.tsx`'s
 * shape (same carousel-on-mobile / grid-on-desktop pattern, same `TripImage`
 * renderer) as its own component rather than a modification to the Trip
 * gallery, since Trip display components are out of scope for this phase.
 */
export function DestinationGallery({ destination }: DestinationGalleryProps) {
  const theme = themeRegistry[destination.themeKey];

  if (destination.gallery.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <SectionHeading title="Photos" className="mb-5" />

      <CarouselBase label={`${destination.name} photo gallery`} className="sm:hidden">
        {destination.gallery.map((asset, i) => (
          <div key={i} className="pr-4">
            <TripImage asset={asset} theme={theme} variant="gallery" containerClassName="rounded-lg" />
          </div>
        ))}
      </CarouselBase>

      <div className="hidden grid-cols-3 gap-3 sm:grid">
        {destination.gallery.map((asset, i) => (
          <TripImage key={i} asset={asset} theme={theme} variant="gallery" containerClassName="rounded-lg" />
        ))}
      </div>
    </section>
  );
}
