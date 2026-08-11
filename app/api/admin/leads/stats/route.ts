/**
 * GET /api/admin/leads/stats — aggregates both lead collections
 * (Trip2Lead, PromoLead) into the numbers the Leads page's analytics
 * section needs: a daily trend for the last N days, and a per-salesperson
 * leaderboard (how many leads assigned, how many of those contacted).
 * Leads volume here is marketing-popup scale, not booking-table scale, so
 * this aggregates in JS rather than a Mongo pipeline — simpler to read
 * and cheap enough at this size.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip2LeadModel } from "@/lib/db/models/trip2-lead.model";
import { PromoLeadModel } from "@/lib/db/models/promo-lead.model";
import { ok, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

interface DayBucket {
  date: string; // YYYY-MM-DD
  trip2: number;
  promo: number;
  total: number;
}

interface LeaderboardRow {
  name: string;
  assigned: number;
  contacted: number;
  contactRate: number; // 0-100
}

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  try {
    await requirePermission("leads:read");
    await connectToDatabase();

    const days = Math.min(Math.max(Number(req.nextUrl.searchParams.get("days")) || 30, 7), 90);

    const [trip2Leads, promoLeads] = await Promise.all([
      Trip2LeadModel.find().select("createdAt contacted assignedTo").lean(),
      PromoLeadModel.find().select("createdAt contacted assignedTo").lean(),
    ]);

    // --- Daily trend, oldest -> newest, always `days` buckets even if a
    // day had zero leads (so the chart doesn't skip gaps). ---
    const buckets = new Map<string, DayBucket>();
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, { date: key, trip2: 0, promo: 0, total: 0 });
    }
    for (const l of trip2Leads) {
      const key = dayKey(l.createdAt);
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.trip2 += 1;
        bucket.total += 1;
      }
    }
    for (const l of promoLeads) {
      const key = dayKey(l.createdAt);
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.promo += 1;
        bucket.total += 1;
      }
    }
    const daily = Array.from(buckets.values());

    // --- Leaderboard, by assignedTo across both collections. ---
    const board = new Map<string, { assigned: number; contacted: number }>();
    let unassigned = 0;
    for (const l of [...trip2Leads, ...promoLeads]) {
      if (!l.assignedTo) {
        unassigned += 1;
        continue;
      }
      const entry = board.get(l.assignedTo) ?? { assigned: 0, contacted: 0 };
      entry.assigned += 1;
      if (l.contacted) entry.contacted += 1;
      board.set(l.assignedTo, entry);
    }
    const leaderboard: LeaderboardRow[] = Array.from(board.entries())
      .map(([name, v]) => ({
        name,
        assigned: v.assigned,
        contacted: v.contacted,
        contactRate: v.assigned ? Math.round((v.contacted / v.assigned) * 100) : 0,
      }))
      .sort((a, b) => b.assigned - a.assigned);

    const allLeads = [...trip2Leads, ...promoLeads];
    const totals = {
      trip2: trip2Leads.length,
      promo: promoLeads.length,
      total: allLeads.length,
      contacted: allLeads.filter((l) => l.contacted).length,
      contactRate: allLeads.length
        ? Math.round((allLeads.filter((l) => l.contacted).length / allLeads.length) * 100)
        : 0,
      unassigned,
    };

    return ok({ daily, leaderboard, totals });
  } catch (err) {
    return handleApiError(err);
  }
}
