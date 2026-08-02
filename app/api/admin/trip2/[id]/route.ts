/** GET/PATCH/DELETE /api/admin/trip2/:id — single Trip 2.0 page CRUD,
 * backing the Admin Panel's Trip 2.0 editor. */
import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip2Model } from "@/lib/db/models";
import { trip2UpdateSchema } from "@/lib/validators/trip2.schema";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requirePermission("trip2:read");
    await connectToDatabase();
    const { id } = await params;
    const trip = await Trip2Model.findById(id).lean();
    if (!trip) return fail("Trip 2.0 page not found", 404);
    return ok(trip);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requirePermission("trip2:write");
    await connectToDatabase();
    const { id } = await params;

    const body = await req.json();
    const parsed = trip2UpdateSchema.parse(body);
    // Only forward keys the client actually sent in the RAW body — same
    // fix as `app/api/admin/trips/[id]/route.ts` and
    // `app/api/admin/homepage2/route.ts`. `trip2UpdateSchema` is
    // `.partial()` over a schema where nearly every field has a
    // `.default()` (quickLinks, gallery, price, ...), so zod silently
    // fills those in even when the client never sent the key. A plain
    // "is this defined" filter would let those defaults through and wipe
    // whatever the field actually held — checking the pre-zod `body` for
    // the key is the only reliable "client actually sent this" signal.
    const update = Object.fromEntries(
      Object.entries(parsed).filter(([k]) => Object.prototype.hasOwnProperty.call(body, k))
    );

    if (parsed.slug) {
      const clash = await Trip2Model.findOne({ slug: parsed.slug, _id: { $ne: id } });
      if (clash) return fail(`A Trip 2.0 page with slug "${parsed.slug}" already exists`, 409);
    }

    // Same hydrate-then-overwrite approach as `trips/[id]/route.ts` —
    // merge the change into the full existing document and write it back
    // whole with `overwrite: true`, rather than trusting a partial
    // `findByIdAndUpdate($set: update)` to behave with nested arrays.
    const existing = await Trip2Model.findById(id).lean();
    if (!existing) return fail("Trip 2.0 page not found", 404);
    const beforeSlug = existing.slug;
    const wasPublished = existing.status === "published";

    const merged = { ...existing, ...update, updatedBy: session.email };
    delete (merged as Record<string, unknown>)._id;
    delete (merged as Record<string, unknown>).__v;
    delete (merged as Record<string, unknown>).createdAt;
    delete (merged as Record<string, unknown>).updatedAt;

    const trip = await Trip2Model.findByIdAndUpdate(id, merged, { new: true, overwrite: true });
    if (!trip) return fail("Trip 2.0 page not found", 404);

    if (trip.status === "published") revalidatePath(`/trip2/${trip.slug}`);
    // Slug changed, or it was published and just got unpublished/renamed
    // away: clear the old path too so it doesn't keep serving stale HTML.
    if (beforeSlug !== trip.slug || (wasPublished && trip.status !== "published")) {
      revalidatePath(`/trip2/${beforeSlug}`);
    }

    return ok(trip);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requirePermission("trip2:write");
    await connectToDatabase();
    const { id } = await params;

    const trip = await Trip2Model.findByIdAndDelete(id);
    if (!trip) return fail("Trip 2.0 page not found", 404);

    revalidatePath(`/trip2/${trip.slug}`);
    return ok({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
