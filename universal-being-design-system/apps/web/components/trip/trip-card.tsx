import Link from "next/link";
import { MapPin, Clock, Users } from "lucide-react";

import type { Trip } from "@/types/trip";
import { themeRegistry } from "@/data/themes";
import { TripImage } from "@/components/trip/trip-image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tag } from "@/components/primitives/tag";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/primitives/rating";
import { Price } from "@/components/primitives/price";
import { Button } from "@/components/ui/button";

export interface TripCardProps {
  trip: Trip;
  className?: string;
}

/**
 * TripCard — Architecture §2's real domain component ("consuming `Trip`
 * type only, never a hardcoded trip"). Every trip listing surface (Trip
 * Listing Page, Destination Detail Page, Related Trips) renders this same
 * component; only the `trip` prop changes.
 */
export function TripCard({ trip, className }: TripCardProps) {
  const theme = themeRegistry[trip.themeKey];
  const seatsLeft = trip.availableSeats;
  const lowSeats = seatsLeft > 0 && seatsLeft <= 4;

  return (
    <Card className={className}>
      <Link href={`/trips/${trip.slug}`} className="relative block" aria-label={trip.title}>
        <TripImage asset={trip.coverImage} theme={theme} variant="cover" containerClassName="rounded-t-lg rounded-b-none" />
        <div className="absolute left-3 top-3 z-10 flex gap-2">
          <Tag tone="brass">{trip.destinationName}</Tag>
          {trip.featured && <Badge variant="secondary">Featured</Badge>}
        </div>
        {lowSeats && (
          <div className="absolute right-3 top-3 z-10">
            <Badge variant="destructive">Only {seatsLeft} seats left</Badge>
          </div>
        )}
      </Link>

      <CardContent className="flex flex-col gap-2 pt-5">
        <h3 className="font-display text-lg font-medium text-foreground">
          <Link href={`/trips/${trip.slug}`} className="hover:underline">
            {trip.title}
          </Link>
        </h3>

        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          {trip.destinationName}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden="true" />
            {trip.duration.label}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5" aria-hidden="true" />
            {trip.groupSize.min}–{trip.groupSize.max} people
          </span>
        </div>

        <Rating value={trip.rating} count={trip.reviewCount} className="mt-1" />
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-3">
        <Price amount={trip.price.discounted ?? trip.price.base} originalAmount={trip.price.discounted ? trip.price.base : undefined} suffix="/ person" />
        <Button asChild size="sm">
          <Link href={`/trips/${trip.slug}`}>View trip</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
