import { Coffee, Sandwich, UtensilsCrossed, Cookie } from "lucide-react";

import type { Trip } from "@/types/trip";
import { SectionHeading } from "@/components/primitives/section-heading";
import { cn } from "@/lib/utils";

export interface TripMealsProps {
  trip: Trip;
}

/** TripMeals — Step 7.6C-A §7. Renders the trip-wide meal plan (breakfast /
 * lunch / dinner / snacks + admin notes). Self-hides when no meal is
 * included and no description was provided, so a partially-filled entry
 * doesn't render an empty shell. */
export function TripMeals({ trip }: TripMealsProps) {
  const { breakfast, lunch, dinner, snacks, description } = trip.mealPlan;
  if (!breakfast && !lunch && !dinner && !snacks && !description) return null;

  const meals = [
    { key: "breakfast", label: "Breakfast", included: breakfast, icon: Coffee },
    { key: "lunch", label: "Lunch", included: lunch, icon: Sandwich },
    { key: "dinner", label: "Dinner", included: dinner, icon: UtensilsCrossed },
    { key: "snacks", label: "Snacks", included: snacks, icon: Cookie },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <SectionHeading title="Meals" className="mb-5" />
      <div className="flex flex-wrap gap-3">
        {meals.map(({ key, label, included, icon: Icon }) => (
          <div
            key={key}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium",
              included
                ? "border-success/30 bg-success/10 text-success"
                : "border-border text-muted-foreground"
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
            <span className="text-xs font-normal">{included ? "Included" : "Not included"}</span>
          </div>
        ))}
      </div>
      {description ? <p className="mt-4 text-sm text-muted-foreground">{description}</p> : null}
    </section>
  );
}
