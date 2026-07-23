import { CalendarDays, MessageCircle, Ticket } from "lucide-react";

import type { Trip } from "@/types/trip";
import { siteConfig } from "@/data/layout/site-config";
import { getTripAvailability } from "@/lib/trip/availability";
import { Price } from "@/components/primitives/price";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface TripBookingCardProps {
  trip: Trip;
}

const statusVariant: Record<
  Trip["departureDates"][number]["status"],
  "success" | "warning" | "destructive" | "muted"
> = {
  open: "success",
  "filling-fast": "warning",
  "sold-out": "destructive",
  closed: "muted",
};

const statusLabel: Record<
  Trip["departureDates"][number]["status"],
  string
> = {
  open: "Open",
  "filling-fast": "Filling fast",
  "sold-out": "Sold out",
  closed: "Closed",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function TripBookingCard({ trip }: TripBookingCardProps) {
  const { nextDeparture, seatsLeft, isAvailable } =
    getTripAvailability(trip);

  const offerPrice = trip.price.discounted ?? trip.price.base;
  const originalPrice = trip.price.discounted
    ? trip.price.base
    : undefined;

  const discountPercent = originalPrice
    ? Math.round(((originalPrice - offerPrice) / originalPrice) * 100)
    : null;

  const whatsappMessage = encodeURIComponent(
    `Hi! I'm interested in booking the ${trip.title} trip.`
  );

  return (
    <div className="sticky top-20 z-10">
      <Card className="overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-xl">
        <CardContent className="flex flex-col gap-5 p-6">
          {/* Price */}
          <div className="flex items-start justify-between gap-4">
            <Price
              amount={offerPrice}
              originalAmount={originalPrice}
              size="lg"
              suffix="/ person"
            />

            {discountPercent ? (
              <Badge
                variant="success"
                className="rounded-xl px-3 py-2 text-sm"
              >
                {discountPercent}% off
              </Badge>
            ) : null}
          </div>

          {/* Booking Amount */}
          <p className="text-sm text-muted-foreground">
            Book Your Slot amount:{" "}
            <span className="font-semibold text-foreground">
              ₹{trip.price.bookingAmount.toLocaleString("en-IN")}
            </span>
          </p>

          {/* Seats */}
          <div className="flex h-12 items-center justify-between rounded-xl bg-emerald-900/30 px-4">
            <span className="text-sm text-muted-foreground">
              Seats left
            </span>

            <span className="text-lg font-semibold text-foreground">
              {seatsLeft}
            </span>
          </div>

          {/* Date */}
          {nextDeparture ? (
            <div className="flex h-12 items-center justify-between rounded-xl border border-border/60 px-4">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="size-4" />
                {formatDate(nextDeparture.startDate)}
              </span>

              <Badge
                variant={statusVariant[nextDeparture.status]}
                className="rounded-full px-3"
              >
                {statusLabel[nextDeparture.status]}
              </Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No upcoming batches yet — check back soon.
            </p>
          )}

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              asChild
              className="h-12 rounded-xl text-base font-semibold"
            >
              <a
                href={
                  isAvailable
                    ? `/trips/${trip.slug}/book${
                        nextDeparture
                          ? `?departure=${nextDeparture.id}`
                          : ""
                      }`
                    : "#trip-batches"
                }
              >
                <Ticket className="size-4" />
                {isAvailable ? "Book Now" : "View Batches"}
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-12 rounded-xl text-base"
            >
              <a
                href={`${siteConfig.contact.whatsappHref}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-4" />
                WhatsApp us
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}