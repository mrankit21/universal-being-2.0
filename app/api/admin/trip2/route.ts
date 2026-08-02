/**
 * GET  /api/admin/trip2  — list (search/filter/paginate) all Trip 2.0
 *                          pages, including drafts. Same shape as
 *                          `/api/admin/trips` (GET), scoped to `Trip2Model`.
 * POST /api/admin/trip2  — create a Trip 2.0 page.
 */
import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip2Model } from "@/lib/db/models";
import { trip2Schema } from "@/lib/validators/trip2.schema";
import { ok, created, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("trip2:read");
    await connectToDatabase();

    const { searchParams } = req.nextUrl;
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status");
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (q) filter.$or = [{ title: { $regex: q, $options: "i" } }, { slug: { $regex: q, $options: "i" } }];

    const [trips, total] = await Promise.all([
      Trip2Model.find(filter)
        .select("slug status title location durationLabel updatedAt")
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Trip2Model.countDocuments(filter),
    ]);

    return ok({ trips, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("trip2:write");
    await connectToDatabase();

    const body = await req.json();
    const parsed = trip2Schema.parse(body);

    const existing = await Trip2Model.findOne({ slug: parsed.slug });
    if (existing) return fail(`A Trip 2.0 page with slug "${parsed.slug}" already exists`, 409);

    const trip = await Trip2Model.create({
      ...parsed,
      createdBy: session.email,
      updatedBy: session.email,
    });

    if (trip.status === "published") revalidatePath(`/trip2/${trip.slug}`);

    return created(trip);
  } catch (err) {
    return handleApiError(err);
  }
}
