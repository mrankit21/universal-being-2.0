/** DELETE /api/admin/salespeople/[id] — removes a salesperson from the
 * assignable list. Also clears `assignedTo` on any leads currently
 * pointing at their name (Trip2Lead + PromoLead) so a deleted name never
 * lingers as a stale assignment in the Leads table. */
import { connectToDatabase } from "@/lib/db/mongoose";
import { SalespersonModel } from "@/lib/db/models/salesperson.model";
import { Trip2LeadModel } from "@/lib/db/models/trip2-lead.model";
import { PromoLeadModel } from "@/lib/db/models/promo-lead.model";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requirePermission("leads:write");
    await connectToDatabase();
    const { id } = await params;

    const person = await SalespersonModel.findByIdAndDelete(id).lean();
    if (!person) return fail("Salesperson not found", 404);

    await Promise.all([
      Trip2LeadModel.updateMany({ assignedTo: person.name }, { $unset: { assignedTo: "" } }),
      PromoLeadModel.updateMany({ assignedTo: person.name }, { $unset: { assignedTo: "" } }),
    ]);

    return ok({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
