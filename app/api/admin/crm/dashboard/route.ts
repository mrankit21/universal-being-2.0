/**
 * GET /api/admin/crm/dashboard — Phase 8 ("Dashboard + Analytics").
 * Role-scoped via the same `crmLeadScopeFilter` every other CRM route
 * uses: a Sales Executive gets "My" numbers automatically (their own
 * leads only), Manager/Admin get the full team picture — see the
 * comment on `getCrmDashboard` in lib/crm/dashboard.ts.
 */
import { connectToDatabase } from "@/lib/db/mongoose";
import { getCrmDashboard } from "@/lib/crm/dashboard";
import { crmLeadScopeFilter } from "@/lib/crm/scope";
import { ok, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

export async function GET() {
  try {
    const user = await requirePermission("leads:read");
    await connectToDatabase();

    const data = await getCrmDashboard(crmLeadScopeFilter(user));
    return ok(data);
  } catch (err) {
    return handleApiError(err);
  }
}
