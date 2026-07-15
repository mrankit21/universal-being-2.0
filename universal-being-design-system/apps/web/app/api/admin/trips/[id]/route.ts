/** GET/PATCH/DELETE /api/admin/trips/:id — single trip CRUD, backing every
 * tab in the Admin Panel's Trip Editor (pricing, batches, gallery,
 * itinerary, FAQs, policies, map all PATCH the same document). */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { TripModel } from "@/lib/db/models";
import { tripUpdateSchema } from "@/lib/validators/trip.schema";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";
import { revalidateTripSurfaces } from "@/lib/api-helpers/revalidate";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requirePermission("trips:read");
    await connectToDatabase();
    const { id } = await params;
    const trip = await TripModel.findById(id).lean();
    if (!trip) return fail("Trip not found", 404);
    return ok(trip);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requirePermission("trips:write");
    await connectToDatabase();
    const { id } = await params;

    const body = await req.json();
    const parsed = tripUpdateSchema.parse(body);

    if (parsed.slug) {
      const clash = await TripModel.findOne({ slug: parsed.slug, _id: { $ne: id } });
      if (clash) return fail(`A trip with slug "${parsed.slug}" already exists`, 409);
    }

    const before = await TripModel.findById(id).select("slug destinationSlug").lean();

    const trip = await TripModel.findByIdAndUpdate(
      id,
      { ...parsed, updatedBy: session.email },
      { new: true, runValidators: true }
    );
    if (!trip) return fail("Trip not found", 404);

    revalidateTripSurfaces(trip);
    // Slug or destination reassignment: also clear the old paths so the
    // Trip doesn't keep serving a stale page at its previous address, and
    // its old Destination page stops listing it.
    if (before && (before.slug !== trip.slug || before.destinationSlug !== trip.destinationSlug)) {
      revalidateTripSurfaces(before);
    }

    return ok(trip);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await requirePermission("trips:write");
    await connectToDatabase();
    const { id } = await params;
    const force = req.nextUrl.searchParams.get("force") === "true";

    const existing = await TripModel.findById(id).select("title featured status");
    if (!existing) return fail("Trip not found", 404);

    if (!force && (existing.featured || existing.status === "published")) {
      const reasons: string[] = [];
      if (existing.featured) reasons.push("is marked as Featured");
      if (existing.status === "published") reasons.push("is currently Published and live on the site");
      return fail(
        `"${existing.title}" ${reasons.join(" and ")}. Confirm you still want to delete it.`,
        409,
        { requiresConfirmation: true, featured: existing.featured, status: existing.status }
      );
    }

    const trip = await TripModel.findByIdAndDelete(id);
    if (!trip) return fail("Trip not found", 404);
    revalidateTripSurfaces(trip);
    return ok({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
