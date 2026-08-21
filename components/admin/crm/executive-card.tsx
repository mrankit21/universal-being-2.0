"use client";

/**
 * ExecutiveCard — one colorful, clickable tile per Sales Executive on
 * the CRM Dashboard, replacing the old plain "Sales Executive
 * Performance" table row. Click through to /admin/crm/dashboard/executive/[name]
 * for the full daily/weekly/monthly/timing breakdown.
 */
import Link from "next/link";
import { TrendingUp, IndianRupee, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { themeFor, initialsFor } from "@/components/admin/crm/executive-theme";
import type { ExecutiveSummaryCard } from "@/lib/crm/executive-performance";

function formatMoney(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function ExecutiveCard({ row, rank }: { row: ExecutiveSummaryCard; rank: number }) {
  const theme = themeFor(row.name);
  return (
    <Link href={`/admin/crm/dashboard/executive/${encodeURIComponent(row.name)}`}>
      <Card className={`group relative overflow-hidden border-0 shadow-ub-sm ring-1 ${theme.ring} transition-transform hover:-translate-y-0.5 hover:shadow-ub-md`}>
        <div className={`h-1.5 w-full bg-gradient-to-r ${theme.gradient}`} />
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${theme.gradient} text-sm font-bold text-white shadow-sm`}
            >
              {initialsFor(row.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-semibold">{row.name}</p>
                {rank <= 3 ? (
                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${theme.soft} ${theme.text}`}>#{rank}</span>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">{row.todaysLeads} today</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className={`rounded-lg ${theme.soft} py-2`}>
              <p className={`flex items-center justify-center gap-1 text-sm font-bold ${theme.text}`}>
                <Users className="size-3" /> {row.totalLeads}
              </p>
              <p className="text-[10px] text-muted-foreground">Leads</p>
            </div>
            <div className="rounded-lg bg-emerald-50 py-2">
              <p className="flex items-center justify-center gap-1 text-sm font-bold text-emerald-700">
                <TrendingUp className="size-3" /> {row.booked}
              </p>
              <p className="text-[10px] text-muted-foreground">Booked</p>
            </div>
            <div className="rounded-lg bg-amber-50 py-2">
              <p className="flex items-center justify-center gap-1 text-sm font-bold text-amber-700">
                <IndianRupee className="size-3" /> {formatMoney(row.revenue)}
              </p>
              <p className="text-[10px] text-muted-foreground">Revenue</p>
            </div>
          </div>

          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full bg-gradient-to-r ${theme.gradient}`} style={{ width: `${Math.min(100, row.conversionRate)}%` }} />
          </div>
          <p className="mt-1 text-right text-[11px] font-medium text-muted-foreground">{row.conversionRate}% conversion</p>
        </div>
      </Card>
    </Link>
  );
}
