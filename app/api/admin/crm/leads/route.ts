/**
 * GET /api/admin/crm/leads — list + search + filter for the CRM (Phase 1:
 * "Lead list ... Search ... Filters ... Basic status filtering").
 * POST /api/admin/crm/leads — manual lead creation.
 *
 * This is the new full-pipeline `CrmLead` collection — separate from the
 * older `/api/admin/leads` (Trip2Lead + PromoLead follow-up queue), which
 * is untouched by this route. See the comment on `CrmLeadModel` for why.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { CrmLeadModel } from "@/lib/db/models/crm-lead.model";
import { createCrmLeadSchema } from "@/lib/validators/crm-lead.schema";
import { generateLeadId } from "@/lib/crm/id";
import { logActivity, isNoResponse, followUpBucket } from "@/lib/crm/activity";
import { crmLeadScopeFilter } from "@/lib/crm/scope";
import { nextRoundRobinAssignee } from "@/lib/crm/round-robin";
import { ok, created, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";
import type { CrmLeadStatus } from "@/lib/crm/constants";

export async function GET(req: NextRequest) {
  try {
    const user = await requirePermission("leads:read");
    await connectToDatabase();

    const params = req.nextUrl.searchParams;
    const status = params.get("status") as CrmLeadStatus | null;
    const assignedTo = params.get("assignedTo");
    const source = params.get("source");
    const q = params.get("q")?.trim();
    const noResponse = params.get("noResponse") === "true";

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo === "unassigned" ? { $in: [null, undefined, ""] } : assignedTo;
    if (source) filter.source = source;
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { whatsappNumber: { $regex: q, $options: "i" } },
        { leadId: { $regex: q, $options: "i" } },
        { destination: { $regex: q, $options: "i" } },
      ];
    }

    // Sales Executives only ever see their own assigned leads — enforced
    // here, not just hidden in the UI, so a query param can't bypass it.
    // This overrides any `assignedTo` param they might send.
    const scope = crmLeadScopeFilter(user);
    if (scope) Object.assign(filter, scope);

    const leads = await CrmLeadModel.find(filter).sort({ createdAt: -1 }).limit(500).lean();

    // noResponse is a derived filter (see lib/crm/activity.ts), so it's
    // applied after the DB query rather than as a Mongo condition.
    const rows = (noResponse ? leads.filter((l) => isNoResponse(l)) : leads).map((l) => ({
      id: String(l._id),
      leadId: l.leadId,
      name: l.name,
      phone: l.phone,
      whatsappNumber: l.whatsappNumber,
      destination: l.destination,
      travelTiming: l.travelTiming,
      source: l.source,
      status: l.status,
      assignedTo: l.assignedTo,
      lastActivityAt: l.lastActivityAt,
      lastCustomerReplyAt: l.lastCustomerReplyAt,
      nextFollowUpAt: l.nextFollowUpAt,
      followUpBucket: followUpBucket(l.nextFollowUpAt),
      noResponse: isNoResponse(l),
      createdAt: l.createdAt,
    }));

    return ok(rows);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("leads:write");
    await connectToDatabase();

    const input = createCrmLeadSchema.parse(await req.json());
    if (!input.name || !input.phone) return fail("Name and phone are required.", 400);

    const now = new Date().toISOString();
    const leadId = await generateLeadId();

    // Auto Assignment / Round Robin: if the caller didn't name an
    // assignee (manual leads can, later phases' Meta/website/WhatsApp
    // leads won't), automatically hand it to the next salesperson in
    // rotation rather than leaving it unassigned — "AUTOMATIC whenever
    // possible" per the roadmap. Falls back to unassigned only if no
    // salespeople are configured yet.
    const assignedTo = input.assignedTo || (await nextRoundRobinAssignee()) || undefined;
    const autoAssigned = !input.assignedTo && Boolean(assignedTo);

    const lead = await CrmLeadModel.create({
      leadId,
      name: input.name,
      phone: input.phone,
      whatsappNumber: input.whatsappNumber || input.phone,
      email: input.email || undefined,
      destination: input.destination,
      travelTiming: input.travelTiming,
      paxCount: input.paxCount,
      budget: input.budget,
      source: input.source,
      platform: input.platform,
      notes: input.notes,
      status: "new",
      assignedTo,
      assignedAt: assignedTo ? now : undefined,
      lastActivityAt: now,
    });

    await logActivity({ leadId, type: "created", message: `Lead created (${input.source})`, actor: user.name });
    if (assignedTo) {
      await logActivity({
        leadId,
        type: "assigned",
        message: autoAssigned ? `Auto-assigned to ${assignedTo} (round robin)` : `Assigned to ${assignedTo}`,
        actor: autoAssigned ? "System" : user.name,
      });
    }

    return created({ id: String(lead._id), leadId, assignedTo });
  } catch (err) {
    return handleApiError(err);
  }
}
