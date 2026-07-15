"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { HomeTripSummary } from "@/data/home/featured-trips";
import { SectionHeading } from "@/components/primitives/section-heading";
import { CarouselBase } from "@/components/animation/carousel-base";
import { HomeTripCard } from "@/components/home/home-trip-card";
import { Reveal } from "@/components/animation/reveal";
import { MotionCta } from "@/components/animation/motion-cta";
import { Button } from "@/components/ui/button";

const cardVariants = ["up", "scale", "up"] as const;

/**
 * FeaturedTripsSection — wraps `HomeTripCard`s in the same `CarouselBase`
 * engine DESIGN_SYSTEM.md earmarked for TripGallery/testimonials, rather
 * than hand-rolling a new scroller. Each slide is sized to show ~1.1 cards
 * on mobile and settle into a comfortable card width on desktop.
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

      <CarouselBase label="Featured trips" showDots={false} className="sm:hidden">
        {featuredTrips.map((trip) => (
          <div key={trip.slug} className="pr-4">
            <HomeTripCard trip={trip} />
          </div>
        ))}
      </CarouselBase>

      <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {featuredTrips.map((trip, i) => (
          <Reveal key={trip.slug} variant={cardVariants[i % cardVariants.length]} delay={(i % 3) * 0.06}>
            <HomeTripCard trip={trip} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
