import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { DestinationModel, TripModel } from "@/lib/db/models";
import { destinationUpdateSchema } from "@/lib/validators/destination.schema";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

type Params = { params: Promise<{ id: string }> };

/** Revalidates every public surface a Destination can appear on: its own
 * detail page, the Destinations listing, and the homepage (Destination
 * content can appear in homepage widgets via getHomepageVisibleDestinations).
 * Mirrors revalidateTripSurfaces in lib/api-helpers/revalidate.ts. */
function revalidateDestinationSurfaces(destination: { slug: string }): void {
  revalidatePath(`/destinations/${destination.slug}`);
  revalidatePath("/destinations");
  revalidatePath("/");
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requirePermission("destinations:read");
    await connectToDatabase();
    const { id } = await params;
    const destination = await DestinationModel.findById(id).lean();
    if (!destination) return fail("Destination not found", 404);
    return ok(destination);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requirePermission("destinations:write");
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const parsed = destinationUpdateSchema.parse(body);
    // Only forward keys the client actually sent in the RAW body. Filtering
    // on `v !== undefined` is not enough: fields with a `.default()` (e.g.
    // status/published flags) get that default silently applied by zod even
    // when the client never sent the key, so they come back *defined* and
    // slip through a definedness filter — overwriting the real value.
    // Checking the pre-zod `body` for the key is the only reliable way to
    // tell "client sent this" from "zod defaulted this".
    const update = Object.fromEntries(
      Object.entries(parsed).filter(([k]) => Object.prototype.hasOwnProperty.call(body, k))
    );

    if (parsed.slug) {
      const clash = await DestinationModel.findOne({ slug: parsed.slug, _id: { $ne: id } });
      if (clash) return fail(`A destination with slug "${parsed.slug}" already exists`, 409);
    }

    // Fetch the full document as a plain object (.lean()), merge the
    // change into it, and write the WHOLE merged object back with
    // `overwrite: true`. We tried hydrate-then-save() and then
    // findByIdAndUpdate + runValidators first — both kept failing required
    // validation on region/state even after confirming via logging that
    // the fetched document genuinely has valid values for both. That
    // points to a Mongoose validator bug in this environment/version
    // rather than a real data problem, so runValidators is dropped here:
    // `merged` is provably complete (it's the real document with only the
    // sent fields changed), so there's nothing left for it to catch.
    const existing = await DestinationModel.findById(id).lean();
    if (!existing) return fail("Destination not found", 404);
    const beforeSlug = existing.slug;

    const merged = { ...existing, ...update };
    delete (merged as Record<string, unknown>)._id;
    delete (merged as Record<string, unknown>).__v;
    delete (merged as Record<string, unknown>).createdAt;
    delete (merged as Record<string, unknown>).updatedAt;

    const destination = await DestinationModel.findByIdAndUpdate(id, merged, {
      new: true,
      overwrite: true,
    });
    if (!destination) return fail("Destination not found", 404);

    revalidateDestinationSurfaces(destination);
    // Slug reassignment: also clear the old path so the destination doesn't
    // keep serving a stale page at its previous address.
    if (beforeSlug !== destination.slug) {
      revalidateDestinationSurfaces({ slug: beforeSlug });
    }

    return ok(destination);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requirePermission("destinations:write");
    await connectToDatabase();
    const { id } = await params;

    const destination = await DestinationModel.findById(id);
    if (!destination) return fail("Destination not found", 404);

    const tripCount = await TripModel.countDocuments({ destinationSlug: destination.slug });
    if (tripCount > 0) {
      return fail(
        `Cannot delete "${destination.name}" — ${tripCount} trip(s) still reference it. Reassign or delete those trips first.`,
        409
      );
    }

    await destination.deleteOne();
    revalidateDestinationSurfaces(destination);
    return ok({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
