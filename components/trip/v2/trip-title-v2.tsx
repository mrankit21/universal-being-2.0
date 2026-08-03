"use client";

import * as React from "react";
import { MapPin, CalendarDays, Users } from "lucide-react";

export interface TripTitleV2Props {
  title: string;
  description: string;
  location?: string;
  duration?: string;
  groupSize?: string;
}

/**
 * Trip 2.0 UI — meta block directly below the hero (location / duration /
 * group size + short description). Originally also carried its own `<h1>`
 * title, added per serial-order revision (2026-07) so the title never got
 * lost inside the hero's gradient overlay on smaller screens.
 *
 * Revision (2026-08): the hero (`TripHeroV2`) now renders its own
 * `heading` text directly over the photo, so the duplicate `<h1>` here was
 * removed — Ankit flagged the same title appearing twice on the page
 * (once on the hero image, once in this block). `title` stays as a prop
 * (kept for the `<Trip2Page>` caller / possible future use, e.g. as the
 * document `<title>`) but is no longer rendered here.
 *
 * Static content only for now; once approved this maps from
 * `Trip.shortDescription`, `Trip.destination`, `Trip.durationDays` and
 * `Trip.groupSize` the same way the rest of Trip 2.0 will be wired to
 * real Trip data after backend connection.
 */
export function TripTitleV2({
  description,
  location = "Himachal Pradesh, India",
  duration = "7 Days / 6 Nights",
  groupSize = "12–16 travellers",
}: TripTitleV2Props) {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-3 pt-6 text-center sm:px-6 sm:pt-8">
      <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">{description}</p>

      <div className="mx-auto mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MapPin className="size-4 text-primary" aria-hidden="true" />
          {location}
        </span>
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-4 text-primary" aria-hidden="true" />
          {duration}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="size-4 text-primary" aria-hidden="true" />
          {groupSize}
        </span>
      </div>
    </section>
  );
}
