import Link from "next/link";
import { MapPin, Compass } from "lucide-react";

import type { Destination } from "@/types/destination";
import { cn } from "@/lib/utils";
import { themeRegistry } from "@/data/themes";
import { TripImage } from "@/components/trip/trip-image";
import { Card, CardContent } from "@/components/ui/card";
import { Tag } from "@/components/primitives/tag";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/saved/save-button";

export interface DestinationCardProps {
  destination: Destination & { tripCount?: number };
  className?: string;
}

/** DestinationCard — grid card for `/destinations`. Data-driven off
 * `Destination` only, so adding a destination in the Admin Panel is enough
 * to add a new card here — no component change. */
export function DestinationCard({ destination, className }: DestinationCardProps) {
  const theme = themeRegistry[destination.themeKey];

  return (
    <Card className={cn("relative", className)}>
      <Link href={`/destinations/${destination.slug}`} className="block" aria-label={destination.name}>
        <TripImage asset={destination.thumbnail ?? destination.coverImage} theme={theme} variant="cover" containerClassName="rounded-t-lg rounded-b-none">
          <div className="absolute left-3 top-3 z-10 flex gap-1.5">
            <Tag tone="brass">{destination.state}</Tag>
            {destination.featured && <Tag tone="teal">Featured</Tag>}
          </div>
        </TripImage>
      </Link>
      <SaveButton itemType="destination" itemSlug={destination.slug} itemLabel={destination.name} className="absolute top-3 right-3" />

      <CardContent className="flex flex-col gap-2 pt-5">
        <h3 className="font-display text-lg font-medium text-foreground">
          <Link href={`/destinations/${destination.slug}`} className="hover:underline">
            {destination.name}
          </Link>
        </h3>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          {destination.region}
        </p>
        <p className="line-clamp-2 text-sm text-muted-foreground">{destination.shortDescription}</p>

        <div className="mt-2 flex items-center justify-between">
          {typeof destination.tripCount === "number" && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Compass className="size-3.5" aria-hidden="true" />
              {destination.tripCount} {destination.tripCount === 1 ? "trip" : "trips"}
            </span>
          )}
          <Button asChild size="sm" variant="outline">
            <Link href={`/destinations/${destination.slug}`}>Explore</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
