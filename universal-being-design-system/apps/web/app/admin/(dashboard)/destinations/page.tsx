"use client";

/** Destination Management list (requirement #2). */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { Tag } from "@/components/primitives/tag";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { toast } from "sonner";

interface Destination {
  _id: string;
  slug: string;
  name: string;
  region: string;
  state: string;
  status: "draft" | "published";
  featured?: boolean;
  homepageVisible?: boolean;
  updatedAt: string;
}

export default function DestinationsListPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/destinations");
    const json = await res.json();
    if (json.success) setDestinations(json.data);
    else toast.error(json.error);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/destinations/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      toast.success("Destination deleted");
      setDestinations((prev) => prev.filter((d) => d._id !== id));
    } else {
      toast.error(json.error);
    }
  }

  /** Publish / Hide — the same PATCH the full editor uses, just scoped to
   * `status` so admins can flip a destination live (or pull it back to
   * draft, removing it from Homepage/Listing/Detail/Trip Assignment
   * everywhere at once) without opening the full form. */
  async function toggleStatus(destination: Destination) {
    const nextStatus = destination.status === "published" ? "draft" : "published";
    setTogglingId(destination._id);
    try {
      const res = await fetch(`/api/admin/destinations/${destination._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Couldn't update status");
        return;
      }
      toast.success(nextStatus === "published" ? `${destination.name} published` : `${destination.name} hidden`);
      setDestinations((prev) =>
        prev.map((d) => (d._id === destination._id ? { ...d, status: nextStatus } : d))
      );
    } finally {
      setTogglingId(null);
    }
  }

  const columns: Column<Destination>[] = [
    {
      header: "Name",
      cell: (d) => (
        <span className="flex items-center gap-2 font-medium">
          {d.name}
          {d.featured && <Tag tone="teal">Featured</Tag>}
        </span>
      ),
    },
    { header: "Slug", cell: (d) => <code className="text-xs text-muted-foreground">{d.slug}</code> },
    { header: "Region", cell: (d) => `${d.region}${d.state ? `, ${d.state}` : ""}` },
    { header: "Status", cell: (d) => <StatusBadge status={d.status} /> },
    {
      header: "Homepage",
      cell: (d) => (d.homepageVisible === false ? <span className="text-xs text-muted-foreground">Hidden</span> : <span className="text-xs text-muted-foreground">Visible</span>),
    },
    {
      header: "Actions",
      cell: (d) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            title={d.status === "published" ? "Hide (unpublish)" : "Publish"}
            disabled={togglingId === d._id}
            onClick={() => toggleStatus(d)}
          >
            {d.status === "published" ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
          <Link href={`/admin/destinations/${d._id}`}>
            <Button variant="ghost" size="icon"><Pencil className="size-4" /></Button>
          </Link>
          <ConfirmDialog
            trigger={<Button variant="ghost" size="icon"><Trash2 className="size-4 text-destructive" /></Button>}
            title={`Delete ${d.name}?`}
            description="This cannot be undone. Trips referencing this destination must be reassigned first."
            onConfirm={() => handleDelete(d._id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Destinations</h1>
          <p className="text-sm text-muted-foreground">Manage the places Universal Being runs trips to.</p>
        </div>
        <Link href="/admin/destinations/new">
          <Button><Plus className="size-4" /> Add Destination</Button>
        </Link>
      </div>
      <DataTable columns={columns} rows={destinations} loading={loading} rowKey={(d) => d._id} emptyMessage="No destinations yet." />
    </div>
  );
}
