"use client";

import type { Trip } from "@/types/trip";
import { themeRegistry } from "@/data/themes";
import { TripImage } from "@/components/trip/trip-image";
import { CarouselBase } from "@/components/animation/carousel-base";
import { SectionHeading } from "@/components/primitives/section-heading";
import { TripGalleryLightbox, GalleryExpandHint } from "@/components/trip/trip-gallery-lightbox";

export interface TripGalleryProps {
  trip: Trip;
}

/**
 * TripGallery — Architecture §2's "swipeable, ImageKit-driven" gallery.
 * Reuses `CarouselBase`, the same swipe engine `FeaturedTripsSection` uses,
 * rather than a bespoke scroller (Architecture §10 "reuse, don't
 * hand-roll"). Each slide renders through `TripImage`, so placeholder and
 * real photos share the exact same gallery UI. Step 7.6E Part 6 adds a
 * fullscreen viewer (previous/next/counter) on top — every thumbnail below
 * is now clickable via `TripGalleryLightbox`, with no change to the grid
 * layout itself.
 */
export function TripGallery({ trip }: TripGalleryProps) {
  const theme = themeRegistry[trip.themeKey];

  if (trip.gallery.length === 0) return null;

  return (
    <section id="trip-gallery" className="mx-auto max-w-6xl px-6 py-8">
      <SectionHeading title="Photos" className="mb-5" />

      <TripGalleryLightbox images={trip.gallery} theme={theme} tripTitle={trip.title}>
        {(open) => (
          <>
            <CarouselBase label={`${trip.title} photo gallery`} className="sm:hidden">
              {trip.gallery.map((asset, i) => (
                <div key={i} className="pr-4">
                  <button
                    type="button"
                    onClick={() => open(i)}
                    className="group relative block w-full text-left"
                    aria-label={`View photo ${i + 1} of ${trip.gallery.length} fullscreen`}
                  >
                    <TripImage asset={asset} theme={theme} variant="gallery" containerClassName="rounded-lg" />
                    <GalleryExpandHint />
                  </button>
                </div>
              ))}
            </CarouselBase>

            <div className="hidden grid-cols-3 gap-3 sm:grid">
              {trip.gallery.map((asset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => open(i)}
                  className="group relative block text-left"
                  aria-label={`View photo ${i + 1} of ${trip.gallery.length} fullscreen`}
                >
                  <TripImage asset={asset} theme={theme} variant="gallery" containerClassName="rounded-lg" />
                  <GalleryExpandHint />
                </button>
              ))}
            </div>
          </>
        )}
      </TripGalleryLightbox>
    </section>
  );
}
