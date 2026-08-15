/**
 * GET /api/admin/crm/follow-ups — Phase 3 ("Follow-up + No Response
 * System"). Returns the four dashboard sections the roadmap calls for in
 * one shot: Overdue, Today, Upcoming, and No Response > 2 Days. Each
 * bucket is derived at read time from `followUpBucket()` / `isNoResponse()`
 * (lib/crm/activity.ts) — nothing here is a stored flag, so a lead can
 * never get stuck "overdue" after its follow-up date is pushed out, and
 * no cron job is needed to keep these buckets accurate.
 *
 * Terminal-state leads (booked/trip_completed/lost) are excluded from
 * every bucket — a closed lead doesn't need chasing.
 */
import { connectToDatabase } from "@/lib/db/mongoose";
import { CrmLeadModel } from "@/lib/db/models/crm-lead.model";
import { isNoResponse, followUpBucket } from "@/lib/crm/activity";
import { crmLeadScopeFilter } from "@/lib/crm/scope";
import { ok, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

const TERMINAL = new Set(["booked", "trip_completed", "lost"]);

export async function GET() {
  try {
    const user = await requirePermission("leads:read");
    await connectToDatabase();

    const filter: Record<string, unknown> = { status: { $nin: Array.from(TERMINAL) } };
    const scope = crmLeadScopeFilter(user);
    if (scope) Object.assign(filter, scope);

    const leads = await CrmLeadModel.find(filter).sort({ createdAt: -1 }).lean();

    const row = (l: (typeof leads)[number]) => ({
      id: String(l._id),
      leadId: l.leadId,
      name: l.name,
      phone: l.phone,
      whatsappNumber: l.whatsappNumber,
      destination: l.destination,
      status: l.status,
      assignedTo: l.assignedTo,
      nextFollowUpAt: l.nextFollowUpAt,
      lastCustomerReplyAt: l.lastCustomerReplyAt,
      createdAt: l.createdAt,
    });

    const overdue: ReturnType<typeof row>[] = [];
    const today: ReturnType<typeof row>[] = [];
    const upcoming: ReturnType<typeof row>[] = [];
    const noResponse: ReturnType<typeof row>[] = [];

    for (const l of leads) {
      const bucket = followUpBucket(l.nextFollowUpAt);
      if (bucket === "overdue") overdue.push(row(l));
      else if (bucket === "today") today.push(row(l));
      else if (bucket === "upcoming") upcoming.push(row(l));
      if (isNoResponse(l)) noResponse.push(row(l));
    }

    // Overdue/today/upcoming: soonest due first. No response: longest
    // silent first (oldest reply/creation first) — the ones needing
    // attention most urgently float to the top of each list.
    overdue.sort((a, b) => new Date(a.nextFollowUpAt!).getTime() - new Date(b.nextFollowUpAt!).getTime());
    today.sort((a, b) => new Date(a.nextFollowUpAt!).getTime() - new Date(b.nextFollowUpAt!).getTime());
    upcoming.sort((a, b) => new Date(a.nextFollowUpAt!).getTime() - new Date(b.nextFollowUpAt!).getTime());
    noResponse.sort(
      (a, b) =>
        new Date(a.lastCustomerReplyAt ?? a.createdAt).getTime() - new Date(b.lastCustomerReplyAt ?? b.createdAt).getTime()
    );

    return ok({ overdue, today, upcoming, noResponse });
  } catch (err) {
    return handleApiError(err);
  }
}
