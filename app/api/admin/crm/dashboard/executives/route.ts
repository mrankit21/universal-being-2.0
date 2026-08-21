/**
 * GET /api/admin/crm/dashboard/executives — card-sized summary (today's
 * leads, total, booked, revenue, conversion) for every Sales Executive
 * in scope. Feeds the colorful "Sales Executive Performance" grid on
 * the CRM Dashboard. Same role scoping as the main dashboard route — a
 * Sales Executive only ever gets their own single row back, since
 * `crmLeadScopeFilter` has already restricted the underlying leads
 * query before this ever groups by executive.
 */
import { connectToDatabase } from "@/lib/db/mongoose";
import { getExecutiveSummaries } from "@/lib/crm/executive-performance";
import { crmLeadScopeFilter } from "@/lib/crm/scope";
import { ok, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

export async function GET() {
  try {
    const user = await requirePermission("leads:read");
    await connectToDatabase();

    const data = await getExecutiveSummaries(crmLeadScopeFilter(user));
    return ok(data);
  } catch (err) {
    return handleApiError(err);
  }
}
