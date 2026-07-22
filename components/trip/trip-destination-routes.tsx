import Link from "next/link";
import { ChevronRight } from "lucide-react";

import type { Trip } from "@/types/trip";
import { SectionHeading } from "@/components/primitives/section-heading";

export interface TripDestinationRoutesProps {
  trip: Trip;
}

/**
 * TripDestinationRoutes — the "Destination Routes" list: other multi-stop
 * route combinations built from the same destination (e.g. alternate Ladakh
 * loops). Self-hides when `Trip.destinationRoutes` is unset or empty, same
 * backward-compatible pattern as `TripDurationSelector`. Rows without an
 * `href` render as static (not yet linked to a real Trip document) rather
 * than a dead link.
 */
export function TripDestinationRoutes({ trip }: TripDestinationRoutesProps) {
  const routes = trip.destinationRoutes ?? [];
  if (routes.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <SectionHeading eyebrow="Multi-leg options" title="Destination routes" className="mb-5" />

      <div className="flex flex-col gap-3">
        {routes.map((route) => {
          const routeLabel = route.stops.join(" → ");
          const content = (
            <>
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-foreground">
                {route.stops.map((stop, i) => (
                  <span key={i} className="flex items-center gap-2">
                    {i > 0 && <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden="true" />}
                    {stop}
                  </span>
                ))}
              </span>
              {route.href && (
                <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-ub-brass-600">
                  View Details
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                </span>
              )}
            </>
          );

          const rowClassName =
            "flex flex-wrap items-center justify-between gap-3 rounded-ub-lg border border-border bg-card px-4 py-3.5 transition-shadow duration-ub-base hover:shadow-ub-sm";

          return route.href ? (
            <Link key={route.id} href={route.href} aria-label={routeLabel} className={rowClassName}>
              {content}
            </Link>
          ) : (
            <div key={route.id} className={rowClassName}>
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
