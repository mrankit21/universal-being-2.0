/**
 * Shared ingestion path for leads created automatically by an integration
 * (Meta now; website forms + WhatsApp are Phase 6 and will call this same
 * function). Centralizing this means dedupe, ID generation, round-robin
 * assignment, and activity logging only exist in one place — the manual
 * "New Lead" dialog (Phase 1) intentionally has its own simpler path in
 * the POST /api/admin/crm/leads route since a human is already there
 * making the assignment decision.
 */
import { CrmLeadModel, type CrmLeadDocument } from "@/lib/db/models/crm-lead.model";
import { generateLeadId } from "@/lib/crm/id";
import { logActivity } from "@/lib/crm/activity";
import { nextRoundRobinAssignee } from "@/lib/crm/round-robin";
import type { CrmLeadSource } from "@/lib/crm/constants";

export interface ExternalLeadInput {
  name: string;
  phone: string;
  whatsappNumber?: string;
  email?: string;
  source: CrmLeadSource;
  platform?: string;
  campaign?: string;
  campaignId?: string;
  adSet?: string;
  adSetId?: string;
  ad?: string;
  adId?: string;
  metaLeadId?: string; // dedupe key — only set for Meta-sourced leads
  metaCreatedTime?: string; // Meta's own event timestamp
  destination?: string;
  createdTime?: string; // the platform's own event time, if it has one
}

/** Creates a CrmLead from an automated source, or returns the existing
 * one untouched if `metaLeadId` was already seen — Meta can and does
 * redeliver the same webhook notification. Auto-assigns via round robin,
 * same as a manual lead with no assignee picked. Returns `{ lead,
 * created }` so the caller can log "already existed" vs "created". */
export async function ingestExternalLead(
  input: ExternalLeadInput
): Promise<{ id: string; leadId: string; created: boolean }> {
  if (input.metaLeadId) {
    const existing = await CrmLeadModel.findOne({ metaLeadId: input.metaLeadId }).lean();
    if (existing) return { id: String(existing._id), leadId: existing.leadId, created: false };
  }

  const now = new Date().toISOString();
  const leadId = await generateLeadId();
  const assignedTo = (await nextRoundRobinAssignee()) || undefined;

  let lead: CrmLeadDocument;
  try {
    lead = await CrmLeadModel.create({
      leadId,
      name: input.name || "Unknown",
      phone: input.phone || "",
      whatsappNumber: input.whatsappNumber || input.phone,
      email: input.email,
      destination: input.destination,
      source: input.source,
      platform: input.platform,
      campaign: input.campaign,
      campaignId: input.campaignId,
      adSet: input.adSet,
      adSetId: input.adSetId,
      ad: input.ad,
      adId: input.adId,
      metaLeadId: input.metaLeadId,
      metaCreatedTime: input.metaCreatedTime,
      status: "new",
      assignedTo,
      assignedAt: assignedTo ? now : undefined,
      lastActivityAt: now,
      // A customer submitting a lead form is, itself, their first "reply" —
      // there's no separate contact step yet, so this seeds
      // `lastCustomerReplyAt` rather than leaving it unset (which would
      // otherwise make a fresh lead immediately eligible for "No Response
      // > 2 Days" the moment 48 hours pass with nobody having called).
      lastCustomerReplyAt: input.createdTime || now,
    });
  } catch (err: unknown) {
    // Race: two concurrent webhook deliveries for the same metaLeadId
    // both passed the findOne check above before either finished
    // inserting. The unique sparse index on `metaLeadId` rejects the
    // second insert (Mongo error code 11000) — treat that exactly like
    // the dedupe check finding it, not as a failure.
    const isDuplicateKey = typeof err === "object" && err !== null && "code" in err && (err as { code?: number }).code === 11000;
    if (isDuplicateKey && input.metaLeadId) {
      const existing = await CrmLeadModel.findOne({ metaLeadId: input.metaLeadId }).lean();
      if (existing) return { id: String(existing._id), leadId: existing.leadId, created: false };
    }
    throw err;
  }

  await logActivity({
    leadId,
    type: "created",
    message: `Lead created via ${input.platform ? `${input.platform} (${input.source})` : input.source}${
      input.campaign ? ` — campaign "${input.campaign}"` : ""
    }`,
    actor: "System",
  });
  if (assignedTo) {
    await logActivity({ leadId, type: "assigned", message: `Auto-assigned to ${assignedTo} (round robin)`, actor: "System" });
  }

  return { id: String(lead._id), leadId, created: true };
}
