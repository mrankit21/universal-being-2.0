/**
 * GET  /api/admin/trips        — list (search/filter/paginate) all trips,
 *                                 including drafts (unlike the public
 *                                 `lib/api/trips.ts` which only shows published).
 * POST /api/admin/trips        — create a trip.
 * Architecture §7/§14: this is the persistence side of `TripEditor`.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { TripModel } from "@/lib/db/models";
import { tripSchema } from "@/lib/validators/trip.schema";
import { ok, created, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";
import { revalidateTripSurfaces } from "@/lib/api-helpers/revalidate";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("trips:read");
    await connectToDatabase();

    const { searchParams } = req.nextUrl;
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status");
    const destinationSlug = searchParams.get("destinationSlug");
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (destinationSlug) filter.destinationSlug = destinationSlug;
    if (q) filter.$text = { $search: q };

    const [trips, total] = await Promise.all([
      TripModel.find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      TripModel.countDocuments(filter),
    ]);

    return ok({ trips, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("trips:write");
    await connectToDatabase();

    const body = await req.json();
    const parsed = tripSchema.parse(body);

    const existing = await TripModel.findOne({ slug: parsed.slug });
    if (existing) return fail(`A trip with slug "${parsed.slug}" already exists`, 409);

    if (parsed.isCircuitParent && parsed.circuitGroup?.trim()) {
      const conflict = await TripModel.findOne({
        circuitGroup: parsed.circuitGroup,
        isCircuitParent: true,
      }).select("title slug");
      if (conflict && !body.confirmDuplicateParent) {
        return fail(
          `"${conflict.title}" is already the Circuit Parent for "${parsed.circuitGroup}". Only one Trip per Circuit Group should be flagged.`,
          409,
          { requiresConfirmation: true, conflictTitle: conflict.title, conflictSlug: conflict.slug }
        );
      }
    }

    const trip = await TripModel.create({
      ...parsed,
      createdBy: session.email,
      updatedBy: session.email,
    });

    revalidateTripSurfaces(trip);

    return created(trip);
  } catch (err) {
    return handleApiError(err);
  }
}
