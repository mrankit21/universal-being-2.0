"use client";

import * as React from "react";
import { Utensils, Bus, Building2, type LucideIcon } from "lucide-react";

export interface IncludedItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const DEFAULT_ITEMS: IncludedItem[] = [
  { icon: Utensils, title: "Meals", description: "Breakfast & dinner daily" },
  { icon: Bus, title: "Transport", description: "AC coach, all transfers" },
  { icon: Building2, title: "Hotels", description: "Handpicked stays each night" },
];

/**
 * Trip 2.0 UI — "What's Included" strip: horizontally-scrollable icon
 * cards, matching the reference screenshot. Static content only for now;
 * once approved this maps from `Trip.inclusions`/`Trip.mealPlan`/
 * `Trip.vehicle` the same way the rest of Trip 2.0 will be wired to real
 * Trip data after backend connection.
 */
export function WhatsIncludedV2({ items = DEFAULT_ITEMS }: { items?: IncludedItem[] }) {
  return (
    <section className="w-full px-4 py-8 sm:px-6 sm:py-12">
      <h2 className="mb-6 font-display text-2xl font-medium text-foreground sm:text-3xl">
        What&apos;s Included
      </h2>
      <div className="mx-auto flex max-w-3xl snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex w-40 shrink-0 snap-start flex-col items-center gap-3 rounded-xl border border-border bg-card p-5 text-center sm:w-48"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
              <item.icon className="size-6" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="font-semibold text-foreground">{item.title}</span>
            <span className="text-xs text-muted-foreground sm:text-sm">{item.description}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
