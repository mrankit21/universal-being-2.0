"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";

import type { ImageAsset } from "@/types/trip";
import type { ThemeConfig } from "@/types/theme";
import { TripImage } from "@/components/trip/trip-image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface TripGalleryLightboxProps {
  images: ImageAsset[];
  theme: ThemeConfig;
  tripTitle: string;
  children: (open: (index: number) => void) => React.ReactNode;
}

/**
 * TripGalleryLightbox — Step 7.6E Part 6 "Gallery Experience → Fullscreen
 * Viewer / Previous / Next / Image Counter". A render-prop wrapper so
 * `TripGallery` keeps its existing grid/carousel markup untouched
 * (requirement: don't redesign the UI) and just makes each thumbnail
 * clickable via the `open(index)` callback it's handed. Every image still
 * comes from the trip's own `gallery[]` — no new ImageKit wiring needed.
 */
export function TripGalleryLightbox({ images, theme, tripTitle, children }: TripGalleryLightboxProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = () => setOpenIndex(null);
  const step = (delta: 1 | -1) =>
    setOpenIndex((i) => (i === null ? null : (i + delta + images.length) % images.length));

  return (
    <>
      {children((index) => setOpenIndex(index))}

      <Dialog open={openIndex !== null} onOpenChange={(v) => !v && close()}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">{tripTitle} photo gallery</DialogTitle>
          {openIndex !== null && (
            <div className="relative">
              <TripImage
                asset={images[openIndex]}
                theme={theme}
                variant="hero"
                containerClassName="rounded-lg"
                sizes="(min-width: 1024px) 900px, 100vw"
              />

              {images.length > 1 && (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2"
                    onClick={() => step(-1)}
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => step(1)}
                    aria-label="Next photo"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ub-ink-900/60 px-3 py-1 text-xs font-medium text-white">
                    {openIndex + 1} / {images.length}
                  </span>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Small "expand" affordance overlaid on a thumbnail to hint it opens the
 * fullscreen viewer — purely visual, the click handler lives on the parent
 * button `TripGallery` wraps each thumbnail in. */
export function GalleryExpandHint() {
  return (
    <span className="absolute bottom-2 right-2 flex size-7 items-center justify-center rounded-full bg-ub-ink-900/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
      <Expand className="size-3.5" aria-hidden="true" />
    </span>
  );
}
