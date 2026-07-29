"use client";

/**
 * TripPickupVariants — Pickup Variant Architecture (2026-07).
 *
 * Renders the "Choose your pickup city" selector and everything on the Trip
 * page whose content is meant to differ per pickup variant (booking card,
 * pricing/batches, itinerary, transportation, this variant's own Route).
 * Fully CMS-driven: reads `Trip.pickupVariants` — reorder/add/remove a
 * variant in Admin and it appears here with no code change.
 *
 * Self-hides (renders nothing of its own, `Fallback` takes over) when the
 * Trip has no published pickup variants, so a Trip with none behaves
 * exactly as it did before this component existed.
 *
 * Deliberately client-side: the selected variant only changes what's
 * *displayed*. Every child here (`TripBookingCard`, `TripPricingTable`,
 * `TripItinerary`, `TripTransportation`, `TripDestinationRoutes`) still
 * receives a plain `Trip` object — built by `withPickupVariant` — with zero
 * changes to those components themselves, and "Book Now" still links to
 * `/trips/[slug]/book?departure=<id>&pickup=<variantId>` exactly as before,
 * so the booking flow, payment, and admin auth are all untouched.
 */
import { useState } from "react";
import { MapPin, ChevronRight } from "lucide-react";

import type { Trip } from "@/types/trip";
import { getPublishedPickupVariants, getDefaultPickupVariant, withPickupVariant } from "@/lib/trip/pickup-variants";
import { SectionHeading } from "@/components/primitives/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { TripBookingCard } from "@/components/trip/trip-booking-card";
import { TripPricingTable } from "@/components/trip/trip-pricing";
import { TripItinerary } from "@/components/trip/trip-itinerary";
import { TripTransportation } from "@/components/trip/trip-transportation";
import { TripDestinationRoutes } from "@/components/trip/trip-destination-routes";

export function TripPickupVariants({ trip }: { trip: Trip }) {
  const variants = getPublishedPickupVariants(trip);
  const [selectedId, setSelectedId] = useState(getDefaultPickupVariant(trip)?.id ?? "");

  if (variants.length === 0) return null;

  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];
  const effectiveTrip = withPickupVariant(trip, selected);

  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 py-8">
        <SectionHeading eyebrow="Pickup variants" title="Choose your pickup city" className="mb-5" />
        <div className="flex flex-wrap gap-3">
          {variants.map((variant) => {
            const active = variant.id === selected.id;
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedId(variant.id)}
                aria-pressed={active}
                className={`rounded-ub-lg border px-4 py-3 text-left transition-colors duration-ub-fast ${
                  active
                    ? "border-ub-brass-600 bg-ub-brass-600/10"
                    : "border-border bg-card hover:border-ub-brass-600/50"
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <MapPin className="size-4 text-ub-brass-600" aria-hidden="true" />
                  {variant.name}
                </span>
                {variant.startingPrice ? (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Starting ₹{variant.startingPrice.toLocaleString("en-IN")}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {(selected.gstNote || selected.paymentNote) && (
          <Card className="mt-4">
            <CardContent className="flex flex-col gap-1.5 p-4 text-sm text-muted-foreground">
              {selected.gstNote ? <p>{selected.gstNote}</p> : null}
              {selected.paymentNote ? <p>{selected.paymentNote}</p> : null}
            </CardContent>
          </Card>
        )}

        {selected.route.length > 0 && (
          <div className="mt-4">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Route</p>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-foreground">
              {selected.route.map((stop, i) => (
                <span key={i} className="flex items-center gap-2">
                  {i > 0 && <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden="true" />}
                  {stop}
                </span>
              ))}
            </p>
          </div>
        )}
      </section>

      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-xs sm:max-w-[280px]">
          <TripBookingCard trip={effectiveTrip} pickupVariantId={selected.id} />
        </div>
      </div>
      <TripPricingTable trip={effectiveTrip} pickupVariantId={selected.id} />
      <TripItinerary trip={effectiveTrip} />
      <TripTransportation trip={effectiveTrip} />
      <TripDestinationRoutes trip={effectiveTrip} />
    </div>
  );
}
