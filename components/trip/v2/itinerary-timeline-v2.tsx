"use client";

import * as React from "react";
import { MapPin } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface ItineraryDayV2 {
  day: number;
  title: string;
  location: string;
  imageUrl: string;
  imageAlt: string;
  description: string;
}

const DEFAULT_DAYS: ItineraryDayV2[] = [
  {
    day: 1,
    title: "Arrival in Shimla, drive to Kalpa",
    location: "Kalpa",
    imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=400&auto=format&fit=crop",
    imageAlt: "Snow-capped mountains at sunrise",
    description: "Land in Shimla and begin the long, scenic drive into the Kinnaur valley, arriving in Kalpa by evening.",
  },
  {
    day: 2,
    title: "Kalpa to Kaza via Nako Lake",
    location: "Kaza",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=400&auto=format&fit=crop",
    imageAlt: "Nako Lake surrounded by mountains",
    description: "Cross into the cold desert of Spiti, stopping at Nako Lake before reaching Kaza, the region's headquarters.",
  },
  {
    day: 3,
    title: "Key Monastery & Kibber Village",
    location: "Kibber",
    imageUrl: "https://images.unsplash.com/photo-1520769669658-f07657f5a307?q=80&w=400&auto=format&fit=crop",
    imageAlt: "Key Monastery perched on a hillside",
    description: "Visit the centuries-old Key Monastery, then continue to Kibber — one of the world's highest motorable villages.",
  },
];

/**
 * Trip 2.0 UI — day-by-day itinerary timeline, matching the reference
 * screenshot's numbered-circle + expandable-card layout. Reworked
 * (2026-07) to actually stand out on the page — bigger accented day
 * badges with a soft glow ring, larger thumbnails, shadowed cards, and a
 * gold connecting line instead of a flat grey one. Static content only
 * for now; once approved this maps from `Trip.itinerary` (`DayPlan[]`).
 */
export function ItineraryTimelineV2({ days = DEFAULT_DAYS }: { days?: ItineraryDayV2[] }) {
  return (
    <section id="itinerary" className="w-full bg-secondary/40 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Day by day</span>
        <h2 className="mb-8 mt-1 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Itinerary</h2>
      </div>
      <Accordion type="single" collapsible className="mx-auto flex max-w-2xl flex-col gap-6">
        {days.map((d) => (
          <div key={d.day} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg font-semibold text-primary-foreground shadow-md shadow-primary/30 ring-4 ring-primary/15">
                {d.day}
              </span>
              {d.day !== days[days.length - 1].day ? (
                <span className="mt-1 w-0.5 flex-1 bg-gradient-to-b from-primary/60 to-primary/10" aria-hidden="true" />
              ) : null}
            </div>
            <AccordionItem
              value={`day-${d.day}`}
              className="w-full rounded-xl border border-border bg-card px-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <AccordionTrigger className="py-4">
                <div className="flex items-center gap-3 text-left">
                  <img src={d.imageUrl} alt={d.imageAlt} className="size-16 shrink-0 rounded-lg object-cover sm:size-20" />
                  <div>
                    <p className="font-medium text-foreground">{d.title}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" aria-hidden="true" />
                      {d.location}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{d.description}</AccordionContent>
            </AccordionItem>
          </div>
        ))}
      </Accordion>
    </section>
  );
}
