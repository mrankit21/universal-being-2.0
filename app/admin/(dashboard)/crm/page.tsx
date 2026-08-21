"use client";

/**
 * Admin CRM — lead list: search, filters, status filtering, and a Kanban
 * board view (Phase 1 + assignment UX brought over from the old standalone
 * Leads page, which this now fully replaces — see admin-nav-config.ts).
 * One-click pipeline actions + Close Lead live on the lead detail page
 * (Phase 2, see StatusActionBar) — this page's job stays "find the right
 * lead fast, reassign it, or see the whole pipeline at a glance".
 */
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Search, Plus, AlertTriangle, CalendarClock, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, type Column } from "@/components/admin/data-table";
import { NewLeadDialog } from "@/components/admin/crm/new-lead-dialog";
import { SOURCE_DOT } from "@/components/admin/crm/source-badge";
import { STATUS_DOT } from "@/components/admin/crm/status-badge";
import { StatusFilter, type StatusFilterValue } from "@/components/admin/crm/status-filter";
import { SalespersonLeaderboard } from "@/components/admin/crm/leaderboard-strip";
import { LeadAssigneeSelect, type Salesperson } from "@/components/admin/lead-assignee-select";
import {
  CRM_LEAD_STATUS_LABELS,
  CRM_LEAD_SOURCES,
  CRM_LEAD_SOURCE_LABELS,
  type CrmLeadStatus,
  type CrmLeadSource,
} from "@/lib/crm/constants";

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
  // Unified with the "No Response > 2 Days" row folded into the same
  // dropdown as a selectable pseudo-status — see StatusFilter.
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const status: CrmLeadStatus | "all" = statusFilter === "no_response" ? "all" : statusFilter;
  const noResponseOnly = statusFilter === "no_response";
  const [source, setSource] = useState<CrmLeadSource | "all">("all");
  // "all" | "unassigned" | "me" | a specific salesperson's name.
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [me, setMe] = useState<{ name: string; role: string } | null>(null);
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((json) => json.success && setMe(json.data));
  }, []);

  const loadSalespeople = useCallback(() => {
    fetch("/api/admin/salespeople")
      .then((r) => r.json())
      .then((json) => json.success && setSalespeople(json.data));
  }, []);

  useEffect(() => {
    loadSalespeople();
  }, [loadSalespeople]);

  // A Sales Executive's results are already scoped to their own leads
  // server-side (lib/crm/scope.ts) regardless of this toggle, so the
  // "My Leads" chip is only shown for roles that otherwise see everyone
  // — Sales Manager / Super Admin — as a convenience filter.
  const isExecutive = me?.role === "sales_executive";
  const canReassign = me?.role !== "sales_executive";

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status !== "all") params.set("status", status);
    if (source !== "all") params.set("source", source);
    if (noResponseOnly) params.set("noResponse", "true");
    if (!isExecutive) {
      if (assigneeFilter === "unassigned") params.set("assignedTo", "unassigned");
      else if (assigneeFilter === "me" && me) params.set("assignedTo", me.name);
      else if (assigneeFilter !== "all") params.set("assignedTo", assigneeFilter);
    }
    const res = await fetch(`/api/admin/crm/leads?${params.toString()}`);
    const json = await res.json();
    if (json.success) setLeads(json.data);
    else toast.error(json.error);
    setLoading(false);
  }, [q, status, source, noResponseOnly, assigneeFilter, me, isExecutive]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce search typing
    return () => clearTimeout(t);
  }, [load]);

  const noResponseCount = leads.filter((l) => l.noResponse).length;

  async function handleAssign(lead: CrmLeadRow, name: string | null) {
    setAssigningId(lead.id);
    try {
      const res = await fetch(`/api/admin/crm/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo: name }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Could not reassign lead.");
        return;
      }
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, assignedTo: name ?? undefined } : l)));
    } finally {
      setAssigningId(null);
    }
  }

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
      header: "Source",
      cell: (l) => (
        <span className="inline-flex items-center gap-1.5 text-xs">
          <span className={`size-1.5 shrink-0 rounded-full ${SOURCE_DOT[l.source as CrmLeadSource] ?? "bg-muted-foreground"}`} />
          {CRM_LEAD_SOURCE_LABELS[l.source as CrmLeadSource] ?? l.source}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (l) => (
        <Badge className={`gap-1.5 ${STATUS_BADGE[l.status]}`}>
          <span className={`size-1.5 shrink-0 rounded-full ${STATUS_DOT[l.status]}`} />
          {CRM_LEAD_STATUS_LABELS[l.status]}
        </Badge>
      ),
    },
    {
      header: "Assigned to",
      cell: (l) =>
        canReassign ? (
          <LeadAssigneeSelect
            value={l.assignedTo}
            onAssign={(name) => handleAssign(l, name)}
            salespeople={salespeople}
            onSalespeopleChange={loadSalespeople}
            disabled={assigningId === l.id}
          />
        ) : (
          <span className={l.assignedTo ? "" : "text-muted-foreground"}>{l.assignedTo ?? "Unassigned"}</span>
        ),
    },
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">CRM</h1>
        <p className="text-sm text-muted-foreground">
          Sales pipeline — Meta, website, WhatsApp, and manual leads.
          {isExecutive ? " Showing your assigned leads." : null}
        </p>
      </div>

      {/* Action row — equal-width 3-up grid on phone (no more stacked
          full-width buttons eating vertical space); compact inline row,
          right-aligned, on tablet/laptop. Same markup, just re-flows. */}
      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:justify-end">
        <Link href="/admin/crm/dashboard" className="w-full sm:w-auto">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <LayoutDashboard className="size-4" /> Dashboard
          </Button>
        </Link>
        <Link href="/admin/crm/follow-ups" className="w-full sm:w-auto">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <CalendarClock className="size-4" /> Follow-ups
          </Button>
        </Link>
        <Button size="sm" className="w-full sm:w-auto" onClick={() => setNewLeadOpen(true)}>
          <Plus className="size-4" /> New Lead
        </Button>
      </div>

      {!isExecutive ? <SalespersonLeaderboard /> : null}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, lead ID…" className="pl-8" />
        </div>
        {!isExecutive ? (
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="h-9 w-44 text-sm">
              <SelectValue placeholder="Assigned to" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All leads</SelectItem>
              <SelectItem value="me">My Leads</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {salespeople.map((p) => (
                <SelectItem key={p._id} value={p.name}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <StatusFilter value={statusFilter} onChange={setStatusFilter} noResponseCount={noResponseCount} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Source:</span>
        <Button size="sm" variant={source === "all" ? "primary" : "outline"} onClick={() => setSource("all")}>
          All
        </Button>
        {CRM_LEAD_SOURCES.map((s) => (
          <Button key={s} size="sm" variant={source === s ? "primary" : "outline"} onClick={() => setSource(s)}>
            <span className={`mr-1.5 size-1.5 rounded-full ${SOURCE_DOT[s]}`} />
            {CRM_LEAD_SOURCE_LABELS[s]}
          </Button>
        ))}
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
