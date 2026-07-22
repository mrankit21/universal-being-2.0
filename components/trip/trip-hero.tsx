import { Clock, Users, Mountain, MapPin } from "lucide-react";

import type { Trip } from "@/types/trip";
import { themeRegistry } from "@/data/themes";
import { TripImage } from "@/components/trip/trip-image";
import { Tag } from "@/components/primitives/tag";
import { Rating } from "@/components/primitives/rating";
import { BreadcrumbTrail } from "@/components/layout/breadcrumb-trail";

export interface TripHeroProps {
  trip: Trip;
}

const difficultyLabel: Record<Trip["difficulty"], string> = {
  easy: "Easy",
  moderate: "Moderate",
  challenging: "Challenging",
};

/**
 * TripHero — Architecture §2's "banner + title + theme background slot".
 * Full-bleed hero image with the theme's hero gradient/particles/motifs
 * layered underneath via `TripImage`/`ThemeBackground` when no real photo
 * exists yet.
 */
export function TripHero({ trip }: TripHeroProps) {
  const theme = themeRegistry[trip.themeKey];

  return (
    <section>
      <div className="mx-auto max-w-6xl px-6 pt-6">
        <BreadcrumbTrail
          items={[
            { label: "Destinations", href: "/destinations" },
            { label: trip.destinationName, href: `/destinations/${trip.destinationSlug}` },
            { label: trip.title },
          ]}
        />
      </div>

      <div className="mx-auto max-w-6xl px-2 pt-4 sm:px-6">
        <TripImage
          asset={trip.heroImage}
          mobileAsset={trip.heroImageMobile}
          theme={theme}
          variant="hero"
          containerClassName="rounded-xl"
          sizes="(min-width: 1024px) 1152px, 100vw"
          priority
        />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone="brass">{theme.name}</Tag>
          <Tag>{difficultyLabel[trip.difficulty]}</Tag>
        </div>

        <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          {trip.title}
        </h1>

        <p className="max-w-2xl text-base text-muted-foreground">{trip.shortDescription}</p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden="true" />
            {trip.destinationName}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden="true" />
            {trip.duration.label}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-4" aria-hidden="true" />
            {trip.groupSize.min}–{trip.groupSize.max} people
          </span>
          <span className="flex items-center gap-1.5">
            <Mountain className="size-4" aria-hidden="true" />
            {difficultyLabel[trip.difficulty]}
          </span>
          <Rating value={trip.rating} count={trip.reviewCount} />
        </div>
      </div>
    </section>
  );
}
