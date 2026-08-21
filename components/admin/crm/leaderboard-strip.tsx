"use client";

/**
 * SalespersonLeaderboard — compact horizontal strip of per-salesperson
 * stats at the top of the CRM lead list. Data comes from the same
 * `/api/admin/crm/dashboard` `byExecutive` breakdown the full Dashboard
 * page already computes (name, total leads, booked, conversion rate) —
 * this is a smaller, always-visible summary of it, not a second source
 * of truth. Brought over from the old standalone Leads page's
 * "Salesperson leaderboard" panel, which this list replaces.
 */
import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";

interface ExecutiveRow {
  name: string;
  totalLeads: number;
  booked: number;
  conversionRate: number;
}

export function SalespersonLeaderboard() {
  const [rows, setRows] = useState<ExecutiveRow[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/crm/dashboard")
      .then((r) => r.json())
      .then((json) => json.success && setRows(json.data.byExecutive));
  }, []);

  if (!rows || rows.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto rounded-md border border-border bg-muted/20 px-3 py-2">
      <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
        <Trophy className="size-3.5 text-amber-500" /> Leaderboard
      </span>
      {rows.slice(0, 8).map((r, i) => (
        <div
          key={r.name}
          className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1"
        >
          <span className="text-[11px] font-semibold text-muted-foreground">#{i + 1}</span>
          <span className="text-xs font-medium">{r.name}</span>
          <span className="text-[11px] text-muted-foreground">
            {r.totalLeads} leads · {r.booked} booked · {r.conversionRate}%
          </span>
        </div>
      ))}
    </div>
  );
}
