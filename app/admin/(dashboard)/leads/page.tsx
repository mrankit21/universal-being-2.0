"use client";

/**
 * Admin Leads — follow-up queue for the two anonymous lead-capture forms
 * that write straight to the database with no admin view of their own:
 * "Let's Plan Your Trip" (Trip2Lead) and the site-wide coupon popup
 * (PromoLead). See app/api/admin/leads for how the two collections are
 * merged into one list, and app/api/admin/leads/stats for the analytics
 * numbers used below.
 */
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/admin/data-table";
import { LeadAssigneeSelect, type Salesperson } from "@/components/admin/lead-assignee-select";
import { LeadsTrendChart, type TrendPoint } from "@/components/admin/leads-trend-chart";

interface LeadRow {
  id: string;
  kind: "trip2" | "promo";
  name: string;
  whatsappNumber: string;
  detail: string;
  tripSlug?: string;
  source?: string;
  contacted: boolean;
  assignedTo?: string;
  createdAt: string;
}

interface LeadStats {
  daily: TrendPoint[];
  leaderboard: { name: string; assigned: number; contacted: number; contactRate: number }[];
  totals: { trip2: number; promo: number; total: number; contacted: number; contactRate: number; unassigned: number };
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "new", label: "Not contacted" },
  { key: "contacted", label: "Contacted" },
] as const;

// "Mon, 3 Aug · 6:08 pm" — day name + short date + time, instead of the
// locale default's ambiguous 3/8/2026 (day-first vs month-first is easy
// to misread when scanning a follow-up queue at a glance).
function formatReceived(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${day} · ${time}`;
}

export default function LeadsAdminPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("new");

  const loadLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter === "new") params.set("contacted", "false");
    if (filter === "contacted") params.set("contacted", "true");
    const res = await fetch(`/api/admin/leads?${params.toString()}`);
    const json = await res.json();
    if (json.success) setLeads(json.data);
    else toast.error(json.error);
    setLoading(false);
  }, [filter]);

  const loadSalespeople = useCallback(async () => {
    const res = await fetch("/api/admin/salespeople");
    const json = await res.json();
    if (json.success) setSalespeople(json.data);
  }, []);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/admin/leads/stats?days=30");
    const json = await res.json();
    if (json.success) setStats(json.data);
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    loadSalespeople();
    loadStats();
  }, [loadSalespeople, loadStats]);

  async function patchLead(lead: LeadRow, body: Record<string, unknown>) {
    setBusyId(lead.id);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}?kind=${lead.kind}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Could not update lead.");
        return;
      }
      loadLeads();
      loadStats();
    } finally {
      setBusyId(null);
    }
  }

  async function toggleContacted(lead: LeadRow) {
    await patchLead(lead, { contacted: !lead.contacted });
    toast.success(lead.contacted ? "Marked as not contacted." : "Marked as contacted.");
  }

  async function assignLead(lead: LeadRow, name: string | null) {
    await patchLead(lead, { assignedTo: name });
    toast.success(name ? `Assigned to ${name}.` : "Unassigned.");
  }

  const columns: Column<LeadRow>[] = [
    {
      header: "Type",
      cell: (l) => (
        <Badge className={l.kind === "trip2" ? "bg-sky-100 text-sky-800 hover:bg-sky-100" : "bg-amber-100 text-amber-800 hover:bg-amber-100"}>
          {l.kind === "trip2" ? "Trip enquiry" : "Coupon popup"}
        </Badge>
      ),
    },
    { header: "Name", cell: (l) => l.name },
    {
      header: "WhatsApp",
      cell: (l) => (
        <a
          href={`https://wa.me/${l.whatsappNumber.replace(/[^\d]/g, "")}`}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-xs text-primary hover:underline"
        >
          {l.whatsappNumber}
        </a>
      ),
    },
    { header: "Details", cell: (l) => <span className="text-muted-foreground">{l.detail}</span> },
    {
      header: "Trip page",
      cell: (l) =>
        l.tripSlug ? (
          <Link href={`/trip2/${l.tripSlug}`} target="_blank" className="text-xs text-primary hover:underline">
            {l.tripSlug}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      header: "Assigned to",
      cell: (l) => (
        <LeadAssigneeSelect
          value={l.assignedTo}
          onAssign={(name) => assignLead(l, name)}
          salespeople={salespeople}
          onSalespeopleChange={loadSalespeople}
          disabled={busyId === l.id}
        />
      ),
    },
    { header: "Received", cell: (l) => <span className="whitespace-nowrap">{formatReceived(l.createdAt)}</span> },
    {
      header: "",
      cell: (l) => (
        <Button size="sm" variant={l.contacted ? "outline" : "primary"} onClick={() => toggleContacted(l)} disabled={busyId === l.id}>
          {l.contacted ? "Mark not contacted" : "Mark contacted"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
        <p className="text-sm text-muted-foreground">
          Callback requests from &ldquo;Let&rsquo;s Plan Your Trip&rdquo; and the coupon popup.
        </p>
      </div>

      {stats ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Leads received — last 30 days</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadsTrendChart data={stats.daily} />
              <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                <div>
                  <p className="text-lg font-semibold">{stats.totals.total}</p>
                  <p className="text-muted-foreground">Total leads</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{stats.totals.contactRate}%</p>
                  <p className="text-muted-foreground">Contacted</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{stats.totals.unassigned}</p>
                  <p className="text-muted-foreground">Unassigned</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <Trophy className="size-4" /> Salesperson leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.leaderboard.length === 0 ? (
                <p className="text-xs text-muted-foreground">No leads assigned yet.</p>
              ) : (
                stats.leaderboard.map((row, i) => (
                  <div key={row.name} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 truncate">
                      <span className="w-4 shrink-0 text-xs text-muted-foreground">{i + 1}.</span>
                      <span className="truncate">{row.name}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {row.assigned} lead{row.assigned === 1 ? "" : "s"} · {row.contactRate}% contacted
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <Button key={f.key} size="sm" variant={filter === f.key ? "primary" : "outline"} onClick={() => setFilter(f.key)}>
            {f.label}
          </Button>
        ))}
      </div>
      <DataTable columns={columns} rows={leads} loading={loading} rowKey={(l) => `${l.kind}-${l.id}`} emptyMessage="No leads here." />
    </div>
  );
}
