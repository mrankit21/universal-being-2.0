"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Menu, CalendarCheck } from "lucide-react";

import { cn } from "@/lib/utils";

export interface TripHeroV2Props {
  bookHref: string;
  imageUrl: string;
  imageAlt: string;
}

/**
 * Trip 2.0 UI — hero section. Same `bg-fixed` parallax technique as
 * `components/home/v2/hero-parallax.tsx` (see that file's doc comment for
 * the iOS Safari caveat).
 *
 * Simplified per serial-order revision (2026-07): image only, no title/
 * description overlay — that content now lives in its own block
 * (`TripTitleV2`) directly below, so it never gets swallowed by the hero
 * gradient on smaller screens. Keeps the floating control row: a
 * search+menu pill (mirrors `FloatingPillNav`) and a separate gold "Book
 * Now" pill, matching the reference screenshot.
 *
 * Static content only for now — no data-fetching. Once approved, this
 * accepts real `Trip` fields (`heroImage`, a generated `/trips/[slug]/book`
 * href) the same way Homepage 2.0's components were wired up after their
 * UI was approved.
 */
export function TripHeroV2({ bookHref, imageUrl, imageAlt }: TripHeroV2Props) {
  return (
    <section className="relative isolate flex h-[70svh] min-h-[420px] w-full flex-col justify-end overflow-hidden sm:h-[80svh]">
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${imageUrl})` }}
        role="img"
        aria-label={imageAlt}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" aria-hidden="true" />

      {/* Floating control row: search+menu pill, then a separate Book Now pill */}
      <div className="absolute inset-x-0 bottom-6 z-20 flex items-center justify-center gap-3 px-4 sm:bottom-8">
        <div className="flex items-center gap-1 rounded-full bg-ub-ink-900/80 p-1.5 shadow-ub-xl backdrop-blur-md">
          <button type="button" aria-label="Search" className="flex size-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 sm:size-12">
            <Search className="size-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
          <div className="h-6 w-px bg-white/25" aria-hidden="true" />
          <button type="button" aria-label="Menu" className="flex size-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 sm:size-12">
            <Menu className="size-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
        <Link
          href={bookHref}
          className={cn(
            "flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-ub-xl",
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
