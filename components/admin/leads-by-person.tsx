"use client";

/**
 * LeadsByPerson — date-wise breakdown of leads grouped by `assignedTo`.
 * The existing salesperson leaderboard (see leads/stats route) only gives
 * a per-person count + contact rate; this answers the follow-up question
 * admins actually ask — "which leads, on which date, did each person
 * take" — by grouping the same lead rows client-side and listing them.
 * Unassigned leads get their own bucket at the top so nothing is hidden.
 */
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, User, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LeadRow {
  id: string;
  kind: "trip2" | "promo";
  name: string;
  whatsappNumber: string;
  detail: string;
  contacted: boolean;
  assignedTo?: string;
  createdAt: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function LeadsByPerson({ leads }: { leads: LeadRow[] }) {
  const groups = useMemo(() => {
    const map = new Map<string, LeadRow[]>();
    for (const lead of leads) {
      const key = lead.assignedTo ?? "";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(lead);
    }
    for (const rows of map.values()) {
      rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    const entries = Array.from(map.entries());
    entries.sort((a, b) => {
      if (a[0] === "") return -1;
      if (b[0] === "") return 1;
      return b[1].length - a[1].length;
    });
    return entries;
  }, [leads]);

  const [openKeys, setOpenKeys] = useState<Set<string>>(() => new Set(groups.map(([key]) => key)));

  function toggle(key: string) {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  if (leads.length === 0) {
    return <p className="rounded-lg border border-border px-4 py-10 text-center text-sm text-muted-foreground">No leads yet.</p>;
  }

  return (
    <div className="space-y-3">
      {groups.map(([key, rows]) => {
        const isUnassigned = key === "";
        const isOpen = openKeys.has(key);
        const contactedCount = rows.filter((r) => r.contacted).length;
        return (
          <div key={key || "unassigned"} className="overflow-hidden rounded-lg border border-border">
            <button
              type="button"
              onClick={() => toggle(key)}
              className="flex w-full items-center justify-between gap-2 bg-muted/50 px-4 py-3 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                {isOpen ? <ChevronDown className="size-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
                {isUnassigned ? <UserX className="size-4 shrink-0 text-muted-foreground" /> : <User className="size-4 shrink-0 text-muted-foreground" />}
                {isUnassigned ? "Unassigned" : key}
              </span>
              <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{rows.length} lead{rows.length === 1 ? "" : "s"}</Badge>
                {!isUnassigned ? <span>{contactedCount}/{rows.length} contacted</span> : null}
              </span>
            </button>

            {isOpen ? (
              <div className="divide-y divide-border">
                {rows.map((lead) => (
                  <div key={`${lead.kind}-${lead.id}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
                    <div className="min-w-0">
                      <span className="font-medium">{lead.name}</span>{" "}
                      <span className="text-muted-foreground">· {lead.detail || (lead.kind === "trip2" ? "Trip enquiry" : "Coupon popup")}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                      <span className="whitespace-nowrap">{formatDate(lead.createdAt)} · {formatTime(lead.createdAt)}</span>
                      <span className={cn("rounded-full px-2 py-0.5", lead.contacted ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800")}>
                        {lead.contacted ? "Contacted" : "Not contacted"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}