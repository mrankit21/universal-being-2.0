import { MapPin, CalendarRange, Mountain } from "lucide-react";

import type { Destination } from "@/types/destination";
import { themeRegistry } from "@/data/themes";
import { TripImage } from "@/components/trip/trip-image";
import { Tag } from "@/components/primitives/tag";
import { BreadcrumbTrail } from "@/components/layout/breadcrumb-trail";

export interface DestinationHeroProps {
  destination: Destination;
}

export function DestinationHero({ destination }: DestinationHeroProps) {
  const theme = themeRegistry[destination.themeKey];

  return (
    <section>
      <div className="mx-auto max-w-6xl px-6 pt-6">
        <BreadcrumbTrail
          items={[
            { label: "Destinations", href: "/destinations" },
            { label: destination.name },
          ]}
        />
      </div>

      <div className="mx-auto max-w-6xl px-6 pt-4">
        <TripImage
          asset={destination.heroImage}
          theme={theme}
          variant="hero"
          containerClassName="rounded-xl"
          sizes="(min-width: 1024px) 1152px, 100vw"
          priority
        />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6">
        <Tag tone="brass">{destination.state}</Tag>

        <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          {destination.name}
        </h1>

        <p className="max-w-2xl text-base text-muted-foreground">{destination.tagline}</p>
        <p className="max-w-2xl text-sm text-muted-foreground">{destination.longDescription}</p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden="true" />
            {destination.region}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarRange className="size-4" aria-hidden="true" />
            Best: {destination.bestSeason.join(", ")}
          </span>
          {destination.altitude && (
            <span className="flex items-center gap-1.5">
              <Mountain className="size-4" aria-hidden="true" />
              {destination.altitude}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
