import { searchTrips } from "@/lib/api/trips";
import { ok, handleApiError } from "@/lib/api-helpers/respond";

/**
 * GET /api/trips/search?q=manali
 *
 * Public, read-only trip suggestion endpoint that powers the homepage /
 * header global search bar (`GlobalSearchModal`). Reuses the existing
 * `searchTrips` filter (title / destinationName / shortDescription match)
 * so it stays in sync with the same MongoDB-primary/static-fallback data
 * every other public page already uses — no new data path.
 *
 * Empty or missing `q` returns an empty list rather than "all trips" so the
 * search box doesn't dump the entire catalog before the visitor types
 * anything.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();

    if (!q) return ok([]);

    const trips = await searchTrips({ query: q });

    const results = trips.slice(0, 8).map((trip) => ({
      id: trip.slug,
      title: trip.title,
      href: `/trips/${trip.slug}`,
      description: trip.destinationName,
    }));

    return ok(results);
  } catch (err) {
    return handleApiError(err);
  }
}
