import { UtensilsCrossed, Home, ListChecks } from "lucide-react";

import type { Trip } from "@/types/trip";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { SectionHeading } from "@/components/primitives/section-heading";
import { Tag } from "@/components/primitives/tag";
import { TripImage } from "@/components/trip/trip-image";
import { themeRegistry } from "@/data/themes";

export interface TripItineraryProps {
  trip: Trip;
}

const mealLabel: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

/**
 * TripItinerary — Architecture §2/§5: "renders `itinerary[]` — day accordion
 * / swipe-through on mobile ... same data, one component." Ships as an
 * accordion here (works identically on mobile and desktop, keyboard- and
 * screen-reader-navigable per Architecture §10); a mobile-specific
 * swipe-through presentation can be layered on later without touching the
 * `DayPlan[]` data contract.
 */
export function TripItinerary({ trip }: TripItineraryProps) {
  if (trip.itinerary.length === 0) return null;
  const theme = themeRegistry[trip.themeKey];

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <SectionHeading
        eyebrow={`${trip.itinerary.length}-day itinerary`}
        title="Day by day"
        className="mb-5"
      />

      <Accordion type="single" collapsible defaultValue="day-1" className="rounded-lg border border-border bg-card px-5">
        {trip.itinerary.map((day) => (
          <AccordionItem key={day.day} value={`day-${day.day}`}>
            <AccordionTrigger>
              <span className="flex flex-col gap-0.5 text-left">
                <span className="text-xs font-medium uppercase tracking-wide text-ub-brass-600">
                  Day {day.day}
                </span>
                <span className="font-display text-base font-medium text-foreground">{day.title}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-3">
                <p>{day.description}</p>

                {day.activities.length > 0 && (
                  <div className="flex items-start gap-2">
                    <ListChecks className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>{day.activities.join(" · ")}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  {day.meals.length > 0 && (
                    <span className="flex items-center gap-1.5 text-xs">
                      <UtensilsCrossed className="size-3.5" aria-hidden="true" />
                      {day.meals.map((m) => mealLabel[m]).join(", ")}
                    </span>
                  )}
                  {day.stay && (
                    <span className="flex items-center gap-1.5 text-xs">
                      <Home className="size-3.5" aria-hidden="true" />
                      {day.stay}
                    </span>
                  )}
                  {day.meals.length === 0 && !day.stay && <Tag>On the move</Tag>}
                </div>

                {day.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {day.images.map((asset, i) => (
                      <TripImage key={i} asset={asset} theme={theme} variant="thumbnail" containerClassName="rounded-md" />
                    ))}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
