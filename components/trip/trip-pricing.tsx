"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";

import type { Trip, DepartureDate } from "@/types/trip";
import { Price } from "@/components/primitives/price";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/primitives/section-heading";
import { getTripAvailability } from "@/lib/trip/availability";
import { cn } from "@/lib/utils";

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

function monthLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { month: "short" }).toUpperCase();
}

function weekdayLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { weekday: "short" });
}

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

/**
 * BatchDateStrip — horizontally scrollable quick-jump for the batch list.
 * One tab per published departure's start date, grouped visually by month
 * (a dark vertical month tile precedes each new month). Selecting a tab
 * scrolls the matching batch card into view and keeps it highlighted, so
 * this is purely a navigation aid over `publishedDepartures` — it never
 * changes what's bookable or the underlying data.
 */
function BatchDateStrip({
  departures,
  selectedId,
  onSelect,
}: {
  departures: DepartureDate[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  let lastMonth: string | null = null;

  return (
    <div className="mb-3 overflow-x-auto rounded-xl border border-ub-teal-400/30 bg-ub-teal-400/10 p-2">
      <div className="flex w-max items-stretch gap-2">
        {departures.map((batch) => {
          const showMonth = monthKey(batch.startDate) !== lastMonth;
          lastMonth = monthKey(batch.startDate);
          const isSelected = batch.id === selectedId;

          return (
            <div key={batch.id} className="flex items-stretch gap-2">
              {showMonth ? (
                <div
                  className="flex shrink-0 items-center justify-center rounded-lg bg-foreground px-1.5 py-2 text-[11px] font-semibold tracking-wide text-background"
                  style={{ writingMode: "vertical-rl" }}
                  aria-hidden="true"
                >
                  {monthLabel(batch.startDate)}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => onSelect(batch.id)}
                aria-pressed={isSelected}
                className={cn(
                  "flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  isSelected
                    ? "border-2 border-ub-teal-500 bg-card text-ub-teal-500"
                    : "bg-foreground text-background hover:bg-foreground/90"
                )}
              >
                <span className="text-xs opacity-80">{weekdayLabel(batch.startDate)}</span>
                <span className="text-base font-semibold leading-none">{new Date(batch.startDate).getDate()}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
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

  const sortedDepartures = useMemo(
    () =>
      [...publishedDepartures].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      ),
    [publishedDepartures]
  );

  const [selectedId, setSelectedId] = useState<string | null>(sortedDepartures[0]?.id ?? null);
  const batchRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  function handleSelect(id: string) {
    setSelectedId(id);
    batchRefs.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

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

        <div className="flex flex-col">
          <BatchDateStrip departures={sortedDepartures} selectedId={selectedId} onSelect={handleSelect} />

          <div className="flex flex-col gap-2">
            {sortedDepartures.map((batch) => (
              <div
                key={batch.id}
                ref={(node) => {
                  if (node) batchRefs.current.set(batch.id, node);
                  else batchRefs.current.delete(batch.id);
                }}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 transition-colors",
                  batch.id === selectedId ? "border-ub-teal-500 ring-1 ring-ub-teal-500/30" : "border-border"
                )}
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
      </div>
    </section>
  );
}
