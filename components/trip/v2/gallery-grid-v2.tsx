"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface GalleryImageV2 {
  id: string;
  imageUrl: string;
  imageAlt: string;
  caption?: string;
}

const DEFAULT_IMAGES: GalleryImageV2[] = [
  { id: "1", imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=600&auto=format&fit=crop", imageAlt: "Nako Lake at sunrise" },
  { id: "2", imageUrl: "https://images.unsplash.com/photo-1531306728370-e2ebd9d7bb99?q=80&w=600&auto=format&fit=crop", imageAlt: "Cinque Terre-style hillside village", caption: "Village" },
  { id: "3", imageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=600&auto=format&fit=crop", imageAlt: "Mountain peaks at dawn", caption: "Lake" },
  { id: "4", imageUrl: "https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?q=80&w=600&auto=format&fit=crop", imageAlt: "Milky Way over mountains", caption: "Trekking group" },
];

/**
 * Trip 2.0 UI — photo gallery grid, matching the reference screenshot's
 * two-column staggered layout with optional captions. Static content only
 * for now; once approved this maps from `Trip.gallery` (`ImageAsset[]`).
 *
 * Revision (2026-08): switched from `grid-cols-2` + `row-span-2` to CSS
 * multi-column (`columns-2`). The grid+row-span version left visible empty
 * gaps below shorter cards, because a spanned grid item's height comes
 * from the *track* size, not its own image — with no `grid-auto-rows` set
 * and images of differing natural aspect ratios, the tracks never lined up
 * with actual photo heights. `columns-2` instead flows each figure into
 * whichever column has room next, sized purely by its own image, so there
 * is no shared row grid to leave a hole in. `break-inside-avoid` keeps a
 * given photo+caption from splitting across the column break.
 */
export function GalleryGridV2({ images = DEFAULT_IMAGES }: { images?: GalleryImageV2[] }) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const close = () => setOpenIndex(null);
  const step = (delta: 1 | -1) =>
    setOpenIndex((i) => (i === null ? null : (i + delta + images.length) % images.length));

  React.useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, images.length]);

  return (
    <section id="gallery" className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <h2 className="mb-6 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Gallery</h2>
      <div className="columns-2 gap-3 sm:gap-4">
        {images.map((img, i) => (
          <figure key={img.id} className="mb-3 break-inside-avoid sm:mb-4">
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              className="block w-full overflow-hidden rounded-xl"
              aria-label={`Open photo ${i + 1}: ${img.imageAlt}`}
            >
              <img src={img.imageUrl} alt={img.imageAlt} className="block w-full" loading="lazy" />
            </button>
            {img.caption ? <figcaption className="mt-1 text-xs text-muted-foreground">{img.caption}</figcaption> : null}
          </figure>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>

          <img
            src={images[openIndex].imageUrl}
            alt={images[openIndex].imageAlt}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                className="absolute left-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-4"
                aria-label="Previous photo"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-4"
                aria-label="Next photo"
              >
                <ChevronRight className="size-5" />
              </button>
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
                {openIndex + 1} / {images.length}
              </span>
            </>
          )}
        </div>
      )}
    </section>
  );
}
