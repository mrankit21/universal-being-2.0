"use client";

/** Admin Refund Management (Step 8C, Part 6/11). Every transition goes
 * through `/api/admin/refunds/[id]` — no manual database editing. */
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";

interface Refund {
  _id: string;
  bookingId: string;
  amount: number;
  reason: string;
  status: "requested" | "approved" | "rejected" | "processed";
  requestedBy: string;
  createdAt: string;
}

export default function RefundsAdminPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/refunds");
    const json = await res.json();
    if (json.success) setRefunds(json.data);
    else toast.error(json.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, status: "approved" | "rejected" | "processed") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/refunds/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Could not update refund.");
        return;
      }
      toast.success(`Refund ${status}.`);
      load();
    } finally {
      setBusyId(null);
    }
  }

  const columns: Column<Refund>[] = [
    {
      header: "Booking",
      cell: (r) => (
        <Link href={`/admin/bookings/${r.bookingId}`} className="font-mono text-xs text-primary hover:underline">
          {r.bookingId}
        </Link>
      ),
    },
    { header: "Amount", cell: (r) => `₹${r.amount.toLocaleString("en-IN")}` },
    { header: "Reason", cell: (r) => <span className="line-clamp-1 max-w-xs text-muted-foreground">{r.reason}</span> },
    { header: "Requested By", cell: (r) => r.requestedBy },
    { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    { header: "Requested On", cell: (r) => new Date(r.createdAt).toLocaleDateString("en-IN") },
    {
      header: "",
      cell: (r) => (
        <div className="flex gap-1">
          {r.status === "requested" && (
            <>
              <Button size="sm" onClick={() => act(r._id, "approved")} disabled={busyId === r._id}>
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => act(r._id, "rejected")} disabled={busyId === r._id}>
                Reject
              </Button>
            </>
          )}
          {r.status === "approved" && (
            <Button size="sm" onClick={() => act(r._id, "processed")} disabled={busyId === r._id}>
              Process refund
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Refunds</h1>
        <p className="text-sm text-muted-foreground">Review and process customer refund requests.</p>
      </div>
      <DataTable columns={columns} rows={refunds} loading={loading} rowKey={(r) => r._id} emptyMessage="No refund requests yet." />
    </div>
  );
}
