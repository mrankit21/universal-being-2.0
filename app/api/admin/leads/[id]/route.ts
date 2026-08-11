/**
 * PATCH /api/admin/leads/[id]?kind=trip2|promo — marks a lead as
 * contacted/not-contacted. `kind` is required since the unified list in
 * `GET /api/admin/leads` merges two separate Mongoose collections
 * (Trip2Lead, PromoLead) that happen to share an id-space only by
 * coincidence — it tells this route which model to write to.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip2LeadModel } from "@/lib/db/models/trip2-lead.model";
import { PromoLeadModel } from "@/lib/db/models/promo-lead.model";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({ contacted: z.boolean() });

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requirePermission("leads:write");
    await connectToDatabase();
    const { id } = await params;
    const kind = req.nextUrl.searchParams.get("kind");
    if (kind !== "trip2" && kind !== "promo") {
      return fail('Query param "kind" must be "trip2" or "promo".', 400);
    }
    const { contacted } = patchSchema.parse(await req.json());

    // Two separate Mongoose Models (different document shapes), so this
    // branches into two calls rather than a shared `Model` variable —
    // Mongoose's overloaded `findByIdAndUpdate` can't unify across them.
    const lead =
      kind === "trip2"
        ? await Trip2LeadModel.findByIdAndUpdate(id, { $set: { contacted } }, { new: true }).lean()
        : await PromoLeadModel.findByIdAndUpdate(id, { $set: { contacted } }, { new: true }).lean();
    if (!lead) return fail("Lead not found", 404);

    return ok(lead);
  } catch (err) {
    return handleApiError(err);
  }
}
