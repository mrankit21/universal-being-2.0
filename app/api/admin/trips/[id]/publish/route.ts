/**
 * POST /api/admin/trips/:id/publish — dedicated Publish/Unpublish action
 * (requirement #3) rather than folding it into the generic PATCH, since
 * Architecture §7/§14 ties this action to ISR revalidation: "Publish action
 * triggers ISR revalidation (/api/revalidate) for that trip's route." The
 * revalidation call is wired here so flipping status is always the one
 * place that also invalidates the cached page — no route ever forgets it.
 *
 * Cascade unpublish (2026-07): a circuit's Parent trip is what the public
 * `/trips` listing and "You might also like" show — its duration-variant
 * siblings (same `circuitGroup`) are only reachable *through* the Parent's
 * page (`TripDurationSelector`). So if the Parent goes to draft/archived,
 * its siblings are already unreachable from anywhere on the public site;
 * leaving them "Published" in the DB is misleading (admin sees them as
 * live when nobody can actually land on them) and, worse, if a sibling
 * later gets flagged Parent or becomes the shortest-duration fallback, it
 * would suddenly go live with a page that was never re-checked. Unpublishing
 * the Parent now cascades the same status to every sibling in its
 * `circuitGroup`. This only fires when the trip *being* unpublished is the
 * circuit's Parent (`pickCircuitParent` — flagged, or shortest-duration
 * fallback) — unpublishing a non-parent child never touches its siblings,
 * and publishing (parent or child) never cascades either direction.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { TripModel } from "@/lib/db/models";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";
import { revalidateTripSurfaces, RevalidatableTrip } from "@/lib/api-helpers/revalidate";
import { z } from "zod";

const bodySchema = z.object({ status: z.enum(["draft", "published", "archived"]) });

type Params = { params: Promise<{ id: string }> };

/** Same "which trip is the Parent" rule as `lib/api/trips.ts`'s
 * `pickCircuitParent`: the sibling flagged `isCircuitParent`, or — when
 * nobody in the group is flagged — the shortest-duration one. Kept as a
 * standalone copy here (rather than importing the client-safe
 * `lib/api/trips.ts`) since this route works directly off lean Mongo docs. */
function pickParentDoc<T extends { _id: unknown; isCircuitParent?: boolean; duration: { days: number } }>(
  group: T[]
): T | undefined {
  if (group.length === 0) return undefined;
  const flagged = group.find((t) => t.isCircuitParent);
  if (flagged) return flagged;
  return group.reduce((shortest, t) => (t.duration.days < shortest.duration.days ? t : shortest));
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await requirePermission("trips:write");
    await connectToDatabase();
    const { id } = await params;
    const { status } = bodySchema.parse(await req.json());

    const trip = await TripModel.findByIdAndUpdate(
      id,
      { status, updatedBy: session.email },
      { new: true }
    );
    if (!trip) return fail("Trip not found", 404);

    // Typed as `RevalidatableTrip[]`, not `typeof trip[]` — this array only
    // ever feeds `revalidateTripSurfaces`, which needs just `slug` /
    // `destinationSlug`. Letting it infer from `trip` (a full Mongoose
    // Hydrated Document) made every later push require a real Document —
    // but the cascaded siblings come from a `.lean()` query, so
    // `{ ...s, status }` is a plain object, not a Document, and TS
    // rejected it. Both `trip` and the lean-spread objects satisfy this
    // narrower interface structurally.
    const affected: RevalidatableTrip[] = [trip];

    const cascaded: { _id: string; title: string }[] = [];

    if (status !== "published" && trip.circuitGroup) {
      const siblings = await TripModel.find({
        circuitGroup: trip.circuitGroup,
        _id: { $ne: trip._id },
      }).lean();

      const group = [trip, ...siblings];
      const parent = pickParentDoc(group);

      if (parent && String(parent._id) === String(trip._id)) {
        const toCascade = siblings.filter((s) => s.status === "published");
        if (toCascade.length > 0) {
          await TripModel.updateMany(
            { _id: { $in: toCascade.map((s) => s._id) } },
            { status, updatedBy: session.email }
          );
          affected.push(...toCascade.map((s) => ({ ...s, status })));
          cascaded.push(...toCascade.map((s) => ({ _id: String(s._id), title: s.title })));
        }
      }
    }

    for (const t of affected) revalidateTripSurfaces(t);

    return ok({ trip, cascaded });
  } catch (err) {
    return handleApiError(err);
  }
}