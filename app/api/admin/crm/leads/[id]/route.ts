/**
 * GET /api/admin/crm/leads/[id] — lead detail + its activity timeline.
 * PATCH /api/admin/crm/leads/[id] — updates status/assignment/follow-up/
 * notes/details. Every write that changes something meaningful also logs
 * a `CrmLeadActivity` row (see lib/crm/activity.ts) so the timeline stays
 * accurate without any route hand-building it.
 *
 * Phase 4: visibility + reassignment are now scoped by role (see
 * lib/crm/scope.ts) — a Sales Executive gets a 404 on a lead that isn't
 * theirs, and a 403 if they try to change `assignedTo` at all.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { CrmLeadModel } from "@/lib/db/models/crm-lead.model";
import { CrmLeadActivityModel } from "@/lib/db/models/crm-lead-activity.model";
import { updateCrmLeadSchema } from "@/lib/validators/crm-lead.schema";
import { logActivity, isNoResponse, followUpBucket } from "@/lib/crm/activity";
import { canAccessLead } from "@/lib/crm/scope";
import { CRM_LEAD_STATUS_LABELS } from "@/lib/crm/constants";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requirePermission("leads:read");
    await connectToDatabase();
    const { id } = await params;

    const lead = await CrmLeadModel.findById(id).lean();
    if (!lead) return fail("Lead not found", 404);
    // Sales Executives can't view a lead outside their own assignment —
    // 404 rather than 403 so it doesn't confirm the lead exists.
    if (!canAccessLead(user, lead.assignedTo)) return fail("Lead not found", 404);

    const timeline = await CrmLeadActivityModel.find({ leadId: lead.leadId }).sort({ createdAt: -1 }).lean();

    return ok({
      lead: {
        id: String(lead._id),
        ...lead,
        followUpBucket: followUpBucket(lead.nextFollowUpAt),
        noResponse: isNoResponse(lead),
      },
      timeline: timeline.map((t) => ({
        id: String(t._id),
        type: t.type,
        message: t.message,
        actor: t.actor,
        createdAt: t.createdAt,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requirePermission("leads:write");
    await connectToDatabase();
    const { id } = await params;

    const patch = updateCrmLeadSchema.parse(await req.json());
    const lead = await CrmLeadModel.findById(id);
    if (!lead) return fail("Lead not found", 404);
    if (!canAccessLead(user, lead.assignedTo)) return fail("Lead not found", 404);
    // Reassignment is a Sales Manager / Super Admin action — a Sales
    // Executive can update everything else on their own lead, but can't
    // hand it to someone else (or unassign it from themselves).
    if (user.role === "sales_executive" && patch.assignedTo !== undefined) {
      return fail("Only a Sales Manager or Admin can reassign a lead.", 403);
    }

    const now = new Date().toISOString();
    const set: Record<string, unknown> = { lastActivityAt: now };
    const unset: Record<string, ""> = {};

    if (patch.status && patch.status !== lead.status) {
      const from = lead.status;
      set.status = patch.status;
      if (patch.status !== "lost") set.lostReason = undefined;
      await logActivity({
        leadId: lead.leadId,
        type: "status_changed",
        message: `Status changed to ${CRM_LEAD_STATUS_LABELS[patch.status]}`,
        actor: user.name,
        meta: { from, to: patch.status },
      });
    }
    if (patch.status === "lost" && patch.lostReason) {
      set.lostReason = patch.lostReason;
    }

    if (patch.assignedTo !== undefined) {
      const isReassign = Boolean(lead.assignedTo);
      if (patch.assignedTo) {
        set.assignedTo = patch.assignedTo;
        set.assignedAt = now;
        await logActivity({
          leadId: lead.leadId,
          type: isReassign ? "reassigned" : "assigned",
          message: `${isReassign ? "Reassigned" : "Assigned"} to ${patch.assignedTo}`,
          actor: user.name,
        });
      } else {
        unset.assignedTo = "";
        unset.assignedAt = "";
      }
    }

    if (patch.nextFollowUpAt !== undefined) {
      if (patch.nextFollowUpAt) {
        set.nextFollowUpAt = patch.nextFollowUpAt;
        set.followUpStatus = "scheduled";
        await logActivity({
          leadId: lead.leadId,
          type: "follow_up_scheduled",
          message: `Follow-up scheduled for ${new Date(patch.nextFollowUpAt).toLocaleString("en-IN")}`,
          actor: user.name,
        });
      } else {
        unset.nextFollowUpAt = "";
        set.followUpStatus = "none";
      }
    }

    if (patch.note) {
      set.notes = lead.notes ? `${lead.notes}\n\n${patch.note}` : patch.note;
      await logActivity({ leadId: lead.leadId, type: "note_added", message: patch.note, actor: user.name });
    }

    for (const field of ["name", "phone", "whatsappNumber", "email", "destination", "travelTiming", "paxCount", "budget"] as const) {
      if (patch[field] !== undefined) set[field] = patch[field];
    }

    const update: Record<string, unknown> = { $set: set };
    if (Object.keys(unset).length) update.$unset = unset;

    const updated = await CrmLeadModel.findByIdAndUpdate(id, update, { new: true }).lean();
    return ok({ id: String(updated!._id), ...updated });
  } catch (err) {
    return handleApiError(err);
  }
}
