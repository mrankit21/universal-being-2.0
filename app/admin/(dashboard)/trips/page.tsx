"use client";

/** Trip Management list (requirement #3): search, status filter, publish
 * toggle, featured toggle, delete — all from one table. */
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DataTable, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TripRow {
  _id: string;
  title: string;
  slug: string;
  destinationName: string;
  status: "draft" | "published" | "archived";
  featured: boolean;
  price: { base: number; currency: string };
  availableSeats: number;
  circuitGroup?: string;
  isCircuitParent?: boolean;
}

export default function TripsListPage() {
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (status !== "all") params.set("status", status);
    params.set("page", String(page));
    params.set("limit", String(limit));
    const res = await fetch(`/api/admin/trips?${params.toString()}`);
    const json = await res.json();
    if (json.success) {
      setTrips(json.data.trips);
      setTotalPages(Math.max(1, json.data.totalPages ?? 1));
      setTotal(json.data.total ?? json.data.trips.length);
    } else toast.error(json.error);
    setLoading(false);
  }, [query, status, page]);

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [load]);

  // A new search/status filter always restarts from page 1 — otherwise
  // "page 3" of an old filter could silently return zero rows under a new,
  // shorter-result-set filter and look like every trip vanished.
  useEffect(() => {
    setPage(1);
  }, [query, status]);

  async function handleDelete(id: string, force = false) {
    const url = force ? `/api/admin/trips/${id}?force=true` : `/api/admin/trips/${id}`;
    const res = await fetch(url, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      toast.success("Trip deleted");
      setTrips((prev) => prev.filter((t) => t._id !== id));
      return;
    }
    if (res.status === 409 && json.details?.requiresConfirmation && !force) {
      if (window.confirm(`${json.error}\n\nDelete it anyway?`)) {
        await handleDelete(id, true);
        return;
      }
      return;
    }
    toast.error(json.error);
  }

  async function togglePublish(trip: TripRow) {
    const nextStatus = trip.status === "published" ? "draft" : "published";

    // Unpublishing a circuit's flagged Parent cascades the same status to
    // every sibling Trip in its `circuitGroup` (server-side rule, see
    // `/api/admin/trips/[id]/publish`). Warn up front with exactly which
    // trips that'll affect — otherwise it looks like those trips "went to
    // draft on their own" with no explanation.
    if (nextStatus !== "published" && trip.isCircuitParent && trip.circuitGroup) {
      const affectedSiblings = trips.filter(
        (t) => t._id !== trip._id && t.circuitGroup === trip.circuitGroup && t.status === "published"
      );
      if (affectedSiblings.length > 0) {
        const names = affectedSiblings.map((t) => t.title).join(", ");
        const proceed = window.confirm(
          `"${trip.title}" is the Parent trip for this circuit. Unpublishing it will also move these linked trips to Draft: ${names}.\n\nContinue?`
        );
        if (!proceed) return;
      }
    }

    const res = await fetch(`/api/admin/trips/${trip._id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const json = await res.json();
    if (json.success) {
      const cascaded: { _id: string; title: string }[] = json.data.cascaded ?? [];
      const cascadedIds = new Set(cascaded.map((c) => c._id));
      setTrips((prev) =>
        prev.map((t) =>
          t._id === trip._id || cascadedIds.has(t._id) ? { ...t, status: nextStatus } : t
        )
      );
      if (cascaded.length > 0) {
        toast.success(
          `"${trip.title}" moved to Draft — also unpublished ${cascaded.length} linked trip${cascaded.length > 1 ? "s" : ""}: ${cascaded.map((c) => c.title).join(", ")}`
        );
      } else {
        toast.success(nextStatus === "published" ? "Trip published" : "Trip moved to draft");
      }
    } else {
      toast.error(json.error);
    }
  }

  async function toggleFeatured(trip: TripRow) {
    const res = await fetch(`/api/admin/trips/${trip._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !trip.featured }),
    });
    const json = await res.json();
    if (json.success) {
      setTrips((prev) => prev.map((t) => (t._id === trip._id ? { ...t, featured: !t.featured } : t)));
    } else {
      toast.error(json.error);
    }
  }

  const columns: Column<TripRow>[] = [
    {
      header: "Trip",
      cell: (t) => (
        <div>
          <p className="flex items-center gap-1.5 font-medium">
            {t.title}
            {t.isCircuitParent && (
              <span
                title="Unpublishing this trip also unpublishes its linked sibling trips"
                className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
              >
                Parent
              </span>
            )}
            {!t.isCircuitParent && t.circuitGroup && (
              <span
                title="Part of a circuit — linked to a Parent trip"
                className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Linked
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">{t.destinationName}</p>
        </div>
      ),
    },
    { header: "Price", cell: (t) => `₹${t.price.base.toLocaleString("en-IN")}` },
    { header: "Seats", cell: (t) => t.availableSeats },
    { header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
    {
      header: "Featured",
      cell: (t) => (
        <button onClick={() => toggleFeatured(t)} title="Toggle featured">
          <Star className={cn("size-5", t.featured ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
        </button>
      ),
    },
    {
      header: "Actions",
      cell: (t) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => togglePublish(t)}>
            {t.status === "published" ? "Unpublish" : "Publish"}
          </Button>
          <Link href={`/admin/trips/${t._id}`}>
            <Button variant="ghost" size="icon"><Pencil className="size-4" /></Button>
          </Link>
          <ConfirmDialog
            trigger={<Button variant="ghost" size="icon"><Trash2 className="size-4 text-destructive" /></Button>}
            title={`Delete ${t.title}?`}
            description={
              t.featured || t.status === "published"
                ? `This trip is ${[t.featured && "Featured", t.status === "published" && "Published"].filter(Boolean).join(" and ")}. You'll be asked to confirm again before it's removed.`
                : "This permanently removes the trip and its itinerary, gallery, and pricing."
            }
            onConfirm={() => handleDelete(t._id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trips</h1>
          <p className="text-sm text-muted-foreground">Manage every bookable trip on the platform.</p>
        </div>
        <Link href="/admin/trips/new">
          <Button><Plus className="size-4" /> Add Trip</Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <Input placeholder="Search trips…" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} rows={trips} loading={loading} rowKey={(t) => t._id} emptyMessage="No trips yet." />

      {!loading && total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} trips
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
