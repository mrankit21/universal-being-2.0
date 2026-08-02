"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarCheck, ChevronLeft, ChevronRight } from "lucide-react";

import { ParallaxImageLayer } from "@/components/animation/parallax-image-layer";
import { cn } from "@/lib/utils";

export interface TripHeroImageV2 {
  imageUrl: string;
  imageAlt: string;
}

export interface TripHeroV2Props {
  bookHref: string;
  imageUrl: string;
  imageAlt: string;
  /** Extra photos beyond the primary `imageUrl`/`imageAlt`. When non-empty,
   * the hero becomes a swipeable gallery — primary image first, then these,
   * in order — with dot indicators and left/right arrows. Omit/leave empty
   * for the original single-photo hero. */
  images?: TripHeroImageV2[];
}

/**
 * Trip 2.0 UI — hero section. Same scroll-linked parallax technique as
 * `components/home/v2/hero-parallax.tsx` (see `ParallaxImageLayer`'s doc
 * comment for why it's a Framer Motion transform instead of `bg-fixed`).
 *
 * Simplified per serial-order revision (2026-07): image only, no title/
 * description overlay — that content now lives in its own block
 * (`TripTitleV2`) directly below, so it never gets swallowed by the hero
 * gradient on smaller screens. Keeps the floating "Book Now" pill from
 * the reference screenshot.
 *
 * Revision (2026-08): dropped the search+menu pill from the floating
 * control row — those actions already live in the site header, so the
 * hero now surfaces only the "Book Now" pill. Also swapped `bg-fixed` for
 * `ParallaxImageLayer`, matching the visitabudhabi.ae-style "almost
 * fixed, slight drift" background used on Homepage 2.0's hero.
 *
 * Revision (2026-08, multi-image): hero now optionally cycles through
 * several photos (`images`) instead of always showing one still. Each
 * photo still renders through `ParallaxImageLayer` (so the sticky+fade
 * scroll behaviour is identical for every slide) — only the *active*
 * image mounts, swapped on tap/swipe/arrow click, so there's no layout
 * cost for a single-image hero (`images` empty ⇒ renders exactly as
 * before, no dots/arrows).
 */
export function TripHeroV2({ bookHref, imageUrl, imageAlt, images }: TripHeroV2Props) {
  const sectionRef = React.useRef<HTMLElement | null>(null);
  const allImages = React.useMemo<TripHeroImageV2[]>(
    () => [{ imageUrl, imageAlt }, ...(images ?? [])],
    [imageUrl, imageAlt, images]
  );
  const [active, setActive] = React.useState(0);
  const touchStartX = React.useRef<number | null>(null);
  const hasGallery = allImages.length > 1;

  function go(delta: number) {
    setActive((prev) => (prev + delta + allImages.length) % allImages.length);
  }

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex h-[70svh] min-h-[420px] w-full flex-col justify-end overflow-hidden sm:h-[80svh]"
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
        touchStartX.current = null;
        if (!hasGallery || Math.abs(dx) < 40) return;
        go(dx < 0 ? 1 : -1);
      }}
    >
      <ParallaxImageLayer
        containerRef={sectionRef}
        imageUrl={allImages[active].imageUrl}
        imageAlt={allImages[active].imageAlt}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" aria-hidden="true" />

      {hasGallery ? (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
          <div className="absolute inset-x-0 bottom-24 z-20 flex items-center justify-center gap-1.5 sm:bottom-28">
            {allImages.map((img, i) => (
              <button
                key={img.imageUrl + i}
                type="button"
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === active}
                onClick={() => setActive(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === active ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/70"
                )}
              />
            ))}
          </div>
        </>
      ) : null}

      {/* Floating control row: just the Book Now pill (search+menu pill removed per revision) */}
      <div className="absolute inset-x-0 bottom-6 z-20 flex items-center justify-center px-4 sm:bottom-8">
        <Link
          href={bookHref}
          className={cn(
            "flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-ub-xl",
            "transition-colors hover:bg-primary/90 sm:px-6"
          )}
        >
          <CalendarCheck className="size-4" aria-hidden="true" />
          Book Now
        </Link>
      </div>
    </section>
  );
}
