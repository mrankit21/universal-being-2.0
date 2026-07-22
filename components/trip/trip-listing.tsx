"use client";

import { useMemo, useState } from "react";
import { CompassIcon } from "lucide-react";

import type { Trip, TripDifficulty } from "@/types/trip";
import { TripCard } from "@/components/trip/trip-card";
import { SearchBox } from "@/components/primitives/search-box";
import { FilterChips, type FilterChipOption } from "@/components/primitives/filter-chips";
import { EmptyState } from "@/components/primitives/empty-state";
import { Button } from "@/components/ui/button";

export interface TripListingProps {
  trips: Trip[];
}

const difficultyOptions: FilterChipOption[] = [
  { value: "easy", label: "Easy" },
  { value: "moderate", label: "Moderate" },
  { value: "challenging", label: "Challenging" },
];

/**
 * TripListing — the interactive shell of the Trip Listing Page. Trips are
 * fetched server-side (`getAllTrips()` in `app/trips/page.tsx`) and passed
 * in as props; filtering here is a client-side narrowing of that already-
 * fetched list, matching how `TripDiscovery` filtered `data.ts` trips in
 * the earlier phase — same pattern, real `Trip` type this time.
 */
export function TripListing({ trips }: TripListingProps) {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return trips.filter((trip) => {
      const matchesQuery =
        !query.trim() ||
        trip.title.toLowerCase().includes(query.toLowerCase()) ||
        trip.destinationName.toLowerCase().includes(query.toLowerCase());
      const matchesDifficulty = difficulty.length === 0 || difficulty.includes(trip.difficulty as TripDifficulty);
      return matchesQuery && matchesDifficulty;
    });
  }, [trips, query, difficulty]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Search trips or destinations…"
          containerClassName="w-full sm:max-w-xs"
        />
        <FilterChips
          label="Filter trips by difficulty"
          options={difficultyOptions}
          value={difficulty}
          onValueChange={setDifficulty}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<CompassIcon />}
          title="No trips match your filters"
          description="Try clearing the search or difficulty filter to see all trips."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setDifficulty([]);
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((trip) => (
            <TripCard key={trip.slug} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}
