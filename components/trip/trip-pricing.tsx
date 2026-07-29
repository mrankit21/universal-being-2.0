import Link from "next/link";
import { CalendarDays } from "lucide-react";

import type { Trip } from "@/types/trip";
import { Price } from "@/components/primitives/price";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/primitives/section-heading";
import { getTripAvailability } from "@/lib/trip/availability";

export interface TripPricingTableProps {
  trip: Trip;
  /** Pickup Variant Architecture (2026-07) — see `TripBookingCardProps`. */
  pickupVariantId?: string;
}

const statusVariant: Record<Trip["departureDates"][number]["status"], "success" | "warning" | "destructive" | "muted"> = {
  open: "success",
  "filling-fast": "warning",
  "sold-out": "destructive",
  closed: "muted",
};

const statusLabel: Record<Trip["departureDates"][number]["status"], string> = {
  open: "Open",
  "filling-fast": "Filling fast",
  "sold-out": "Sold out",
  closed: "Closed",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * TripPricingTable — Architecture §2's `TripPricingTable` + §5's "computed
 * client-side from `price.base` + active `departureDates[].priceOverride`"
 * rule, without the booking flow itself (requirement #9: no auth/payment
 * yet). Shows the price, booking amount, and every batch with live seat
 * status — the actual "Book" action lives in `TripStickyActions`.
 */
export function TripPricingTable({ trip, pickupVariantId }: TripPricingTableProps) {
  const { publishedDepartures, seatsLeft } = getTripAvailability(trip);

  return (
    <section id="trip-batches" className="mx-auto max-w-6xl px-6 py-8">
      <SectionHeading title="Pricing & batch dates" className="mb-5" />

      <div className="grid gap-4 sm:grid-cols-[minmax(0,320px)_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base font-medium">Price per person</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Price amount={trip.price.discounted ?? trip.price.base} originalAmount={trip.price.discounted ? trip.price.base : undefined} size="lg" />
            <p className="text-sm text-muted-foreground">
              Book Your Slot amount: <span className="font-medium text-foreground">₹{trip.price.bookingAmount.toLocaleString("en-IN")}</span> to reserve your seat.
            </p>
            <p className="text-sm text-muted-foreground">
              {seatsLeft} of {trip.totalSeats} seats available on the next batch.
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          {publishedDepartures.map((batch) => (
            <div
              key={batch.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
                {formatDate(batch.startDate)} – {formatDate(batch.endDate)}
              </span>
              <span className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {batch.seatsAvailable}/{batch.seatsTotal} seats left
                </span>
                <Badge variant={statusVariant[batch.status]}>{statusLabel[batch.status]}</Badge>
                {batch.status === "open" || batch.status === "filling-fast" ? (
                  <Button asChild size="sm" variant="outline">
                    <Link
                      href={`/trips/${trip.slug}/book?departure=${batch.id}${pickupVariantId ? `&pickup=${pickupVariantId}` : ""}`}
                    >
                      Select & Book
                    </Link>
                  </Button>
                ) : null}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
