"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { cn } from "@/lib/utils";

export type BatchStatusV2 = "open" | "filling-fast" | "sold-out";

export interface BatchDateV2 {
  id: string;
  startDate: string; // ISO
  endDate: string; // ISO
  seatsAvailable: number;
  seatsTotal: number;
  status: BatchStatusV2;
}

const DEFAULT_BATCHES: BatchDateV2[] = [
  { id: "b1", startDate: "2026-09-05", endDate: "2026-09-11", seatsAvailable: 6, seatsTotal: 16, status: "open" },
  { id: "b2", startDate: "2026-09-19", endDate: "2026-09-25", seatsAvailable: 2, seatsTotal: 16, status: "filling-fast" },
  { id: "b3", startDate: "2026-10-03", endDate: "2026-10-09", seatsAvailable: 0, seatsTotal: 16, status: "sold-out" },
  { id: "b4", startDate: "2026-10-17", endDate: "2026-10-23", seatsAvailable: 11, seatsTotal: 16, status: "open" },
];

const STATUS_LABEL: Record<BatchStatusV2, string> = {
  open: "Open",
  "filling-fast": "Filling fast",
  "sold-out": "Sold out",
};

const STATUS_CLASS: Record<BatchStatusV2, string> = {
  open: "bg-success/15 text-success",
  "filling-fast": "bg-ub-brass-500/15 text-ub-brass-600",
  "sold-out": "bg-muted text-muted-foreground",
};

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}`;
}
function monthLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}
function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/**
 * Trip 2.0 UI — Batch Dates, item #8 in the serial order: "type like old
 * trip page me jo hain" — i.e. the real month-grouped, seat-status-aware
 * batch list from `TripPricingTable`'s `BatchDateStrip`, not just the
 * plain `BatchDatesCtaV2` banner. Redesigned to Trip 2.0's card language
 * (rounded-xl cards, month pill tabs) while keeping the same behaviour:
 * pick a month, see that month's batches, book the one you want.
 *
 * Static content only for now; once approved this maps from
 * `Trip.departureDates[]` the same way `getTripAvailability` already
 * powers the live batch list.
 */
export function BatchDatesV2({ batches = DEFAULT_BATCHES, bookHref = "/trips/spiti-valley/book" }: { batches?: BatchDateV2[]; bookHref?: string }) {
  const months = React.useMemo(() => {
    const seen = new Map<string, string>();
    for (const b of batches) {
      const key = monthKey(b.startDate);
      if (!seen.has(key)) seen.set(key, monthLabel(b.startDate));
    }
    return Array.from(seen, ([key, label]) => ({ key, label }));
  }, [batches]);

  const [activeMonth, setActiveMonth] = React.useState(months[0]?.key ?? "");
  const visibleBatches = batches.filter((b) => monthKey(b.startDate) === activeMonth);

  if (batches.length === 0) return null;

  return (
    <section id="batch-dates" className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <h2 className="mb-5 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Batch Dates</h2>

      {/* Month tabs */}
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {months.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setActiveMonth(m.key)}
            aria-pressed={m.key === activeMonth}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              m.key === activeMonth ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Batch cards for the selected month */}
      <div className="flex flex-col gap-3">
        {visibleBatches.map((batch) => (
          <div
            key={batch.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3.5 sm:px-5"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <CalendarDays className="size-4 text-primary" aria-hidden="true" />
              {dateLabel(batch.startDate)} – {dateLabel(batch.endDate)}
            </span>
            <span className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground sm:text-sm">
                {batch.seatsAvailable}/{batch.seatsTotal} seats left
              </span>
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_CLASS[batch.status])}>
                {STATUS_LABEL[batch.status]}
              </span>
              {batch.status !== "sold-out" ? (
                <Link
                  href={`${bookHref}?departure=${batch.id}`}
                  className="rounded-full border border-primary px-3.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  Book
                </Link>
              ) : null}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
