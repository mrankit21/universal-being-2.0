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
 * Trip 2.0 UI — dedicated Trip Title block, directly below the (now image-
 * only) hero. Added per serial-order revision (2026-07) so the title never
 * gets lost inside the hero's gradient overlay on smaller screens.
 *
 * Static content only for now; once approved this maps from `Trip.title`,
 * `Trip.shortDescription`, `Trip.destination`, `Trip.durationDays` and
 * `Trip.groupSize` the same way the rest of Trip 2.0 will be wired to
 * real Trip data after backend connection.
 */
export function TripTitleV2({
  title,
  description,
  location = "Himachal Pradesh, India",
  duration = "7 Days / 6 Nights",
  groupSize = "12–16 travellers",
}: TripTitleV2Props) {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-3 pt-6 text-center sm:px-6 sm:pt-8">
      <h1 className="font-display text-3xl font-bold tracking-tight leading-[1.1] text-primary sm:text-5xl">{title}</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">{description}</p>

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
