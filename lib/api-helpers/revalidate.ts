/**
 * Trip-First CMS — Part 3/5 ("Deleting a Trip should automatically remove
 * its page" / "No manual sync — everything should update automatically").
 *
 * `/trips/[slug]` and `/destinations/[slug]` are statically generated
 * (`generateStaticParams`), so once a page has been rendered — at build
 * time or on first request — Next.js's Full Route Cache keeps serving that
 * HTML indefinitely; nothing here uses `revalidate = N`, so nothing expires
 * on its own. Every route that creates, edits, publishes, deletes, or
 * attaches an image to a Trip must therefore explicitly invalidate the
 * cached pages that could show stale data. This was previously done ad hoc
 * (only the publish/unpublish route called `revalidatePath`); this helper
 * centralizes it so every Trip-mutating route calls the same list and none
 * of them can forget a surface.
 */
import { revalidatePath } from "next/cache";

export interface RevalidatableTrip {
  slug: string;
  destinationSlug?: string;
}

/** Revalidates every public + admin-adjacent surface a Trip can appear on:
 * its own detail page, the Trips listing, its Destination's page (Part 2 —
 * destinations build themselves from Trip data), and the homepage (Featured
 * Trips / Homepage Hero can embed any trip). Safe to call for a trip that
 * was just deleted — `revalidatePath` only needs the path, not a live doc. */
export function revalidateTripSurfaces(trip: RevalidatableTrip): void {
  revalidatePath(`/trips/${trip.slug}`);
  revalidatePath("/trips");
  if (trip.destinationSlug) revalidatePath(`/destinations/${trip.destinationSlug}`);
  revalidatePath("/");
}
