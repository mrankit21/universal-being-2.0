"use client";

import * as React from "react";
import { MapPin } from "lucide-react";

import { cn } from "@/lib/utils";

export interface PickupVariantV2 {
  id: string;
  city: string;
  note?: string;
}

const DEFAULT_VARIANTS: PickupVariantV2[] = [
  { id: "delhi", city: "Delhi", note: "Default" },
  { id: "chandigarh", city: "Chandigarh" },
  { id: "manali", city: "Manali", note: "Self-arrival" },
];

/**
 * Trip 2.0 UI — "Choose your pickup city" chip selector, item #7 in the
 * serial order. Same idea as the existing `TripPickupVariants` (reads
 * `Trip.pickupVariants`, swaps booking/pricing/itinerary per selection)
 * but restyled to Trip 2.0's card language. Static content only for now
 * — selecting a chip here doesn't yet change any other section; once
 * approved the selected id will drive `PriceV2`/`BatchDatesV2` the same
 * way `withPickupVariant` does today.
 */
export function PickupVariantsV2({ variants = DEFAULT_VARIANTS }: { variants?: PickupVariantV2[] }) {
  const [selectedId, setSelectedId] = React.useState(variants[0]?.id ?? "");
  if (variants.length === 0) return null;

  return (
    <section id="pickup-variants" className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <h2 className="mb-5 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Choose Your Pickup City
      </h2>
      <div className="flex flex-wrap justify-center gap-3">
        {variants.map((variant) => {
          const active = variant.id === selectedId;
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
    </section>
  );
}
