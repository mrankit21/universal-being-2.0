"use client";

import { useMemo, useState } from "react";
import { CompassIcon } from "lucide-react";

import type { Trip2CardSummary } from "@/lib/api/trip2";
import { Trip2Card } from "@/components/trip/v2/trip2-card";
import { SearchBox } from "@/components/primitives/search-box";
import { EmptyState } from "@/components/primitives/empty-state";
import { Button } from "@/components/ui/button";

export interface Trip2ListingProps {
  trips: Trip2CardSummary[];
}

/**
 * Trip2Listing — the `/trip2` counterpart of `TripListing`: trips are
 * fetched server-side (`getPublishedTrip2Trips()` in `app/trip2/page.tsx`)
 * and narrowed client-side by a simple title/location search. No
 * difficulty filter here — `Trip2CardSummary` doesn't carry that field —
 * so this is intentionally lighter than the v1 shell.
 */
export function Trip2Listing({ trips }: Trip2ListingProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return trips;
    return trips.filter(
      (trip) => trip.title.toLowerCase().includes(q) || trip.location.toLowerCase().includes(q)
    );
  }, [trips, query]);

  return (
    <div className="flex flex-col gap-6">
      <SearchBox
        value={query}
        onChange={setQuery}
        placeholder="Search trips or destinations…"
        containerClassName="w-full sm:max-w-xs"
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<CompassIcon />}
          title="No trips match your search"
          description="Try clearing the search to see all trips."
          action={
            <Button variant="outline" onClick={() => setQuery("")}>
              Clear search
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((trip) => (
            <Trip2Card key={trip.slug} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}
