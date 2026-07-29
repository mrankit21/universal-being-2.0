import { Star } from "lucide-react";

import type { Trip } from "@/types/trip";
import { SectionHeading } from "@/components/primitives/section-heading";

export interface TripHotelCategoriesProps {
  trip: Trip;
}

const STAR_FALLBACK_LABEL: Record<number, string> = {
  0: "< 3 Star",
  3: "3 Star",
  4: "4 Star",
  5: "5 Star",
};

/**
 * TripHotelCategories — Hotel Category Architecture (2026-07).
 *
 * Purely informational "3 Star / 4 Star / 5 Star" cards so visitors know
 * roughly what tier of stay to expect. Deliberately NOT hotel inventory,
 * availability, or pricing — the Operations team allocates the actual
 * hotel manually after booking. Renders only `isEnabled` categories, in
 * admin-configured order; self-hides entirely when the Trip has none, same
 * backward-compatible pattern as every other optional section here.
 */
export function TripHotelCategories({ trip }: TripHotelCategoriesProps) {
  const categories = (trip.hotelCategories ?? []).filter((c) => c.isEnabled);
  if (categories.length === 0) return null;

  return (
    <section id="trip-hotel-categories" className="mx-auto max-w-6xl px-6 py-8">
      <SectionHeading title="Hotel Category" className="mb-5" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => {
          const starCount = category.stars === 0 ? 1 : category.stars;
          return (
            <div key={category.id} className="rounded-ub-lg border border-border bg-card p-4">
              <div className="mb-1.5 flex items-center gap-0.5" aria-hidden="true">
                {Array.from({ length: starCount }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-ub-brass-600 text-ub-brass-600" />
                ))}
              </div>
              <p className="text-sm font-semibold text-foreground">
                {category.title || STAR_FALLBACK_LABEL[category.stars]}
              </p>
              {category.shortDescription ? (
                <p className="mt-1 text-sm text-muted-foreground">{category.shortDescription}</p>
              ) : null}
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Hotel allocation within your selected category is handled by our operations team after booking.
      </p>
    </section>
  );
}
