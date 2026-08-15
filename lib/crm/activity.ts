/**
 * Single choke point for writing to `CrmLeadActivityModel` (see the
 * comment on that model for why this matters) plus the small derived-state
 * helpers ("No Response > 2 Days", follow-up bucket) that read
 * `lastActivityAt` / `lastCustomerReplyAt` / `nextFollowUpAt` without ever
 * needing a stored "isOverdue" flag that could drift out of sync.
 */
import { CrmLeadActivityModel, type CrmLeadActivityType } from "@/lib/db/models/crm-lead-activity.model";
import { CRM_NO_RESPONSE_HOURS } from "@/lib/crm/constants";

export async function logActivity(params: {
  leadId: string;
  type: CrmLeadActivityType;
  message: string;
  actor?: string;
  meta?: Record<string, unknown>;
}) {
  await CrmLeadActivityModel.create({
    leadId: params.leadId,
    type: params.type,
    message: params.message,
    actor: params.actor,
    meta: params.meta,
    createdAt: new Date().toISOString(),
  });
}

/** True once >= CRM_NO_RESPONSE_HOURS have passed since the customer's
 * last reply. A lead with no reply on record yet (brand new, or contacted
 * but never replied) is measured from lead creation instead — same idea,
 * just no reply to anchor on yet. Leads already in a terminal state
 * (booked/trip_completed/lost) are never "no response". */
export function isNoResponse(lead: {
  status: string;
  createdAt: string;
  lastCustomerReplyAt?: string;
}): boolean {
  if (["booked", "trip_completed", "lost"].includes(lead.status)) return false;
  const anchor = lead.lastCustomerReplyAt ?? lead.createdAt;
  const hoursSince = (Date.now() - new Date(anchor).getTime()) / (1000 * 60 * 60);
  return hoursSince >= CRM_NO_RESPONSE_HOURS;
}

export type FollowUpBucket = "none" | "overdue" | "today" | "upcoming";

/** Derives which follow-up bucket a lead falls into purely from
 * `nextFollowUpAt`, computed at read time rather than stored — so an
 * "overdue" lead automatically stops being overdue the moment its date is
 * pushed out, with no separate write needed to fix a stale flag. */
export function followUpBucket(nextFollowUpAt?: string): FollowUpBucket {
  if (!nextFollowUpAt) return "none";
  const due = new Date(nextFollowUpAt);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  if (due.getTime() < startOfToday.getTime()) return "overdue";
  if (due.getTime() < startOfTomorrow.getTime()) return "today";
  return "upcoming";
}
