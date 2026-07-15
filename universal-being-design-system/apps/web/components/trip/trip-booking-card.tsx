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
 * TripBookingCard — Step 7.6E Part 4. The persistent booking summary: offer
 * price, original price, discount, booking amount, live seats left, and
 * the next departure — always computed via `getTripAvailability`, never
 * hardcoded, so it stays in sync with MongoDB the moment an admin edits a
 * batch. `sticky top-20` keeps it in view as the page scrolls past it
 * without touching the page's single-column layout (requirement: don't
 * redesign the UI).
 *
 * "Book Now" links to the batch list on this same page (`#trip-batches`)
 * rather than a checkout flow — the actual Booking & Payment System is
 * explicitly out of scope for this step and is what this card is
 * preparing the page for. WhatsApp mirrors the same contact number
 * `TripStickyActions` already uses, so both CTAs stay consistent.
 */
export function TripBookingCard({ trip }: TripBookingCardProps) {
  const { nextDeparture, seatsLeft, isAvailable } = getTripAvailability(trip);

  const offerPrice = trip.price.discounted ?? trip.price.base;
  const originalPrice = trip.price.discounted ? trip.price.base : undefined;
  const discountPercent = originalPrice
    ? Math.round(((originalPrice - offerPrice) / originalPrice) * 100)
    : null;

  const whatsappMessage = encodeURIComponent(`Hi! I'm interested in booking the ${trip.title} trip.`);

  return (
    <div className="sticky top-20 z-10">
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <div className="flex items-start justify-between gap-3">
            <Price amount={offerPrice} originalAmount={originalPrice} size="lg" suffix="/ person" />
            {discountPercent ? <Badge variant="success">{discountPercent}% off</Badge> : null}
          </div>

          <p className="text-sm text-muted-foreground">
            Book Your Slot amount: <span className="font-medium text-foreground">₹{trip.price.bookingAmount.toLocaleString("en-IN")}</span>
          </p>

          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Seats left</span>
            <span className="font-medium text-foreground">{seatsLeft}</span>
          </div>

          {nextDeparture ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays className="size-4" aria-hidden="true" />
                {formatDate(nextDeparture.startDate)}
              </span>
              <Badge variant={statusVariant[nextDeparture.status]}>{statusLabel[nextDeparture.status]}</Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No upcoming batches yet — check back soon.</p>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <Button asChild>
              <a href={isAvailable ? `/trips/${trip.slug}/book${nextDeparture ? `?departure=${nextDeparture.id}` : ""}` : "#trip-batches"}>
                <Ticket className="size-4" aria-hidden="true" />
                {isAvailable ? "Book Now" : "View Batches"}
              </a>
            </Button>
            <Button asChild variant="outline">
              <a
                href={`${siteConfig.contact.whatsappHref}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                WhatsApp us
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
