"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";

import { ParallaxImageLayer } from "@/components/animation/parallax-image-layer";
import { cn } from "@/lib/utils";

export interface TripHeroV2Props {
  bookHref: string;
  imageUrl: string;
  imageAlt: string;
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
 * Static content only for now — no data-fetching. Once approved, this
 * accepts real `Trip` fields (`heroImage`, a generated `/trips/[slug]/book`
 * href) the same way Homepage 2.0's components were wired up after their
 * UI was approved.
 *
 * Revision (2026-08): dropped the search+menu pill from the floating
 * control row — those actions already live in the site header, so the
 * hero now surfaces only the "Book Now" pill. Also swapped `bg-fixed` for
 * `ParallaxImageLayer`, matching the visitabudhabi.ae-style "almost
 * fixed, slight drift" background used on Homepage 2.0's hero.
 */
export function TripHeroV2({ bookHref, imageUrl, imageAlt }: TripHeroV2Props) {
  const sectionRef = React.useRef<HTMLElement | null>(null);

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex h-[70svh] min-h-[420px] w-full flex-col justify-end overflow-hidden sm:h-[80svh]"
    >
      <ParallaxImageLayer containerRef={sectionRef} imageUrl={imageUrl} imageAlt={imageAlt} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" aria-hidden="true" />

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
