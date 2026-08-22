"use client";

/**
 * CRM Dashboard — Phase 8 ("Dashboard + Analytics"). One page serves both
 * the roadmap's "Sales Executive Dashboard" and "Manager Dashboard" —
 * the numbers are already scoped server-side (see the dashboard API
 * route + lib/crm/scope.ts), so a Sales Executive sees their own totals
 * here and a Manager/Admin sees the team's; only the labels ("My" vs
 * plain) change client-side based on role.
 *
 * Every panel here — including the metrics — renders as a compact list
 * (icon + label + value rows in a Card, divided by hairlines) rather than
 * big standalone boxes. That keeps the whole page scannable in one
 * consistent rhythm on both phone and laptop, instead of a wall of large
 * tiles that mostly show whitespace around a single number.
 *
 * No charting library — matches the existing hand-rolled-SVG convention
 * (`components/admin/leads-trend-chart.tsx`); breakdown lists use plain
 * proportional bars instead of a pie/donut for the same reason.
 */
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Users,
  UserX,
  Clock,
  AlertTriangle,
  TrendingUp,
  IndianRupee,
  CalendarClock,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CRM_LEAD_STATUS_LABELS, type CrmLeadStatus, type CrmLeadSource } from "@/lib/crm/constants";
import { STATUS_DOT } from "@/components/admin/crm/status-badge";
import { SOURCE_DOT } from "@/components/admin/crm/source-badge";
import { ExecutiveCard } from "@/components/admin/crm/executive-card";
import type { ExecutiveSummaryCard } from "@/lib/crm/executive-performance";

interface DashboardMetrics {
  todaysLeads: number;
  newLeads: number;
  assignedLeads: number;
  unassignedLeads: number;
  todaysFollowUps: number;
  overdueFollowUps: number;
  noResponse: number;
  interestedLeads: number;
  paymentPending: number;
  bookedLeads: number;
  tripCompleted: number;
  lostLeads: number;
  revenue: number;
  totalLeads: number;
  conversionRate: number;
}

interface BreakdownRow {
  label: string;
  count: number;
  revenue?: number;
}

interface ExecutivePerformanceRow {
  name: string;
  totalLeads: number;
  booked: number;
  revenue: number;
  conversionRate: number;
}

interface AssignmentActivityRow {
  id: string;
  leadId: string;
  name: string;
  assignedTo: string;
  source: string;
  status: string;
  at: string;
}

interface DashboardData {
  metrics: DashboardMetrics;
  leadsPerDay: { date: string; count: number }[];
  byPlatform: BreakdownRow[];
  byCampaign: BreakdownRow[];
  byDestination: BreakdownRow[];
  byExecutive: ExecutivePerformanceRow[];
  recentAssignments: AssignmentActivityRow[];
}

function formatMoney(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

/** One row inside a StatListCard — icon, label, value. This replaces the
 * old standalone MetricCard boxes; several of these stacked in one Card
 * read as a single compact list instead of a grid of tiles. */
function StatRow({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone?: "urgent" | "good";
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
            tone === "urgent" ? "bg-rose-100 text-rose-600" : tone === "good" ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground"
          }`}
        >
          {icon}
        </div>
        <span className="truncate text-sm text-muted-foreground">{label}</span>
      </div>
      <span className={`shrink-0 text-sm font-semibold ${tone === "urgent" ? "text-rose-600" : ""}`}>{value}</span>
    </div>
  );
}

function StatListCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="divide-y p-0">{children}</CardContent>
    </Card>
  );
}

function BreakdownList({ title, rows, showRevenue }: { title: string; rows: BreakdownRow[]; showRevenue?: boolean }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {rows.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">No data yet.</p>
        ) : (
          rows.map((r) => (
            <div key={r.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate font-medium">{r.label}</span>
                <span className="shrink-0 text-muted-foreground">
                  {r.count} {showRevenue && r.revenue ? `· ${formatMoney(r.revenue)}` : ""}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(r.count / max) * 100}%` }} />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

/** Lead assignment activity — "which lead, assigned to whom, on which
 * day and at what time". A flat list is deliberate here (matches the
 * rest of the page): each row is one assignment event, most recent
 * first, so a manager can scan today's assignment activity at a glance
 * without opening every lead. */
function AssignmentActivityList({ rows }: { rows: AssignmentActivityRow[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Lead Assignment Activity</CardTitle>
      </CardHeader>
      <CardContent className="divide-y p-0">
        {rows.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">No assignments yet.</p>
        ) : (
          rows.map((r) => (
            <Link
              key={r.id}
              href={`/admin/crm/${r.id}`}
              className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-accent"
            >
              <span
                className={`size-2 shrink-0 rounded-full ${STATUS_DOT[r.status as CrmLeadStatus] ?? "bg-muted-foreground"}`}
                title={CRM_LEAD_STATUS_LABELS[r.status as CrmLeadStatus] ?? r.status}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="truncate font-medium">{r.name}</span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">{r.leadId}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                  <UserCheck className="size-3 shrink-0" />
                  <span className="truncate">assigned to {r.assignedTo}</span>
                  <span
                    className={`ml-1 size-1.5 shrink-0 rounded-full ${SOURCE_DOT[r.source as CrmLeadSource] ?? "bg-muted-foreground"}`}
                  />
                </div>
              </div>
              <div className="shrink-0 text-right text-xs text-muted-foreground">
                <div>{formatDay(r.at)}</div>
                <div>{formatTime(r.at)}</div>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function LeadsPerDayChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const width = 100;
  const height = 32;
  const barWidth = data.length ? width / data.length : 0;
  const gap = barWidth * 0.25;
  return (
    <svg viewBox={`0 0 ${width} ${height + 4}`} className="h-32 w-full" preserveAspectRatio="none">
      {data.map((d, i) => {
        const h = (d.count / max) * height;
        const x = i * barWidth + gap / 2;
        const w = barWidth - gap;
        return (
          <g key={d.date}>
            <rect x={x} y={height - h} width={w} height={h} rx={0.6} className="fill-primary" />
            <title>{`${d.date}: ${d.count}`}</title>
          </g>
        );
      })}
    </svg>
  );
}

export default function CrmDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [executives, setExecutives] = useState<ExecutiveSummaryCard[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/crm/dashboard")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
        else toast.error(json.error);
      })
      .finally(() => setLoading(false));
    fetch("/api/admin/crm/dashboard/executives")
      .then((r) => r.json())
      .then((json) => json.success && setExecutives(json.data));
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((json) => json.success && setMe(json.data));
  }, []);

  const isExecutive = me?.role === "sales_executive";
  const my = (label: string) => (isExecutive ? `My ${label}` : label);

  if (loading || !data) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>;
  }

  const m = data.metrics;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/crm">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1.5 size-4" /> Back to CRM
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight">{isExecutive ? "My Dashboard" : "CRM Dashboard"}</h1>
          <p className="text-sm text-muted-foreground">
            {isExecutive ? "Your leads, follow-ups, and performance." : "Business-wide leads, pipeline, and revenue."}
          </p>
        </div>
        {isExecutive && me ? (
          <Link href={`/admin/crm/dashboard/executive/${encodeURIComponent(me.name)}`}>
            <Button variant="outline" size="sm">
              Monthly activity & sales timing
            </Button>
          </Link>
        ) : null}
      </div>

      {!isExecutive && executives && executives.length > 0 ? (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Sales Executive Performance</h2>
            <span className="text-xs text-muted-foreground">Tap a card for the full breakdown</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {executives.map((e, i) => (
              <ExecutiveCard key={e.name} row={e} rank={i + 1} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Metrics — three short lists instead of a dozen big tiles. Same
          numbers as before, grouped by what they're about. */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatListCard title={my("Leads")}>
          <StatRow label={my("Today's Leads")} value={m.todaysLeads} icon={<Users className="size-4" />} />
          <StatRow label={my("New Leads")} value={m.newLeads} icon={<Users className="size-4" />} />
          {!isExecutive ? <StatRow label="Assigned Leads" value={m.assignedLeads} icon={<UserCheck className="size-4" />} /> : null}
          {!isExecutive ? <StatRow label="Unassigned Leads" value={m.unassignedLeads} icon={<UserX className="size-4" />} /> : null}
        </StatListCard>

        <StatListCard title="Follow-ups & Response">
          <StatRow label={my("Today's Follow-ups")} value={m.todaysFollowUps} icon={<Clock className="size-4" />} />
          <StatRow
            label={my("Overdue Follow-ups")}
            value={m.overdueFollowUps}
            icon={<CalendarClock className="size-4" />}
            tone={m.overdueFollowUps > 0 ? "urgent" : undefined}
          />
          <StatRow
            label={my("No Response > 2 Days")}
            value={m.noResponse}
            icon={<AlertTriangle className="size-4" />}
            tone={m.noResponse > 0 ? "urgent" : undefined}
          />
        </StatListCard>

        <StatListCard title="Pipeline & Revenue">
          <StatRow label={my("Interested Leads")} value={m.interestedLeads} icon={<Users className="size-4" />} />
          <StatRow label={my("Payment Pending")} value={m.paymentPending} icon={<Clock className="size-4" />} />
          <StatRow label={my("Booked Leads")} value={m.bookedLeads} icon={<TrendingUp className="size-4" />} tone="good" />
          <StatRow label={my("Lost Leads")} value={m.lostLeads} icon={<UserX className="size-4" />} />
          <StatRow label={my("Revenue")} value={formatMoney(m.revenue)} icon={<IndianRupee className="size-4" />} tone="good" />
          <StatRow label={my("Conversion Rate")} value={`${m.conversionRate}%`} icon={<TrendingUp className="size-4" />} tone="good" />
        </StatListCard>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{my("Leads per Day")} (last 14 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadsPerDayChart data={data.leadsPerDay} />
        </CardContent>
      </Card>

      {/* Which lead, assigned to whom, which day, what time — the
          assignment activity feed. */}
      <AssignmentActivityList rows={data.recentAssignments} />

      <div className="grid gap-4 md:grid-cols-2">
        <BreakdownList title={my("Leads by Platform")} rows={data.byPlatform} />
        <BreakdownList title={my("Leads by Destination")} rows={data.byDestination} />
        <BreakdownList title="Leads by Campaign" rows={data.byCampaign} showRevenue />
        <BreakdownList title="Revenue by Campaign" rows={[...data.byCampaign].sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0))} showRevenue />
      </div>
    </div>
  );
}
