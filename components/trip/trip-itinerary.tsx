"use client";

import { useState } from "react";
import { UtensilsCrossed, Home, ListChecks, ChevronLeft, ChevronRight } from "lucide-react";

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

interface LocationGroup {
  location: string;
  days: DayPlan[];
}

/** Groups consecutive days that share the same `location` into one banner
 * block. Days with no `location` (pure transit days) are never grouped —
 * each renders as its own single-day entry so the banner only appears where
 * an admin has actually set a destination. */
function groupByLocation(itinerary: DayPlan[]): LocationGroup[] {
  const groups: LocationGroup[] = [];
  for (const day of itinerary) {
    const last = groups[groups.length - 1];
    if (day.location && last?.location === day.location) {
      last.days.push(day);
    } else {
      groups.push({ location: day.location ?? "", days: [day] });
    }
  }
  return groups;
}

function DestinationBanner({ group, theme }: { group: LocationGroup; theme: ThemeConfig }) {
  const images = group.days.flatMap((d) => d.images);
  const [index, setIndex] = useState(0);
  if (images.length === 0) return null;
  const active = images[Math.min(index, images.length - 1)];
  const thumbs = images.slice(1, 4);
  const extra = images.length - 1 - thumbs.length;

  return (
    <div className="relative overflow-hidden rounded-xl">
      <TripImage asset={active} theme={theme} variant="hero" containerClassName="aspect-[16/10] sm:aspect-[21/9]">
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      </TripImage>

      <div className="absolute left-4 bottom-4 flex items-baseline gap-2 text-white sm:left-6 sm:bottom-6">
        <span className="font-display text-4xl font-semibold leading-none sm:text-5xl">{group.days.length}</span>
        <span className="flex flex-col text-sm leading-tight">
          <span>{group.days.length === 1 ? "Day in" : "Days in"}</span>
          <span className="font-display text-lg font-medium sm:text-xl">{group.location}</span>
        </span>
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60 sm:flex"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => setIndex((i) => (i + 1) % images.length)}
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60 sm:flex"
          >
            <ChevronRight className="size-4" />
          </button>
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white sm:bottom-6">
            {index + 1}/{images.length}
          </span>
        </>
      )}

      {thumbs.length > 0 && (
        <div className="absolute bottom-3 right-3 flex items-center sm:bottom-5 sm:right-5">
          {thumbs.map((asset, i) => (
            <div
              key={i}
              className="-ml-2 size-9 overflow-hidden rounded-full border-2 border-white first:ml-0 sm:size-10"
              style={{ zIndex: thumbs.length - i }}
            >
              <TripImage asset={asset} theme={theme} variant="thumbnail" containerClassName="size-full" />
            </div>
          ))}
          {extra > 0 && (
            <div className="-ml-2 flex size-9 items-center justify-center rounded-full border-2 border-white bg-ub-brass-500 text-xs font-semibold text-white sm:size-10">
              +{extra}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DayCard({ day, theme }: { day: DayPlan; theme: ThemeConfig }) {
  return (
    <AccordionItem value={`day-${day.day}`} className="rounded-lg border border-border bg-card px-5">
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
  );
}

/**
 * TripItinerary — Architecture §2/§5: "renders `itinerary[]` — day accordion
 * / swipe-through on mobile ... same data, one component." Days that share
 * a `location` (consecutive) are grouped under a destination photo banner
 * (dots/counter, avatar-stack thumbnails) above their accordion cards —
 * days without a `location` (pure transit days) render as plain cards with
 * no banner, same as before.
 */
export function TripItinerary({ trip }: TripItineraryProps) {
  if (trip.itinerary.length === 0) return null;
  const theme = themeRegistry[trip.themeKey];
  const groups = groupByLocation(trip.itinerary);

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <SectionHeading
        eyebrow={`${trip.itinerary.length}-day itinerary`}
        title="Day by day"
        className="mb-5"
      />

      <div className="flex flex-col gap-4">
        {groups.map((group, gi) => (
          <div key={gi} className="flex flex-col gap-4">
            {group.location && <DestinationBanner group={group} theme={theme} />}
            <Accordion
              type="single"
              collapsible
              defaultValue={gi === 0 ? `day-${group.days[0].day}` : undefined}
              className="flex flex-col gap-3"
            >
              {group.days.map((day) => (
                <DayCard key={day.day} day={day} theme={theme} />
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </section>
  );
}
