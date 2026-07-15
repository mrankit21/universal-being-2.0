import { Check, X } from "lucide-react";

import type { Trip } from "@/types/trip";
import { SectionHeading } from "@/components/primitives/section-heading";

export interface TripInclusionsProps {
  trip: Trip;
}

/** TripInclusions — Architecture §2's `TripInclusions`; renders `inclusions[]`
 * / `exclusions[]` side by side so travellers can scan both in one view. */
export function TripInclusions({ trip }: TripInclusionsProps) {
  if (trip.inclusions.length === 0 && trip.exclusions.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <SectionHeading title="What's included" className="mb-5" />

      <div className="grid gap-6 sm:grid-cols-2">
        <ul className="flex flex-col gap-3">
          {trip.inclusions.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
              <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
        <ul className="flex flex-col gap-3">
          {trip.exclusions.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <X className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
