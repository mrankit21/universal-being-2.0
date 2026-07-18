import type { Metadata } from "next";
import { Heart } from "lucide-react";

import { getCurrentCustomer } from "@/lib/auth/current-customer";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/db/mongoose";
import { SavedItemModel } from "@/lib/db/models";
import { getAllTrips } from "@/lib/api/trips";
import { getAllDestinations } from "@/lib/api/destinations";
import { TripCard } from "@/components/trip/trip-card";
import { DestinationCard } from "@/components/destination/destination-card";
import { SectionHeading } from "@/components/primitives/section-heading";
import { SavedSignInPrompt } from "@/components/saved/saved-sign-in-prompt";

export const metadata: Metadata = {
  title: "Saved | Universal Being",
  description: "Trips and destinations you've saved.",
};

/**
 * /saved — requirement from the "1 Artifact" plan (save button + backend +
 * saved page). Server Component: reads the customer session directly
 * (no client round-trip needed for the initial render), then re-hydrates
 * each saved (itemType, itemSlug) pair against the same `lib/api/trips.ts`
 * / `lib/api/destinations.ts` functions every other listing page uses —
 * so a saved trip always reflects its current admin-edited data, and a
 * trip that's since been unpublished simply drops off the list instead of
 * rendering stale/broken.
 */
export default async function SavedPage() {
  const customer = await getCurrentCustomer();

  if (!customer) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <SectionHeading eyebrow="Your list" title="Saved" description="Sign in to see the trips and destinations you've saved." className="mb-8" />
        <SavedSignInPrompt />
      </div>
    );
  }

  let savedTripSlugs: string[] = [];
  let savedDestinationSlugs: string[] = [];

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const items = await SavedItemModel.find({ customerId: customer.sub }).lean();
    savedTripSlugs = items.filter((item) => item.itemType === "trip").map((item) => item.itemSlug);
    savedDestinationSlugs = items.filter((item) => item.itemType === "destination").map((item) => item.itemSlug);
  }

  const [allTrips, allDestinations] = await Promise.all([getAllTrips(), getAllDestinations()]);
  const trips = allTrips.filter((trip) => savedTripSlugs.includes(trip.slug));
  const destinations = allDestinations.filter((destination) => savedDestinationSlugs.includes(destination.slug));
  const isEmpty = trips.length === 0 && destinations.length === 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <SectionHeading eyebrow="Your list" title="Saved" description="Trips and destinations you've saved for later." className="mb-8" />

      {isEmpty && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <Heart className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-muted-foreground">Nothing saved yet — tap the heart on any trip or destination to add it here.</p>
        </div>
      )}

      {trips.length > 0 && (
        <div className="mb-10">
          <h2 className="font-display mb-4 text-xl font-medium text-foreground">Trips</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <TripCard key={trip.slug} trip={trip} />
            ))}
          </div>
        </div>
      )}

      {destinations.length > 0 && (
        <div>
          <h2 className="font-display mb-4 text-xl font-medium text-foreground">Destinations</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((destination) => (
              <DestinationCard key={destination.slug} destination={destination} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
