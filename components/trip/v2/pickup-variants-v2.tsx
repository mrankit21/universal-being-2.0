"use client";

import * as React from "react";
import { MapPin, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { ItineraryTimelineV2, type ItineraryDayV2 } from "@/components/trip/v2/itinerary-timeline-v2";
import { SectionBackdropV2 } from "@/components/trip/v2/section-backdrop-v2";

export interface PickupVariantV2 {
  id: string;
  city: string;
  note?: string;
  /** This variant's own route, e.g. ["Delhi", "Udaipur", "Jaipur"]. */
  route?: string[];
  /** This variant's own itinerary. Empty/omitted ⇒ falls back to
   * `defaultItinerary` (the Trip's top-level itinerary) when selected. */
  itinerary?: ItineraryDayV2[];
}

const DEFAULT_VARIANTS: PickupVariantV2[] = [
  {
    id: "delhi-udaipur-delhi",
    city: "Delhi",
    note: "Round trip",
    route: ["Delhi", "Udaipur", "Delhi"],
  },
  {
    id: "delhi-udaipur-jaipur",
    city: "Delhi",
    note: "Onward to Jaipur",
    route: ["Delhi", "Udaipur", "Jaipur"],
  },
];

/**
 * Trip 2.0 UI — "Choose your pickup city" selector, item #7 in the serial
 * order. Same idea as the existing `TripPickupVariants` (reads
 * `Trip.pickupVariants`, swaps route/itinerary per selection) restyled to
 * Trip 2.0's card language.
 *
 * Revision (2026-08): this used to only display each variant's city name
 * with no other effect. It now actually drives the page — each variant
 * can carry its own route (e.g. Delhi→Udaipur→Delhi vs Delhi→Udaipur→
 * Jaipur) and its own day-by-day itinerary, both swapped in the moment a
 * visitor picks a different chip. This is also now the single place that
 * renders `ItineraryTimelineV2`: the Trip's top-level itinerary
 * (`defaultItinerary`) is used whenever there are no variants, or the
 * selected variant hasn't defined its own — so removing this component's
 * old page-level neighbour never leaves the page without an itinerary.
 *
 * Revision (2026-08): optional `backdrop` wraps just the
 * `ItineraryTimelineV2` (both render paths below) in `SectionBackdropV2`
 * — the site-wide "Day by Day Itinerary" backdrop from
 * `SiteSettings.trip2SectionBackdrops.itinerary`, same photo/opacity on
 * every trip. Omitted when the admin hasn't set that global photo yet,
 * so the section renders exactly as before.
 */
export function PickupVariantsV2({
  variants = DEFAULT_VARIANTS,
  defaultItinerary,
  backdrop,
}: {
  variants?: PickupVariantV2[];
  defaultItinerary?: ItineraryDayV2[];
  backdrop?: { imageUrl: string; imageAlt: string; opacity: number };
}) {
  const [selectedId, setSelectedId] = React.useState(variants[0]?.id ?? "");
  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];
  const effectiveItinerary = selected?.itinerary?.length ? selected.itinerary : defaultItinerary;

  const itineraryTimeline = <ItineraryTimelineV2 key={selected?.id} days={effectiveItinerary} />;
  const wrappedItinerary = backdrop ? (
    <SectionBackdropV2 imageUrl={backdrop.imageUrl} imageAlt={backdrop.imageAlt} opacity={backdrop.opacity}>
      {itineraryTimeline}
    </SectionBackdropV2>
  ) : (
    itineraryTimeline
  );

  if (variants.length === 0) {
    return wrappedItinerary;
  }

  return (
    <>
      <section id="pickup-variants" className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <h2 className="mb-5 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Choose Your Pickup City
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {variants.map((variant) => {
            const active = variant.id === selected.id;
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedId(variant.id)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                )}
              >
                <MapPin className="size-4" aria-hidden="true" />
                {variant.city}
                {variant.note ? <span className="text-xs text-muted-foreground">({variant.note})</span> : null}
              </button>
            );
          })}
        </div>

        {selected?.route && selected.route.length > 0 ? (
          <p className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm font-medium text-foreground">
            {selected.route.map((stop, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden="true" />}
                {stop}
              </span>
            ))}
          </p>
        ) : null}
      </section>

      {wrappedItinerary}
    </>
  );
}
