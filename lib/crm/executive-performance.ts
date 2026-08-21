/**
 * Per-Sales-Executive performance — the deep-dive behind each "Sales
 * Executive Performance" card on the CRM Dashboard. Where
 * `getCrmDashboard()` (lib/crm/dashboard.ts) gives one row per executive
 * (totals only), this gives the full picture for a single executive:
 * today/week/month lead counts, a monthly trend, current pipeline mix,
 * and — importantly — *when* each of their sales actually closed, not
 * just how many.
 *
 * Matching is case-/whitespace-insensitive throughout, same reasoning
 * as `lib/crm/scope.ts`: the executive's login name and their
 * Salesperson/`assignedTo` tag are two independently-typed free-text
 * fields, so an exact `===` comparison is one typo away from silently
 * showing an empty dashboard.
 */
import { CrmLeadModel } from "@/lib/db/models/crm-lead.model";
import { CrmLeadActivityModel } from "@/lib/db/models/crm-lead-activity.model";

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function startOfDay(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfWeek(d = new Date()): Date {
  const s = startOfDay(d);
  s.setDate(s.getDate() - s.getDay());
  return s;
}

function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export interface ExecutiveSummaryCard {
  name: string;
  todaysLeads: number;
  totalLeads: number;
  booked: number;
  revenue: number;
  conversionRate: number;
}

export interface MonthlyPoint {
  month: string; // "Aug '26"
  leads: number;
  booked: number;
}

export interface StatusMixRow {
  status: string;
  count: number;
}

export interface ConversionEvent {
  leadId: string;
  id: string;
  name: string;
  destination?: string;
  amountPaid?: number;
  at: string; // when the status flipped to booked
}

export interface AssignmentEvent {
  leadId: string;
  id: string;
  name: string;
  source: string;
  at: string;
}

export interface ExecutiveDetail {
  name: string;
  todaysLeads: number;
  thisWeekLeads: number;
  thisMonthLeads: number;
  totalLeads: number;
  booked: number;
  tripCompleted: number;
  lost: number;
  revenue: number;
  conversionRate: number;
  overdueFollowUps: number;
  noResponse: number;
  monthly: MonthlyPoint[]; // last 6 months
  statusMix: StatusMixRow[];
  recentConversions: ConversionEvent[]; // most recent "booked" events, with timing
  recentAssignments: AssignmentEvent[]; // most recently assigned leads
}

/** Card-sized summary for every executive in scope — what the Dashboard's
 * "Sales Executive Performance" grid renders. Cheap: one query, no
 * activity-log join (that only happens on the detail page). */
export async function getExecutiveSummaries(scopeFilter: Record<string, unknown> | null): Promise<ExecutiveSummaryCard[]> {
  const base = scopeFilter ?? {};
  const leads = await CrmLeadModel.find({ ...base, assignedTo: { $exists: true, $ne: null } }).lean();
  const today = startOfDay();

  const byExec = new Map<string, { display: string; todaysLeads: number; totalLeads: number; booked: number; revenue: number }>();
  for (const l of leads) {
    const key = normalizeName(l.assignedTo as string);
    const row = byExec.get(key) ?? { display: l.assignedTo as string, todaysLeads: 0, totalLeads: 0, booked: 0, revenue: 0 };
    row.totalLeads += 1;
    if (l.status === "booked" || l.status === "trip_completed") row.booked += 1;
    row.revenue += l.amountPaid || 0;
    const assignedOrCreated = l.assignedAt ? new Date(l.assignedAt) : new Date(l.createdAt);
    if (assignedOrCreated >= today) row.todaysLeads += 1;
    byExec.set(key, row);
  }

  return [...byExec.values()]
    .map((r) => ({
      name: r.display,
      todaysLeads: r.todaysLeads,
      totalLeads: r.totalLeads,
      booked: r.booked,
      revenue: r.revenue,
      conversionRate: r.totalLeads ? Math.round((r.booked / r.totalLeads) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.totalLeads - a.totalLeads);
}

/** Full deep-dive for one executive. `displayName` is whatever name the
 * caller has on hand (session name or a name picked from the summary
 * list) — matching against `assignedTo` is case-insensitive, so it
 * doesn't need to be byte-for-byte identical to what's stored. */
export async function getExecutiveDetail(
  scopeFilter: Record<string, unknown> | null,
  displayName: string
): Promise<ExecutiveDetail | null> {
  const target = normalizeName(displayName);
  const base = scopeFilter ?? {};
  const allLeads = await CrmLeadModel.find(base).lean();
  const leads = allLeads.filter((l) => l.assignedTo && normalizeName(l.assignedTo) === target);

  if (leads.length === 0) {
    return {
      name: displayName,
      todaysLeads: 0,
      thisWeekLeads: 0,
      thisMonthLeads: 0,
      totalLeads: 0,
      booked: 0,
      tripCompleted: 0,
      lost: 0,
      revenue: 0,
      conversionRate: 0,
      overdueFollowUps: 0,
      noResponse: 0,
      monthly: [],
      statusMix: [],
      recentConversions: [],
      recentAssignments: [],
    };
  }

  const actualName = leads[0].assignedTo as string; // real casing, for display
  const today = startOfDay();
  const weekStart = startOfWeek();
  const monthStart = startOfMonth();

  let todaysLeads = 0;
  let thisWeekLeads = 0;
  let thisMonthLeads = 0;
  let booked = 0;
  let tripCompleted = 0;
  let lost = 0;
  let revenue = 0;
  let overdueFollowUps = 0;
  let noResponse = 0;

  const statusCounts = new Map<string, number>();
  const monthly = new Map<string, { leads: number; booked: number }>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthly.set(monthKey(d), { leads: 0, booked: 0 });
  }

  for (const l of leads) {
    const assignedOrCreated = l.assignedAt ? new Date(l.assignedAt) : new Date(l.createdAt);
    if (assignedOrCreated >= today) todaysLeads += 1;
    if (assignedOrCreated >= weekStart) thisWeekLeads += 1;
    if (assignedOrCreated >= monthStart) thisMonthLeads += 1;

    if (l.status === "booked") booked += 1;
    if (l.status === "trip_completed") tripCompleted += 1;
    if (l.status === "lost") lost += 1;
    revenue += l.amountPaid || 0;

    statusCounts.set(l.status, (statusCounts.get(l.status) ?? 0) + 1);

    const mKey = monthKey(assignedOrCreated);
    const bucket = monthly.get(mKey);
    if (bucket) {
      bucket.leads += 1;
      if (l.status === "booked" || l.status === "trip_completed") bucket.booked += 1;
    }

    if (!["booked", "trip_completed", "lost"].includes(l.status)) {
      if (l.nextFollowUpAt && new Date(l.nextFollowUpAt) < now) overdueFollowUps += 1;
      const anchor = l.lastCustomerReplyAt ?? l.createdAt;
      if ((Date.now() - new Date(anchor).getTime()) / (1000 * 60 * 60) >= 48) noResponse += 1;
    }
  }

  const totalLeads = leads.length;
  const convertedCount = booked + tripCompleted;

  // Conversion timing — when each of this executive's leads actually
  // flipped to "booked", from the activity timeline rather than a guess.
  const leadIds = new Set(leads.map((l) => l.leadId));
  const leadById = new Map(leads.map((l) => [l.leadId, l] as const));
  const bookedActivities = await CrmLeadActivityModel.find({
    type: "status_changed",
    "meta.to": "booked",
    leadId: { $in: [...leadIds] },
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const recentConversions: ConversionEvent[] = bookedActivities
    .map((a) => {
      const lead = leadById.get(a.leadId);
      if (!lead) return null;
      return {
        leadId: lead.leadId,
        id: String(lead._id),
        name: lead.name,
        destination: lead.destination,
        amountPaid: lead.amountPaid,
        at: a.createdAt,
      };
    })
    .filter((x): x is ConversionEvent => x !== null);

  const recentAssignments: AssignmentEvent[] = [...leads]
    .sort((a, b) => {
      const at = a.assignedAt ? new Date(a.assignedAt).getTime() : new Date(a.createdAt).getTime();
      const bt = b.assignedAt ? new Date(b.assignedAt).getTime() : new Date(b.createdAt).getTime();
      return bt - at;
    })
    .slice(0, 15)
    .map((l) => ({
      leadId: l.leadId,
      id: String(l._id),
      name: l.name,
      source: l.platform || l.source,
      at: l.assignedAt || new Date(l.createdAt).toISOString(),
    }));

  return {
    name: actualName,
    todaysLeads,
    thisWeekLeads,
    thisMonthLeads,
    totalLeads,
    booked,
    tripCompleted,
    lost,
    revenue,
    conversionRate: totalLeads ? Math.round((convertedCount / totalLeads) * 1000) / 10 : 0,
    overdueFollowUps,
    noResponse,
    monthly: [...monthly.entries()].map(([key, v]) => ({ month: monthLabel(key), leads: v.leads, booked: v.booked })),
    statusMix: [...statusCounts.entries()].map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
    recentConversions,
    recentAssignments,
  };
}
