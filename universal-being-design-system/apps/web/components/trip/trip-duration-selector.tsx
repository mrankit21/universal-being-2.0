import Link from "next/link";
import { Clock } from "lucide-react";

import type { Trip } from "@/types/trip";
import { themeRegistry } from "@/data/themes";
import { TripImage } from "@/components/trip/trip-image";
import { Price } from "@/components/primitives/price";
import { SectionHeading } from "@/components/primitives/section-heading";
import { cn } from "@/lib/utils";

export interface TripDurationSelectorProps {
  trip: Trip;
  /** Every published Trip sharing `trip.circuitGroup` (this Trip included),
   * from `getCircuitSiblings()` in `lib/api/trips.ts`. Passed in by the page
   * rather than fetched here, same server-fetch-then-pass-down pattern as
   * `relatedTrips`/`assignedReviews` on `app/trips/[slug]/page.tsx`. */
  siblings: Trip[];
}

/**
 * TripDurationSelector — the "Choose Trip Duration" card row. Renders one
 * card per real sibling Trip that shares this Trip's `circuitGroup` (a 4D
 * Quick Loop, 6D, 9D Extended Explorer, etc. of the same circuit) — each
 * card is its own independent Trip document with its own itinerary,
 * pricing, and batch dates, not a decorative price label. Self-hides
 * whenever there are fewer than two siblings, so a Trip with no duration
 * variants yet (or `circuitGroup` unset) renders exactly as it did before
 * this feature existed.
 *
 * Clicking a card that isn't the current Trip navigates straight to that
 * sibling's own Trip page — nothing on this page swaps in place, because
 * there's nothing shared left to swap; every variant is a real page.
 */
export function TripDurationSelector({ trip, siblings }: TripDurationSelectorProps) {
  if (siblings.length < 2) return null;

  const theme = themeRegistry[trip.themeKey];

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <SectionHeading
        eyebrow="Choose duration"
        title="Pick your circuit length"
        description="Every duration below is its own trip with its own itinerary, pricing, and batch dates."
        className="mb-5"
      />

      <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
        {siblings.map((sibling) => {
          const isActive = sibling.slug === trip.slug;
          const price = sibling.price.discounted ?? sibling.price.base;
          return (
            <Link
              key={sibling.slug}
              href={`/trips/${sibling.slug}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex w-32 shrink-0 flex-col overflow-hidden rounded-ub-lg border bg-card text-left transition-shadow duration-ub-base sm:w-36",
                isActive ? "border-ub-brass-400 shadow-ub-md ring-2 ring-ub-brass-400/25" : "border-border hover:shadow-ub-sm"
              )}
            >
              <TripImage
                asset={sibling.thumbnail}
                theme={theme}
                variant="thumbnail"
                containerClassName="aspect-[4/3]"
              >
                <span className="absolute bottom-2 left-2 font-display text-lg font-semibold text-white drop-shadow-sm">
                  {sibling.duration.days}d
                </span>
              </TripImage>
              <div className="flex flex-col gap-0.5 px-3 py-2.5">
                <span className="text-xs text-muted-foreground">Starting from</span>
                <span className={cn("text-sm font-semibold", isActive ? "text-ub-brass-600" : "text-foreground")}>
                  ₹{price.toLocaleString("en-IN")}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-ub-lg border border-border bg-card px-5 py-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {trip.duration.days} days, {trip.duration.nights} nights · {trip.title}
          </p>
          <Price amount={trip.price.discounted ?? trip.price.base} suffix="/ person" size="md" />
        </div>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="size-4" aria-hidden="true" />
          {trip.duration.days}D/{trip.duration.nights}N
        </span>
      </div>
    </section>
  );
}
