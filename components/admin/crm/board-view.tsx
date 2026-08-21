"use client";

/**
 * CrmBoardView — Kanban view for the CRM lead list page. Same data +
 * same PATCH endpoint (/api/admin/crm/leads/[id]) as the table view;
 * this is purely an alternate way to look at and move the same leads,
 * not a separate data source. Moving a card uses a small "Move to"
 * select rather than drag-and-drop, since Meta/website inbound leads
 * are the common case here and a keyboard/tap-friendly control is more
 * reliable across devices than drag targets on a horizontally-scrolling
 * board.
 */
import Link from "next/link";
import { AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { CRM_LEAD_STATUSES, CRM_LEAD_STATUS_LABELS, CRM_LEAD_SOURCE_LABELS, type CrmLeadStatus, type CrmLeadSource } from "@/lib/crm/constants";
import { SOURCE_DOT } from "./source-badge";

export interface CrmBoardLead {
  id: string;
  leadId: string;
  name: string;
  phone: string;
  destination?: string;
  source: string;
  status: CrmLeadStatus;
  assignedTo?: string;
  noResponse: boolean;
}

const COLUMN_ACCENT: Record<CrmLeadStatus, string> = {
  new: "border-t-slate-400",
  contacted: "border-t-sky-400",
  interested: "border-t-indigo-400",
  itinerary_sent: "border-t-violet-400",
  quotation_sent: "border-t-purple-400",
  payment_pending: "border-t-amber-400",
  booked: "border-t-emerald-400",
  trip_completed: "border-t-teal-400",
  lost: "border-t-rose-400",
};

export function CrmBoardView({
  leads,
  movingId,
  onMove,
}: {
  leads: CrmBoardLead[];
  movingId: string | null;
  onMove: (lead: CrmBoardLead, next: CrmLeadStatus) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {CRM_LEAD_STATUSES.map((status) => {
        const column = leads.filter((l) => l.status === status);
        return (
          <div key={status} className="w-72 shrink-0">
            <div className={`rounded-t-md border-t-2 bg-muted/40 px-3 py-2 ${COLUMN_ACCENT[status]}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{CRM_LEAD_STATUS_LABELS[status]}</span>
                <span className="rounded-full bg-background px-1.5 py-0.5 text-xs text-muted-foreground">{column.length}</span>
              </div>
            </div>
            <div className="flex min-h-[3rem] flex-col gap-2 rounded-b-md border border-t-0 border-border bg-muted/10 p-2">
              {column.length === 0 ? <p className="px-1 py-2 text-center text-xs text-muted-foreground">No leads</p> : null}
              {column.map((lead) => (
                <div key={lead.id} className="rounded-md border border-border bg-card p-2.5 shadow-sm">
                  <Link href={`/admin/crm/${lead.id}`} className="block hover:underline">
                    <div className="flex items-center gap-1.5">
                      <span className={`size-1.5 shrink-0 rounded-full ${SOURCE_DOT[lead.source as CrmLeadSource] ?? "bg-muted-foreground"}`} />
                      <span className="truncate text-sm font-medium">{lead.name}</span>
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{lead.leadId}</p>
                    {lead.destination ? <p className="mt-1 truncate text-xs text-muted-foreground">{lead.destination}</p> : null}
                  </Link>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="truncate text-[11px] text-muted-foreground">
                      {CRM_LEAD_SOURCE_LABELS[lead.source as CrmLeadSource] ?? lead.source} · {lead.assignedTo ?? "Unassigned"}
                    </span>
                    {lead.noResponse ? <AlertTriangle className="size-3 shrink-0 text-rose-600" /> : null}
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
                    <select
                      value={lead.status}
                      disabled={movingId === lead.id}
                      onChange={(e) => onMove(lead, e.target.value as CrmLeadStatus)}
                      className="h-6 w-full rounded border border-input bg-transparent px-1 text-[11px] outline-none disabled:opacity-50"
                    >
                      {CRM_LEAD_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {CRM_LEAD_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    {movingId === lead.id ? <Loader2 className="size-3 shrink-0 animate-spin text-muted-foreground" /> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
