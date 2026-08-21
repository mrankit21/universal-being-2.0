/**
 * GET /api/admin/crm/dashboard/executive/[name] — the deep-dive behind
 * a single "Sales Executive Performance" card: today/week/month lead
 * counts, a 6-month trend, current pipeline mix, and the timing of
 * their recent conversions and assignments.
 *
 * A Sales Executive can only ever pull their own detail — even though
 * `crmLeadScopeFilter` already limits the underlying leads query to
 * their own assigned leads (so requesting someone else's name would
 * just come back empty), we still fail loudly here rather than
 * silently returning a zeroed-out page, so the UI can tell "not
 * allowed" apart from "no data yet".
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { getExecutiveDetail } from "@/lib/crm/executive-performance";
import { crmLeadScopeFilter } from "@/lib/crm/scope";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

export async function GET(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  try {
    const user = await requirePermission("leads:read");
    await connectToDatabase();
    const { name } = await params;
    const requestedName = decodeURIComponent(name);

    if (user.role === "sales_executive" && requestedName.trim().toLowerCase() !== user.name.trim().toLowerCase()) {
      return fail("You can only view your own performance.", 403);
    }

    const data = await getExecutiveDetail(crmLeadScopeFilter(user), requestedName);
    if (!data) return fail("Executive not found.", 404);
    return ok(data);
  } catch (err) {
    return handleApiError(err);
  }
}
