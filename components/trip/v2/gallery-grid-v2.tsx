"use client";

import * as React from "react";

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
  return (
    <section id="gallery" className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <h2 className="mb-6 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Gallery</h2>
      <div className="columns-2 gap-3 sm:gap-4">
        {images.map((img) => (
          <figure key={img.id} className="mb-3 break-inside-avoid sm:mb-4">
            <div className="overflow-hidden rounded-xl">
              <img src={img.imageUrl} alt={img.imageAlt} className="block w-full" loading="lazy" />
            </div>
            {img.caption ? <figcaption className="mt-1 text-xs text-muted-foreground">{img.caption}</figcaption> : null}
          </figure>
        ))}
      </div>
    </section>
  );
}
