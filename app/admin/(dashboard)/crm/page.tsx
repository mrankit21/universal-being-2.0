"use client";

/**
 * Admin CRM — lead list: search, filters, basic status filtering (Phase
 * 1). One-click pipeline actions + Close Lead live on the lead detail
 * page (Phase 2, see StatusActionBar) — this page's job stays "find the
 * right lead fast".
 *
 * Deliberately a separate section from the pre-existing "Leads" page
 * (/admin/leads, Trip2Lead + PromoLead) — see the comment on
 * CrmLeadModel for why they're not merged yet.
 */
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Search, Plus, AlertTriangle, CalendarClock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/admin/data-table";
import { NewLeadDialog } from "@/components/admin/crm/new-lead-dialog";
import { CRM_LEAD_STATUSES, CRM_LEAD_STATUS_LABELS, type CrmLeadStatus } from "@/lib/crm/constants";

interface CrmLeadRow {
  id: string;
  leadId: string;
  name: string;
  phone: string;
  whatsappNumber?: string;
  destination?: string;
  source: string;
  status: CrmLeadStatus;
  assignedTo?: string;
  nextFollowUpAt?: string;
  followUpBucket: "none" | "overdue" | "today" | "upcoming";
  noResponse: boolean;
  createdAt: string;
}

const STATUS_BADGE: Record<CrmLeadStatus, string> = {
  new: "bg-slate-100 text-slate-800 hover:bg-slate-100",
  contacted: "bg-sky-100 text-sky-800 hover:bg-sky-100",
  interested: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100",
  itinerary_sent: "bg-violet-100 text-violet-800 hover:bg-violet-100",
  quotation_sent: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  payment_pending: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  booked: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  trip_completed: "bg-teal-100 text-teal-800 hover:bg-teal-100",
  lost: "bg-rose-100 text-rose-800 hover:bg-rose-100",
};

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + " · " + d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function CrmLeadsPage() {
  const [leads, setLeads] = useState<CrmLeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<CrmLeadStatus | "all">("all");
  const [noResponseOnly, setNoResponseOnly] = useState(false);
  const [myLeadsOnly, setMyLeadsOnly] = useState(false);
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [me, setMe] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((json) => json.success && setMe(json.data));
  }, []);

  // A Sales Executive's results are already scoped to their own leads
  // server-side (lib/crm/scope.ts) regardless of this toggle, so the
  // "My Leads" chip is only shown for roles that otherwise see everyone
  // — Sales Manager / Super Admin — as a convenience filter.
  const isExecutive = me?.role === "sales_executive";

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status !== "all") params.set("status", status);
    if (noResponseOnly) params.set("noResponse", "true");
    if (myLeadsOnly && me && !isExecutive) params.set("assignedTo", me.name);
    const res = await fetch(`/api/admin/crm/leads?${params.toString()}`);
    const json = await res.json();
    if (json.success) setLeads(json.data);
    else toast.error(json.error);
    setLoading(false);
  }, [q, status, noResponseOnly, myLeadsOnly, me, isExecutive]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce search typing
    return () => clearTimeout(t);
  }, [load]);

  const noResponseCount = leads.filter((l) => l.noResponse).length;

  const columns: Column<CrmLeadRow>[] = [
    {
      header: "Lead",
      cell: (l) => (
        <Link href={`/admin/crm/${l.id}`} className="hover:underline">
          <span className="font-medium">{l.name}</span>
          <span className="ml-1.5 font-mono text-xs text-muted-foreground">{l.leadId}</span>
        </Link>
      ),
    },
    {
      header: "Contact",
      cell: (l) => (
        <a
          href={`https://wa.me/${(l.whatsappNumber ?? l.phone).replace(/[^\d]/g, "")}`}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-xs text-primary hover:underline"
        >
          {l.phone}
        </a>
      ),
    },
    { header: "Destination", cell: (l) => <span className="text-muted-foreground">{l.destination ?? "—"}</span> },
    {
      header: "Status",
      cell: (l) => <Badge className={STATUS_BADGE[l.status]}>{CRM_LEAD_STATUS_LABELS[l.status]}</Badge>,
    },
    { header: "Assigned to", cell: (l) => <span className={l.assignedTo ? "" : "text-muted-foreground"}>{l.assignedTo ?? "Unassigned"}</span> },
    {
      header: "Follow-up",
      cell: (l) =>
        l.followUpBucket === "none" ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span
            className={
              l.followUpBucket === "overdue"
                ? "font-medium text-rose-600"
                : l.followUpBucket === "today"
                  ? "font-medium text-amber-600"
                  : "text-muted-foreground"
            }
          >
            {formatDate(l.nextFollowUpAt)}
          </span>
        ),
    },
    {
      header: "",
      cell: (l) =>
        l.noResponse ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600">
            <AlertTriangle className="size-3.5" /> No response
          </span>
        ) : null,
    },
    { header: "Received", cell: (l) => <span className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(l.createdAt)}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">CRM</h1>
          <p className="text-sm text-muted-foreground">
            Sales pipeline — Meta, website, WhatsApp, and manual leads.
            {isExecutive ? " Showing your assigned leads." : null}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/crm/follow-ups">
            <Button variant="outline">
              <CalendarClock className="mr-1.5 size-4" /> Follow-ups
            </Button>
          </Link>
          <Button onClick={() => setNewLeadOpen(true)}>
            <Plus className="mr-1.5 size-4" /> New Lead
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, lead ID…" className="pl-8" />
        </div>
        {!isExecutive ? (
          <Button size="sm" variant={myLeadsOnly ? "primary" : "outline"} onClick={() => setMyLeadsOnly((v) => !v)}>
            <User className="mr-1 size-3.5" /> My Leads
          </Button>
        ) : null}
        <Button size="sm" variant={status === "all" ? "primary" : "outline"} onClick={() => setStatus("all")}>
          All
        </Button>
        {CRM_LEAD_STATUSES.map((s) => (
          <Button key={s} size="sm" variant={status === s ? "primary" : "outline"} onClick={() => setStatus(s)}>
            {CRM_LEAD_STATUS_LABELS[s]}
          </Button>
        ))}
        <Button
          size="sm"
          variant={noResponseOnly ? "primary" : "outline"}
          onClick={() => setNoResponseOnly((v) => !v)}
          className={noResponseOnly ? "" : "text-rose-600"}
        >
          <AlertTriangle className="mr-1 size-3.5" /> No Response &gt; 2 Days {noResponseCount > 0 ? `(${noResponseCount})` : ""}
        </Button>
      </div>

      <DataTable columns={columns} rows={leads} loading={loading} rowKey={(l) => l.id} emptyMessage="No leads found." />

      <NewLeadDialog
        open={newLeadOpen}
        onOpenChange={setNewLeadOpen}
        onCreated={() => {
          setNewLeadOpen(false);
          load();
        }}
      />
    </div>
  );
}
