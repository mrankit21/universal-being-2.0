"use client";

/** Itinerary dashboard (Admin Panel): one place to see every trip's
 * day-by-day itinerary status and jump straight into editing it — instead
 * of digging through the full Trip edit form to find the Itinerary tab.
 * Reuses the same `/api/admin/trips` list endpoint as the Trips screen. */
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Pencil, MapPinned } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/primitives/tag";
import { toast } from "sonner";

interface ItineraryDay {
  day: number;
  title: string;
  location?: string;
}

interface TripRow {
  _id: string;
  title: string;
  slug: string;
  destinationName: string;
  status: "draft" | "published" | "archived";
  itinerary: ItineraryDay[];
}

function bannerCount(itinerary: ItineraryDay[]): number {
  let count = 0;
  let lastLocation: string | undefined;
  for (const day of itinerary) {
    if (day.location && day.location !== lastLocation) count += 1;
    lastLocation = day.location || undefined;
  }
  return count;
}

export default function ItineraryDashboardPage() {
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("limit", "100");
    const res = await fetch(`/api/admin/trips?${params.toString()}`);
    const json = await res.json();
    if (json.success) setTrips(json.data.trips);
    else toast.error(json.error);
    setLoading(false);
  }, [query]);

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [load]);

  const columns: Column<TripRow>[] = [
    {
      header: "Trip",
      cell: (t) => (
        <div>
          <p className="font-medium">{t.title}</p>
          <p className="text-xs text-muted-foreground">{t.destinationName}</p>
        </div>
      ),
    },
    { header: "Days planned", cell: (t) => t.itinerary?.length ?? 0 },
    {
      header: "Destination banners",
      cell: (t) => {
        const count = bannerCount(t.itinerary ?? []);
        return count > 0 ? (
          <Tag tone="brass" className="gap-1">
            <MapPinned className="size-3" /> {count} set
          </Tag>
        ) : (
          <Tag tone="neutral">Not set</Tag>
        );
      },
    },
    {
      header: "Status",
      cell: (t) => <Tag tone={t.status === "published" ? "teal" : "neutral"}>{t.status}</Tag>,
    },
    {
      header: "Actions",
      cell: (t) => (
        <Link href={`/admin/trips/${t._id}?tab=itinerary`}>
          <Button variant="outline" size="sm">
            <Pencil className="size-4" /> Edit itinerary
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Itinerary</h1>
        <p className="text-sm text-muted-foreground">
          Edit every trip&apos;s day-by-day itinerary — locations, descriptions, and per-day photos — from one place.
        </p>
      </div>

      <Input placeholder="Search trips…" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" />

      <DataTable columns={columns} rows={trips} loading={loading} rowKey={(t) => t._id} emptyMessage="No trips yet." />
    </div>
  );
}
