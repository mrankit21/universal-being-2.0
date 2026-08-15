"use client";

/**
 * Follow-ups dashboard — Phase 3 ("Follow-up + No Response System").
 * Four sections exactly as the roadmap specifies: Overdue Follow-ups,
 * Today's Follow-ups, Upcoming Follow-ups, No Response > 2 Days. Each
 * card mirrors the roadmap's own example layout (name / destination /
 * assigned / timing / [Open Lead]) rather than a generic table — this
 * page exists purely so a salesperson can see what needs attention
 * *today* without hunting through the full lead list.
 */
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, Clock, CalendarClock, CalendarCheck2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FollowUpRow {
  id: string;
  leadId: string;
  name: string;
  phone: string;
  whatsappNumber?: string;
  destination?: string;
  status: string;
  assignedTo?: string;
  nextFollowUpAt?: string;
  lastCustomerReplyAt?: string;
  createdAt: string;
}

interface Buckets {
  overdue: FollowUpRow[];
  today: FollowUpRow[];
  upcoming: FollowUpRow[];
  noResponse: FollowUpRow[];
}

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function LeadCard({ row, timingLabel, timingValue, urgent }: { row: FollowUpRow; timingLabel: string; timingValue: string; urgent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
      <div className="min-w-0">
        <p className="truncate font-medium">{row.name}</p>
        <p className="truncate text-xs text-muted-foreground">{row.destination ?? "—"}</p>
        <p className="mt-1 text-xs text-muted-foreground">Assigned: {row.assignedTo ?? "Unassigned"}</p>
        <p className={`mt-0.5 text-xs ${urgent ? "font-medium text-rose-600" : "text-muted-foreground"}`}>
          {timingLabel}: {timingValue}
        </p>
      </div>
      <Link href={`/admin/crm/${row.id}`}>
        <Button size="sm" variant="outline" className="shrink-0">
          Open Lead
        </Button>
      </Link>
    </div>
  );
}

function Section({
  title,
  icon,
  rows,
  emptyMessage,
  renderTiming,
  tone,
}: {
  title: string;
  icon: ReactNode;
  rows: FollowUpRow[];
  emptyMessage: string;
  renderTiming: (row: FollowUpRow) => { label: string; value: string };
  tone?: "urgent";
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm font-medium">
          {icon} {title} {rows.length > 0 ? <span className="text-muted-foreground">({rows.length})</span> : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">{emptyMessage}</p>
        ) : (
          rows.map((r) => {
            const t = renderTiming(r);
            return <LeadCard key={r.id} row={r} timingLabel={t.label} timingValue={t.value} urgent={tone === "urgent"} />;
          })
        )}
      </CardContent>
    </Card>
  );
}

export default function CrmFollowUpsPage() {
  const [buckets, setBuckets] = useState<Buckets | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/crm/follow-ups")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setBuckets(json.data);
        else toast.error(json.error);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/crm">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1.5 size-4" /> Back to CRM
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Follow-ups</h1>
          <p className="text-sm text-muted-foreground">What needs attention today.</p>
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
      ) : buckets ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Section
            title="Overdue Follow-ups"
            icon={<AlertTriangle className="size-4 text-rose-600" />}
            rows={buckets.overdue}
            emptyMessage="Nothing overdue. 🎉"
            tone="urgent"
            renderTiming={(r) => ({ label: "Was due", value: formatDateTime(r.nextFollowUpAt) })}
          />
          <Section
            title="Today's Follow-ups"
            icon={<Clock className="size-4 text-amber-600" />}
            rows={buckets.today}
            emptyMessage="No follow-ups scheduled for today."
            renderTiming={(r) => ({ label: "Due", value: formatDateTime(r.nextFollowUpAt) })}
          />
          <Section
            title="Upcoming Follow-ups"
            icon={<CalendarClock className="size-4 text-muted-foreground" />}
            rows={buckets.upcoming}
            emptyMessage="Nothing scheduled yet."
            renderTiming={(r) => ({ label: "Due", value: formatDateTime(r.nextFollowUpAt) })}
          />
          <Section
            title="No Response > 2 Days"
            icon={<CalendarCheck2 className="size-4 text-rose-600" />}
            rows={buckets.noResponse}
            emptyMessage="Everyone's responding. 🎉"
            tone="urgent"
            renderTiming={(r) => ({
              label: "No response",
              value: `${daysSince(r.lastCustomerReplyAt ?? r.createdAt)} day${daysSince(r.lastCustomerReplyAt ?? r.createdAt) === 1 ? "" : "s"} (last reply ${formatDateTime(r.lastCustomerReplyAt)})`,
            })}
          />
        </div>
      ) : null}
    </div>
  );
}
