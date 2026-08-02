"use client";

import * as React from "react";
import { Check, X } from "lucide-react";

export interface InclusionsExclusionsV2Props {
  inclusions?: string[];
  exclusions?: string[];
}

const DEFAULT_INCLUSIONS = [
  "AC transport in a private vehicle for the entire trip",
  "6 nights' accommodation on double/triple sharing",
  "Breakfast & dinner daily",
  "All permits, entry fees & camera charges",
  "An experienced trip lead & local support crew",
];

const DEFAULT_EXCLUSIONS = [
  "Flights/train to and from the starting point",
  "Lunch and any meals not mentioned above",
  "Personal expenses, tips & shopping",
  "Travel insurance",
  "Anything not mentioned in \"Inclusions\"",
];

/**
 * Trip 2.0 UI — Inclusions/Exclusions, paired directly with the Itinerary
 * section per serial-order revision (2026-07). Two-column check/cross
 * lists inside a single rounded card, matching the rest of Trip 2.0's
 * card language. Static content only for now; once approved this maps
 * from `Trip.inclusions[]` / `Trip.exclusions[]` (same fields the old
 * `TripInclusions` component already reads).
 */
export function InclusionsExclusionsV2({
  inclusions = DEFAULT_INCLUSIONS,
  exclusions = DEFAULT_EXCLUSIONS,
}: InclusionsExclusionsV2Props) {
  if (inclusions.length === 0 && exclusions.length === 0) return null;

  return (
    <section id="inclusions-exclusions" className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Inclusions &amp; Exclusions
      </h2>
      <div className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2 sm:p-6">
        {inclusions.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {inclusions.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                  <Check className="size-3" strokeWidth={2.5} aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        ) : null}
        {exclusions.length > 0 ? (
          <ul className="flex flex-col gap-3 border-t border-border pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            {exclusions.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <X className="size-3" strokeWidth={2.5} aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
