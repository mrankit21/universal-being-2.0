"use client";

/** Trip 2.0 Management list — mirrors `app/admin/(dashboard)/trips/page.tsx`
 * (search, status filter, delete), scoped to `Trip2Model`. The original
 * Trip Editor and its list are completely untouched by this — Trip 2.0
 * pages are a separate collection managed from here, live at
 * `/trip2/[slug]` once published. */
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DataTable, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { toast } from "sonner";

interface Trip2Row {
  _id: string;
  slug: string;
  status: "draft" | "published";
  title: string;
  location?: string;
  durationLabel?: string;
  updatedAt: string;
}

export default function Trip2ListPage() {
  const [trips, setTrips] = useState<Trip2Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (status !== "all") params.set("status", status);
    const res = await fetch(`/api/admin/trip2?${params.toString()}`);
    const json = await res.json();
    if (json.success) setTrips(json.data.trips);
    else toast.error(json.error);
    setLoading(false);
  }, [query, status]);

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [load]);

  async function togglePublish(trip: Trip2Row) {
    const nextStatus: "draft" | "published" = trip.status === "published" ? "draft" : "published";
    const res = await fetch(`/api/admin/trip2/${trip._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const json = await res.json();
    if (json.success) {
      setTrips((prev) => prev.map((t) => (t._id === trip._id ? { ...t, status: nextStatus } : t)));
      toast.success(nextStatus === "published" ? "Trip 2.0 page published" : "Trip 2.0 page moved to draft");
    } else {
      toast.error(json.error);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete "${title || "this Trip 2.0 page"}"? This can't be undone.`)) return;
    const res = await fetch(`/api/admin/trip2/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      toast.success("Trip 2.0 page deleted");
      setTrips((prev) => prev.filter((t) => t._id !== id));
    } else {
      toast.error(json.error);
    }
  }

  const columns: Column<Trip2Row>[] = [
    { header: "Title", cell: (row) => <span className="font-medium">{row.title || <span className="text-muted-foreground">Untitled</span>}</span> },
    { header: "Slug", cell: (row) => <code className="text-xs text-muted-foreground">/trip2/{row.slug}</code> },
    { header: "Location", cell: (row) => row.location || "—" },
    { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    {
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => togglePublish(row)}>
            {row.status === "published" ? "Unpublish" : "Publish"}
          </Button>
          {row.status === "published" ? (
            <Button variant="ghost" size="icon" asChild title="View live page">
              <Link href={`/trip2/${row.slug}`} target="_blank">
                <ExternalLink className="size-4" />
              </Link>
            </Button>
          ) : null}
          <Button variant="ghost" size="icon" asChild title="Edit">
            <Link href={`/admin/trip2/${row._id}`}><Pencil className="size-4" /></Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row._id, row.title)} title="Delete">
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trip 2.0</h1>
          <p className="text-sm text-muted-foreground">
            The new trip page design — hero, quick links, gallery, itinerary, price, batch dates, and more, all editable
            here. Live at <code className="text-xs">/trip2/[slug]</code> once published. The original Trip Editor is
            unaffected.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/trip2/new"><Plus className="mr-2 size-4" />New Trip 2.0 Page</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Search title or slug…" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} rows={trips} loading={loading} rowKey={(row) => row._id} emptyMessage="No Trip 2.0 pages yet — create one to get started." />
    </div>
  );
}
