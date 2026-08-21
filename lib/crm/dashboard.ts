/**
 * Dashboard + Analytics — Phase 8. All queries here are scoped by the
 * same role-based filter as everywhere else in the CRM (lib/crm/scope.ts)
 * — passed in by the caller, not computed here — so a Sales Executive
 * hitting this dashboard automatically gets "My" metrics (their own
 * leads only) with zero special-casing in this file, and a Manager/Admin
 * gets the full picture. That's also what turns one dashboard into both
 * the roadmap's "Sales Executive Dashboard" and "Manager Dashboard" —
 * same numbers, same queries, different scope filter upstream.
 */
import { CrmLeadModel } from "@/lib/db/models/crm-lead.model";
import { isNoResponse, followUpBucket } from "@/lib/crm/activity";

const TERMINAL = new Set(["booked", "trip_completed", "lost"]);

export interface DashboardMetrics {
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
  conversionRate: number; // booked+tripCompleted / totalLeads, as a percentage
}

export interface BreakdownRow {
  label: string;
  count: number;
  revenue?: number;
}

export interface ExecutivePerformanceRow {
  name: string;
  totalLeads: number;
  booked: number;
  revenue: number;
  conversionRate: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  leadsPerDay: { date: string; count: number }[]; // last 14 days
  byPlatform: BreakdownRow[];
  byCampaign: BreakdownRow[];
  byDestination: BreakdownRow[];
  byExecutive: ExecutivePerformanceRow[];
}

function startOfDay(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export async function getCrmDashboard(scopeFilter: Record<string, unknown> | null): Promise<DashboardData> {
  const base = scopeFilter ?? {};
  const leads = await CrmLeadModel.find(base).lean();

  const today = startOfDay();
  const totalLeads = leads.length;

  let todaysLeads = 0;
  let newLeads = 0;
  let assignedLeads = 0;
  let unassignedLeads = 0;
  let todaysFollowUps = 0;
  let overdueFollowUps = 0;
  let noResponse = 0;
  let interestedLeads = 0;
  let paymentPending = 0;
  let bookedLeads = 0;
  let tripCompleted = 0;
  let lostLeads = 0;
  let revenue = 0;

  const platformCounts = new Map<string, number>();
  const campaignCounts = new Map<string, { count: number; revenue: number }>();
  const destinationCounts = new Map<string, number>();
  const executiveStats = new Map<string, { totalLeads: number; booked: number; revenue: number }>();
  const perDay = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    perDay.set(d.toISOString().slice(0, 10), 0);
  }

  for (const l of leads) {
    if (new Date(l.createdAt) >= today) todaysLeads++;
    if (l.status === "new") newLeads++;
    if (l.assignedTo) assignedLeads++;
    else unassignedLeads++;
    if (l.status === "interested") interestedLeads++;
    if (l.status === "payment_pending") paymentPending++;
    if (l.status === "booked") bookedLeads++;
    if (l.status === "trip_completed") tripCompleted++;
    if (l.status === "lost") lostLeads++;
    if (l.amountPaid) revenue += l.amountPaid;

    if (!TERMINAL.has(l.status)) {
      const bucket = followUpBucket(l.nextFollowUpAt);
      if (bucket === "today") todaysFollowUps++;
      if (bucket === "overdue") overdueFollowUps++;
      if (isNoResponse(l)) noResponse++;
    }

    const platformKey = l.platform || l.source;
    platformCounts.set(platformKey, (platformCounts.get(platformKey) ?? 0) + 1);

    if (l.destination) destinationCounts.set(l.destination, (destinationCounts.get(l.destination) ?? 0) + 1);

    if (l.campaign) {
      const c = campaignCounts.get(l.campaign) ?? { count: 0, revenue: 0 };
      c.count += 1;
      c.revenue += l.amountPaid || 0;
      campaignCounts.set(l.campaign, c);
    }

    const execKey = l.assignedTo || "Unassigned";
    const e = executiveStats.get(execKey) ?? { totalLeads: 0, booked: 0, revenue: 0 };
    e.totalLeads += 1;
    if (l.status === "booked" || l.status === "trip_completed") e.booked += 1;
    e.revenue += l.amountPaid || 0;
    executiveStats.set(execKey, e);

    // l.createdAt is a real Date at runtime (Mongoose `timestamps: true`),
    // not the string the TS interface claims — .toISOString() first so
    // .slice(0, 10) doesn't crash on a Date.
    const day = new Date(l.createdAt).toISOString().slice(0, 10);
    if (perDay.has(day)) perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }

  const toSorted = (m: Map<string, number>): BreakdownRow[] =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, count]) => ({ label, count }));

  const byCampaign: BreakdownRow[] = [...campaignCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([label, v]) => ({ label, count: v.count, revenue: v.revenue }));

  const byExecutive: ExecutivePerformanceRow[] = [...executiveStats.entries()]
    .sort((a, b) => b[1].totalLeads - a[1].totalLeads)
    .map(([name, v]) => ({
      name,
      totalLeads: v.totalLeads,
      booked: v.booked,
      revenue: v.revenue,
      conversionRate: v.totalLeads ? Math.round((v.booked / v.totalLeads) * 1000) / 10 : 0,
    }));

  const convertedCount = bookedLeads + tripCompleted;

  return {
    metrics: {
      todaysLeads,
      newLeads,
      assignedLeads,
      unassignedLeads,
      todaysFollowUps,
      overdueFollowUps,
      noResponse,
      interestedLeads,
      paymentPending,
      bookedLeads,
      tripCompleted,
      lostLeads,
      revenue,
      totalLeads,
      conversionRate: totalLeads ? Math.round((convertedCount / totalLeads) * 1000) / 10 : 0,
    },
    leadsPerDay: [...perDay.entries()].map(([date, count]) => ({ date, count })),
    byPlatform: toSorted(platformCounts),
    byCampaign,
    byDestination: toSorted(destinationCounts),
    byExecutive,
  };
}
