"use client";

import { UtensilsCrossed, Home, ListChecks } from "lucide-react";

import type { DayPlan, Trip } from "@/types/trip";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { SectionHeading } from "@/components/primitives/section-heading";
import { Tag } from "@/components/primitives/tag";
import { TripImage } from "@/components/trip/trip-image";
import { themeRegistry } from "@/data/themes";
import type { ThemeConfig } from "@/types/theme";

export interface TripItineraryProps {
  trip: Trip;
}

const mealLabel: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

/** Resolves the destination name shown on a day's image overlay. Prefers
 * the admin-set `day.location` (already correct — e.g. "Lachung", "Gangtok",
 * "Udaipur") since a day's title alone can't reliably imply its place (e.g.
 * "Arrival, Lake Pichola" says nothing textually about "Udaipur"). Falls
 * back to the trip's own destination name for the rare day with no
 * `location` set (kept purely as a safety net, never the primary path). */
function getDestinationName(day: DayPlan, trip: Trip): string {
  if (day.location?.trim()) return day.location.trim();
  return trip.destinationName;
}

/** True only for an admin-uploaded image — mirrors `hasRealImage()` in
 * `lib/api/trips.ts`: a day's `images[0]` can be an unset/placeholder asset
 * (`isPlaceholder: true`, empty `url`) when nothing's been uploaded from
 * admin yet, and that's not "a photo" for display purposes. */
function hasRealDayImage(day: DayPlan): boolean {
  const img = day.images[0];
  return !!img && !img.isPlaceholder && !!img.url;
}

/** Part 1 — the destination image card, shown ONLY once a real photo has
 * been uploaded for this day from admin. No placeholder/blank image is
 * ever rendered here — until then, the day just shows the normal accordion
 * header below with no image card at all. Not part of the accordion
 * trigger — only the header row below it toggles the expanded content. */
function DayImageCard({ day, trip, theme }: { day: DayPlan; trip: Trip; theme: ThemeConfig }) {
  const destination = getDestinationName(day, trip);
  // Non-null: caller (`DayCard`) only renders this when `hasRealDayImage(day)` is true.
  const cover = day.images[0]!;

  return (
    <div className="relative overflow-hidden rounded-[20px]">
      <TripImage
        asset={cover}
        theme={theme}
        variant="hero"
        containerClassName="aspect-[4/3] sm:aspect-[16/9] rounded-[20px]"
      >
        <div className="absolute inset-0 rounded-[20px] bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
      </TripImage>

      <div className="absolute inset-x-4 bottom-4 flex items-baseline gap-2 text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.55)] sm:inset-x-6 sm:bottom-6">
        <span className="font-display text-4xl font-semibold leading-none sm:text-5xl">{day.day}</span>
        <span className="flex flex-col text-sm leading-tight">
          <span>Day in</span>
          <span className="font-display text-lg font-medium sm:text-xl">{destination}</span>
        </span>
      </div>
    </div>
  );
}

/** Part 2 — the compact accordion header + expandable detail content. The
 * image card above (when present) stays put; only this part toggles. */
function DayCard({ day, trip, theme }: { day: DayPlan; trip: Trip; theme: ThemeConfig }) {
  return (
    <AccordionItem value={`day-${day.day}`} className="flex flex-col gap-3 rounded-lg border border-border bg-card px-5">
      {hasRealDayImage(day) && <DayImageCard day={day} trip={trip} theme={theme} />}

      <AccordionTrigger>
        <span className="flex items-center gap-3 text-left">
          <span className="shrink-0 rounded-full bg-ub-brass-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ub-brass-600">
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

          {day.images.length > 1 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {day.images.slice(1).map((asset, i) => (
                <TripImage key={i} asset={asset} theme={theme} variant="thumbnail" containerClassName="rounded-md" />
              ))}
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

/**
 * TripItinerary — Architecture §2/§5: "renders `itinerary[]` — day accordion
 * / swipe-through on mobile ... same data, one component."
 *
 * Each day is its own browsable unit: once a real photo is uploaded from
 * admin, a destination image card (day number + "Day in <place>" overlay)
 * appears above it; until then the day shows just the plain accordion
 * header — never a blank/placeholder photo. All days start collapsed — nobody auto-opens
 * — and only one day's detail content can be open at a time
 * (`Accordion type="single" collapsible`, no `defaultValue`).
 */
export function TripItinerary({ trip }: TripItineraryProps) {
  if (trip.itinerary.length === 0) return null;
  const theme = themeRegistry[trip.themeKey];

  return (
    <section id="trip-itinerary" className="mx-auto max-w-6xl px-6 py-8">
      <SectionHeading
        eyebrow={`${trip.itinerary.length}-day itinerary`}
        title="Day by day"
        className="mb-5"
      />

      <Accordion type="single" collapsible className="flex flex-col gap-4">
        {trip.itinerary.map((day) => (
          <DayCard key={day.day} day={day} trip={trip} theme={theme} />
        ))}
      </Accordion>
    </section>
  );
}
