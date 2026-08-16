"use client";

/**
 * CRM Dashboard — Phase 8 ("Dashboard + Analytics"). One page serves both
 * the roadmap's "Sales Executive Dashboard" and "Manager Dashboard" —
 * the numbers are already scoped server-side (see the dashboard API
 * route + lib/crm/scope.ts), so a Sales Executive sees their own totals
 * here and a Manager/Admin sees the team's; only the labels ("My" vs
 * plain) change client-side based on role.
 *
 * No charting library — matches the existing hand-rolled-SVG convention
 * (`components/admin/leads-trend-chart.tsx`); breakdown lists use plain
 * proportional bars instead of a pie/donut for the same reason.
 */
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Users, UserX, Clock, AlertTriangle, TrendingUp, IndianRupee, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

interface DashboardData {
  metrics: DashboardMetrics;
  leadsPerDay: { date: string; count: number }[];
  byPlatform: BreakdownRow[];
  byCampaign: BreakdownRow[];
  byDestination: BreakdownRow[];
  byExecutive: ExecutivePerformanceRow[];
}

function formatMoney(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

function MetricCard({ label, value, icon, tone }: { label: string; value: string | number; icon: ReactNode; tone?: "urgent" | "good" }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
            tone === "urgent" ? "bg-rose-100 text-rose-600" : tone === "good" ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground"
          }`}
        >
          {icon}
        </div>
        <div>
          <p className="text-xl font-semibold leading-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
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
      <div className="flex items-center gap-3">
        <Link href="/admin/crm">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1.5 size-4" /> Back to CRM
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{isExecutive ? "My Dashboard" : "CRM Dashboard"}</h1>
          <p className="text-sm text-muted-foreground">
            {isExecutive ? "Your leads, follow-ups, and performance." : "Business-wide leads, pipeline, and revenue."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label={my("Today's Leads")} value={m.todaysLeads} icon={<Users className="size-4" />} />
        <MetricCard label={my("New Leads")} value={m.newLeads} icon={<Users className="size-4" />} />
        {!isExecutive ? <MetricCard label="Assigned Leads" value={m.assignedLeads} icon={<Users className="size-4" />} /> : null}
        {!isExecutive ? <MetricCard label="Unassigned Leads" value={m.unassignedLeads} icon={<UserX className="size-4" />} /> : null}
        <MetricCard label={my("Today's Follow-ups")} value={m.todaysFollowUps} icon={<Clock className="size-4" />} />
        <MetricCard
          label={my("Overdue Follow-ups")}
          value={m.overdueFollowUps}
          icon={<CalendarClock className="size-4" />}
          tone={m.overdueFollowUps > 0 ? "urgent" : undefined}
        />
        <MetricCard
          label={my("No Response > 2 Days")}
          value={m.noResponse}
          icon={<AlertTriangle className="size-4" />}
          tone={m.noResponse > 0 ? "urgent" : undefined}
        />
        <MetricCard label={my("Interested Leads")} value={m.interestedLeads} icon={<Users className="size-4" />} />
        <MetricCard label={my("Payment Pending")} value={m.paymentPending} icon={<Clock className="size-4" />} />
        <MetricCard label={my("Booked Leads")} value={m.bookedLeads} icon={<TrendingUp className="size-4" />} tone="good" />
        <MetricCard label={my("Lost Leads")} value={m.lostLeads} icon={<UserX className="size-4" />} />
        <MetricCard label={my("Revenue")} value={formatMoney(m.revenue)} icon={<IndianRupee className="size-4" />} tone="good" />
        <MetricCard label={my("Conversion Rate")} value={`${m.conversionRate}%`} icon={<TrendingUp className="size-4" />} tone="good" />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{my("Leads per Day")} (last 14 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadsPerDayChart data={data.leadsPerDay} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <BreakdownList title={my("Leads by Platform")} rows={data.byPlatform} />
        <BreakdownList title={my("Leads by Destination")} rows={data.byDestination} />
        <BreakdownList title="Leads by Campaign" rows={data.byCampaign} showRevenue />
        <BreakdownList title="Revenue by Campaign" rows={[...data.byCampaign].sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0))} showRevenue />
      </div>

      {!isExecutive ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sales Executive Performance</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Executive</th>
                  <th className="py-2 pr-4 font-medium">Total Leads</th>
                  <th className="py-2 pr-4 font-medium">Booked</th>
                  <th className="py-2 pr-4 font-medium">Revenue</th>
                  <th className="py-2 font-medium">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {data.byExecutive.map((e) => (
                  <tr key={e.name} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{e.name}</td>
                    <td className="py-2 pr-4">{e.totalLeads}</td>
                    <td className="py-2 pr-4">{e.booked}</td>
                    <td className="py-2 pr-4">{formatMoney(e.revenue)}</td>
                    <td className="py-2">{e.conversionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
