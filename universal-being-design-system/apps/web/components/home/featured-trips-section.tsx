"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { HomeTripSummary } from "@/data/home/featured-trips";
import { SectionHeading } from "@/components/primitives/section-heading";
import { MarqueeCarousel } from "@/components/animation/marquee-carousel";
import { HomeTripCard } from "@/components/home/home-trip-card";
import { MotionCta } from "@/components/animation/motion-cta";
import { Button } from "@/components/ui/button";

/**
 * FeaturedTripsSection — wraps `HomeTripCard`s in `MarqueeCarousel`, the
 * continuously-scrolling strip engine (not a step-and-pause slider): cards
 * drift left in one unbroken, looping motion and pause on hover/touch.
 * Every card gets a fixed footprint width so it lines up with
 * `ThemeExplorerSection`'s destination cards below it on the page — same
 * box size, deliberately different content/look.
 *
 * Step 7.6C-B Part 1: `trips` is now resolved server-side by
 * `getResolvedHomepage()` (real Trip documents the admin chose in Homepage
 * → Featured Trips, database-first with a static fallback) rather than
 * imported directly from `data/home/featured-trips.ts` — this component no
 * longer knows or cares where the data came from.
 */
export function FeaturedTripsSection({ trips: featuredTrips }: { trips: HomeTripSummary[] }) {
  if (featuredTrips.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-section-sm sm:py-section-md">
      <SectionHeading
        eyebrow="Featured"
        title="Trips people keep talking about"
        description="A handful of our most-loved group trips — new departures added every month."
        action={
          <MotionCta>
            <Button asChild variant="outline">
              <Link href="/trips">
                View all trips
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </MotionCta>
        }
        className="mb-8"
      />

      <MarqueeCarousel label="Featured trips" durationSeconds={Math.max(12, featuredTrips.length * 4.7)}>
        {featuredTrips.map((trip) => (
          <div key={trip.slug} className="w-64 shrink-0 sm:w-72">
            <HomeTripCard trip={trip} />
          </div>
        ))}
      </MarqueeCarousel>
    </section>
  );
}
