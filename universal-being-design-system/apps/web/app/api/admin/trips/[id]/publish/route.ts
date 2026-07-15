/**
 * POST /api/admin/trips/:id/publish — dedicated Publish/Unpublish action
 * (requirement #3) rather than folding it into the generic PATCH, since
 * Architecture §7/§14 ties this action to ISR revalidation: "Publish action
 * triggers ISR revalidation (/api/revalidate) for that trip's route." The
 * revalidation call is wired here so flipping status is always the one
 * place that also invalidates the cached page — no route ever forgets it.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { TripModel } from "@/lib/db/models";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";
import { revalidateTripSurfaces } from "@/lib/api-helpers/revalidate";
import { z } from "zod";

const bodySchema = z.object({ status: z.enum(["draft", "published", "archived"]) });

type Params = { params: Promise<{ id: string }> };

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

    revalidateTripSurfaces(trip);

    return ok(trip);
  } catch (err) {
    return handleApiError(err);
  }
}
