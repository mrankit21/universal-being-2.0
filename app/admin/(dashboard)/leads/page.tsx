"use client";

/**
 * Admin Leads — follow-up queue for the two anonymous lead-capture forms
 * that write straight to the database with no admin view of their own:
 * "Let's Plan Your Trip" (Trip2Lead) and the site-wide coupon popup
 * (PromoLead). See app/api/admin/leads for how the two collections are
 * merged into one list.
 */
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/admin/data-table";

interface LeadRow {
  id: string;
  kind: "trip2" | "promo";
  name: string;
  whatsappNumber: string;
  detail: string;
  tripSlug?: string;
  source?: string;
  contacted: boolean;
  createdAt: string;
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "new", label: "Not contacted" },
  { key: "contacted", label: "Contacted" },
] as const;

export default function LeadsAdminPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("new");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter === "new") params.set("contacted", "false");
    if (filter === "contacted") params.set("contacted", "true");
    const res = await fetch(`/api/admin/leads?${params.toString()}`);
    const json = await res.json();
    if (json.success) setLeads(json.data);
    else toast.error(json.error);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleContacted(lead: LeadRow) {
    setBusyId(lead.id);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}?kind=${lead.kind}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacted: !lead.contacted }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Could not update lead.");
        return;
      }
      toast.success(lead.contacted ? "Marked as not contacted." : "Marked as contacted.");
      load();
    } finally {
      setBusyId(null);
    }
  }

  const columns: Column<LeadRow>[] = [
    {
      header: "Type",
      cell: (l) => (
        <Badge className={l.kind === "trip2" ? "bg-sky-100 text-sky-800 hover:bg-sky-100" : "bg-amber-100 text-amber-800 hover:bg-amber-100"}>
          {l.kind === "trip2" ? "Trip enquiry" : "Coupon popup"}
        </Badge>
      ),
    },
    { header: "Name", cell: (l) => l.name },
    {
      header: "WhatsApp",
      cell: (l) => (
        <a
          href={`https://wa.me/${l.whatsappNumber.replace(/[^\d]/g, "")}`}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-xs text-primary hover:underline"
        >
          {l.whatsappNumber}
        </a>
      ),
    },
    { header: "Details", cell: (l) => <span className="text-muted-foreground">{l.detail}</span> },
    {
      header: "Trip page",
      cell: (l) =>
        l.tripSlug ? (
          <Link href={`/trip2/${l.tripSlug}`} target="_blank" className="text-xs text-primary hover:underline">
            {l.tripSlug}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    { header: "Received", cell: (l) => new Date(l.createdAt).toLocaleString("en-IN") },
    {
      header: "",
      cell: (l) => (
        <Button size="sm" variant={l.contacted ? "outline" : "primary"} onClick={() => toggleContacted(l)} disabled={busyId === l.id}>
          {l.contacted ? "Mark not contacted" : "Mark contacted"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
        <p className="text-sm text-muted-foreground">
          Callback requests from &ldquo;Let&rsquo;s Plan Your Trip&rdquo; and the coupon popup.
        </p>
      </div>
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <Button key={f.key} size="sm" variant={filter === f.key ? "primary" : "outline"} onClick={() => setFilter(f.key)}>
            {f.label}
          </Button>
        ))}
      </div>
      <DataTable columns={columns} rows={leads} loading={loading} rowKey={(l) => `${l.kind}-${l.id}`} emptyMessage="No leads here." />
    </div>
  );
}
