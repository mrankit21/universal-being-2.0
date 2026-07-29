import { BedDouble, MapPin } from "lucide-react";

import type { Trip } from "@/types/trip";
import { SectionHeading } from "@/components/primitives/section-heading";
import { TripImage } from "@/components/trip/trip-image";
import { themeRegistry } from "@/data/themes";

export interface TripAccommodationProps {
  trip: Trip;
}

/** TripAccommodation — Step 7.6C-A §6. Renders the admin-managed hotel/room
 * list. Self-hides when no accommodation has been added yet, same pattern
 * as `TripInclusions`/`TripMap`. */
export function TripAccommodation({ trip }: TripAccommodationProps) {
  if (trip.accommodation.length === 0) return null;
  const theme = themeRegistry[trip.themeKey];

  return (
    <section id="trip-accommodation" className="mx-auto max-w-6xl px-6 py-8">
      <SectionHeading title="Accommodation" className="mb-5" />
      <div className="grid gap-4 sm:grid-cols-2">
        {trip.accommodation.map((stay) => (
          <div key={stay.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
            <div className="flex gap-3">
              <BedDouble className="mt-0.5 size-5 shrink-0 text-ub-brass-600" aria-hidden="true" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">{stay.hotelName || "Hotel"}</p>
                {stay.roomType ? <p className="text-sm text-muted-foreground">{stay.roomType}</p> : null}
                {stay.roomSharing ? <p className="text-xs text-muted-foreground">{stay.roomSharing}</p> : null}
                {stay.location ? (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" aria-hidden="true" />
                    {stay.location}
                  </p>
                ) : null}
                {stay.notes ? <p className="text-xs text-muted-foreground">{stay.notes}</p> : null}
                {stay.amenities && stay.amenities.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {stay.amenities.map((a) => (
                      <span key={a} className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                        {a}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            {stay.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {stay.images.map((asset, i) => (
                  <TripImage key={i} asset={asset} theme={theme} variant="thumbnail" containerClassName="rounded-md" />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
