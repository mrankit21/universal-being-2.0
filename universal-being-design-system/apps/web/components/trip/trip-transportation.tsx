import { MapPinned, Navigation, Bus } from "lucide-react";

import type { Trip } from "@/types/trip";
import { SectionHeading } from "@/components/primitives/section-heading";

export interface TripTransportationProps {
  trip: Trip;
}

/** TripTransportation — Step 7.6C-A §8. Renders pickup/drop points and
 * vehicle. Self-hides when none of the three fields are filled in. */
export function TripTransportation({ trip }: TripTransportationProps) {
  if (!trip.pickup && !trip.drop && !trip.vehicle && !trip.travelNotes) return null;

  const rows = [
    { label: "Pickup", value: trip.pickup, icon: MapPinned },
    { label: "Drop", value: trip.drop, icon: Navigation },
    { label: "Vehicle", value: trip.vehicle, icon: Bus },
  ].filter((row) => row.value);

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <SectionHeading title="Transportation" className="mb-5" />
      <div className="grid gap-4 sm:grid-cols-3">
        {rows.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-start gap-2.5 rounded-lg border border-border bg-card p-4">
            <Icon className="mt-0.5 size-4 shrink-0 text-ub-brass-600" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="text-sm text-foreground">{value}</p>
            </div>
          </div>
        ))}
      </div>
      {trip.travelNotes ? <p className="mt-4 text-sm text-muted-foreground">{trip.travelNotes}</p> : null}
    </section>
  );
}
