import type { Trip } from "@/types/trip";
import { SectionHeading } from "@/components/primitives/section-heading";

export interface TripTermsProps {
  trip: Trip;
}

/** TripTerms — renders `termsAndConditions[]` and `cancellationPolicy`,
 * both of which default to Universal Being's real policy copy (see
 * `data/shared/real-content.ts`) unless a trip needs a documented exception. */
export function TripTerms({ trip }: TripTermsProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <SectionHeading title="Terms & cancellation policy" className="mb-5" />

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h3 className="font-display text-base font-medium text-foreground">Terms & Conditions</h3>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            {trip.termsAndConditions.map((term, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden="true">•</span>
                {term}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="font-display text-base font-medium text-foreground">Cancellation Policy</h3>
          <p className="text-sm text-muted-foreground">{trip.cancellationPolicy}</p>
        </div>
      </div>
    </section>
  );
}
