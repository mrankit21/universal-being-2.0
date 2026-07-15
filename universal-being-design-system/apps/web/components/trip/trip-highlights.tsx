import { Sparkles, Clock, Mountain, Sun, TrendingUp, Users, MapPinned, Flag, Navigation } from "lucide-react";

import type { Trip } from "@/types/trip";
import { SectionHeading } from "@/components/primitives/section-heading";

export interface TripHighlightsProps {
  trip: Trip;
}

const difficultyLabel: Record<Trip["difficulty"], string> = {
  easy: "Easy",
  moderate: "Moderate",
  challenging: "Challenging",
};

/** One fact for the Step 7.6E Part 1 "Trip Highlights" strip. */
interface TripFact {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}

function buildFacts(trip: Trip): TripFact[] {
  const facts: TripFact[] = [];
  if (trip.duration.label) facts.push({ icon: Clock, label: "Duration", value: trip.duration.label });
  facts.push({ icon: TrendingUp, label: "Difficulty", value: difficultyLabel[trip.difficulty] });
  const bestTime = trip.bestTimeToVisit || (trip.bestSeason.length ? trip.bestSeason.join(", ") : "");
  if (bestTime) facts.push({ icon: Sun, label: "Best Time", value: bestTime });
  if (trip.altitude) facts.push({ icon: Mountain, label: "Altitude", value: trip.altitude });
  facts.push({ icon: Users, label: "Group Size", value: `${trip.groupSize.min}–${trip.groupSize.max} people` });
  if (trip.pickup) facts.push({ icon: MapPinned, label: "Pickup", value: trip.pickup });
  if (trip.drop) facts.push({ icon: MapPinned, label: "Drop", value: trip.drop });
  if (trip.startingCity) facts.push({ icon: Flag, label: "Starting City", value: trip.startingCity });
  if (trip.endingCity) facts.push({ icon: Navigation, label: "Ending City", value: trip.endingCity });
  return facts;
}

/**
 * TripHighlights — Step 7.6E Part 1. Renders the structured "Trip Facts"
 * strip (Duration / Difficulty / Best Time / Altitude / Group Size /
 * Pickup / Drop / Starting City / Ending City) above the pre-existing
 * free-text `highlights[]` bullet list, which is kept exactly as-is for
 * backward compatibility. Every fact self-hides when its source field is
 * empty, so partially-filled trips never show a blank/dashed value.
 */
export function TripHighlights({ trip }: TripHighlightsProps) {
  const facts = buildFacts(trip);

  if (facts.length === 0 && trip.highlights.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <SectionHeading title="Trip highlights" className="mb-5" />

      {facts.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {facts.map((fact) => (
            <div
              key={fact.label}
              className="flex flex-col gap-1 rounded-lg border border-border bg-card px-4 py-3"
            >
              <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <fact.icon className="size-3.5 text-ub-brass-600" aria-hidden="true" />
                {fact.label}
              </span>
              <span className="text-sm font-medium text-foreground">{fact.value}</span>
            </div>
          ))}
        </div>
      )}

      {trip.highlights.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {trip.highlights.map((highlight, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground"
            >
              <Sparkles className="mt-0.5 size-4 shrink-0 text-ub-brass-600" aria-hidden="true" />
              {highlight}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
