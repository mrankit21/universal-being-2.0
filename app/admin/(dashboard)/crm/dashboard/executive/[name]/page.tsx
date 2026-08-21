"use client";

/**
 * Sales Executive detail — the deep-dive behind one card on the CRM
 * Dashboard's "Sales Executive Performance" grid. Answers exactly what
 * a manager asks day to day: how many leads did they pick up today,
 * how did each month go, how many actually turned into a sale, and
 * *when* did each of those sales close.
 *
 * Colorful and card-heavy on purpose (per request) — this is a
 * dashboard people check daily, so it's built to be scannable and
 * pleasant, not another dense data table.
 */
import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Users, TrendingUp, IndianRupee, CalendarClock, AlertTriangle, Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { themeFor, initialsFor } from "@/components/admin/crm/executive-theme";
import { STATUS_DOT } from "@/components/admin/crm/status-badge";
import { SOURCE_DOT } from "@/components/admin/crm/source-badge";
import { CRM_LEAD_STATUS_LABELS, type CrmLeadStatus, type CrmLeadSource } from "@/lib/crm/constants";
import type { ExecutiveDetail } from "@/lib/crm/executive-performance";

function formatMoney(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

function StatChip({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`border-0 shadow-ub-sm ${className ?? ""}`}>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/70">{icon}</div>
        <div>
          <p className="text-lg font-bold leading-tight">{value}</p>
          <p className="text-xs opacity-80">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MonthlyBarChart({ data, theme }: { data: ExecutiveDetail["monthly"]; theme: ReturnType<typeof themeFor> }) {
  const max = Math.max(1, ...data.map((d) => d.leads));
  return (
    <div className="flex items-end justify-between gap-3 px-1">
      {data.map((d) => (
        <div key={d.month} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="relative flex h-28 w-full items-end justify-center">
            <div className="w-full max-w-8 overflow-hidden rounded-t-md bg-muted" style={{ height: "100%" }}>
              <div
                className={`w-full rounded-t-md bg-gradient-to-t ${theme.gradient}`}
                style={{ height: `${(d.leads / max) * 100}%`, marginTop: `${100 - (d.leads / max) * 100}%` }}
                title={`${d.month}: ${d.leads} leads, ${d.booked} booked`}
              />
            </div>
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">{d.month}</span>
          <span className="text-[10px] font-semibold">{d.leads}</span>
        </div>
      ))}
    </div>
  );
}

export default function ExecutiveDetailPage() {
  const params = useParams<{ name: string }>();
  const name = decodeURIComponent(params.name);
  const [data, setData] = useState<ExecutiveDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/crm/dashboard/executive/${encodeURIComponent(name)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
        else {
          setError(json.error ?? "Could not load this executive's performance.");
          toast.error(json.error);
        }
      })
      .finally(() => setLoading(false));
  }, [name]);

  if (loading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>;
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link href="/admin/crm/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1.5 size-4" /> Back to Dashboard
          </Button>
        </Link>
        <p className="py-10 text-center text-sm text-muted-foreground">{error ?? "Not found."}</p>
      </div>
    );
  }

  const theme = themeFor(data.name);

  return (
    <div className="space-y-6">
      <Link href="/admin/crm/dashboard">
        <Button variant="outline" size="sm">
          <ArrowLeft className="mr-1.5 size-4" /> Back to Dashboard
        </Button>
      </Link>

      {/* Header — gradient banner with avatar, matches this executive's
          color everywhere else in the CRM. */}
      <Card className="overflow-hidden border-0 shadow-ub-md">
        <div className={`bg-gradient-to-br ${theme.gradient} px-5 py-6 text-white`}>
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-white/20 text-xl font-bold ring-2 ring-white/40">
              {initialsFor(data.name)}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{data.name}</h1>
              <p className="flex items-center gap-1.5 text-sm opacity-90">
                <Sparkles className="size-3.5" /> {data.conversionRate}% conversion · {formatMoney(data.revenue)} revenue
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Today / week / month — "kitni lead aaj uthayi". */}
      <div className="grid grid-cols-3 gap-3">
        <StatChip label="Today's Leads" value={data.todaysLeads} icon={<Users className={`size-4 ${theme.text}`} />} className={theme.soft} />
        <StatChip label="This Week" value={data.thisWeekLeads} icon={<Users className={`size-4 ${theme.text}`} />} className={theme.soft} />
        <StatChip label="This Month" value={data.thisMonthLeads} icon={<Users className={`size-4 ${theme.text}`} />} className={theme.soft} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatChip label="Total Leads" value={data.totalLeads} icon={<Users className="size-4 text-slate-600" />} className="bg-slate-50" />
        <StatChip label="Booked" value={data.booked} icon={<TrendingUp className="size-4 text-emerald-600" />} className="bg-emerald-50" />
        <StatChip label="Revenue" value={formatMoney(data.revenue)} icon={<IndianRupee className="size-4 text-amber-600" />} className="bg-amber-50" />
        <StatChip
          label="Overdue Follow-ups"
          value={data.overdueFollowUps}
          icon={<CalendarClock className="size-4 text-rose-600" />}
          className="bg-rose-50"
        />
      </div>

      {/* Monthly trend — "kis kis month mein kitni lead uthayi". */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Monthly Activity (last 6 months)</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyBarChart data={data.monthly} theme={theme} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Current pipeline mix. */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {data.statusMix.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">No leads yet.</p>
            ) : (
              data.statusMix.map((s) => {
                const max = Math.max(...data.statusMix.map((x) => x.count));
                return (
                  <div key={s.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className={`size-2 rounded-full ${STATUS_DOT[s.status as CrmLeadStatus] ?? "bg-muted-foreground"}`} />
                        {CRM_LEAD_STATUS_LABELS[s.status as CrmLeadStatus] ?? s.status}
                      </span>
                      <span className="text-muted-foreground">{s.count}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${STATUS_DOT[s.status as CrmLeadStatus] ?? "bg-primary"}`}
                        style={{ width: `${(s.count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Conversion timing — "kitni lead mein se final baat bani, kis time". */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm font-medium">
              <Trophy className="size-4 text-amber-500" /> Recent Sales
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {data.recentConversions.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No conversions yet.</p>
            ) : (
              data.recentConversions.map((c) => (
                <Link key={c.id} href={`/admin/crm/${c.id}`} className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="truncate font-medium">{c.name}</span>
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{c.leadId}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.destination ?? "—"} {c.amountPaid ? `· ${formatMoney(c.amountPaid)}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-[11px] text-muted-foreground">
                    <div>{formatDay(c.at)}</div>
                    <div>{formatTime(c.at)}</div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {data.noResponse > 0 ? (
        <Card className="border-0 bg-rose-50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="size-5 shrink-0 text-rose-600" />
            <p className="text-sm text-rose-700">
              <span className="font-semibold">{data.noResponse}</span> lead{data.noResponse === 1 ? "" : "s"} with no customer response in over 2 days.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* Recent assignments — "kis din kitni lead kisko assigned hui". */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Recently Assigned Leads</CardTitle>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {data.recentAssignments.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No leads assigned yet.</p>
          ) : (
            data.recentAssignments.map((a) => (
              <Link key={a.id} href={`/admin/crm/${a.id}`} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent">
                <span className={`size-1.5 shrink-0 rounded-full ${SOURCE_DOT[a.source as CrmLeadSource] ?? "bg-muted-foreground"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="truncate font-medium">{a.name}</span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">{a.leadId}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right text-xs text-muted-foreground">
                  <div>{formatDay(a.at)}</div>
                  <div>{formatTime(a.at)}</div>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
