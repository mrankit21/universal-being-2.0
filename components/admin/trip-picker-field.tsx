"use client";

/**
 * TripPickerField — Step 7.6C-B Part 1's "Choose Trips / Remove / Reorder /
 * Enable / Disable" requirement for Homepage → Featured Trips. Same picker
 * dialog shape as `ImageAssetField` (search the real collection, click to
 * add), reordering/removal reuses `ArrayFieldEditor` (drag-and-drop +
 * up/down, same component every other repeater in the Admin Panel uses).
 */
import { useCallback, useEffect, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrayFieldEditor } from "@/components/admin/array-field-editor";

export interface FeaturedTripEntry {
  tripSlug: string;
  enabled: boolean;
}

interface AdminTripSummary {
  _id: string;
  slug: string;
  title: string;
  destinationName: string;
  status: string;
}

export function TripPickerField({
  items,
  onChange,
}: {
  items: FeaturedTripEntry[];
  onChange: (next: FeaturedTripEntry[]) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [trips, setTrips] = useState<AdminTripSummary[]>([]);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/admin/trips?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setTrips(json.data.trips);
        setLabels((prev) => {
          const next = { ...prev };
          for (const t of json.data.trips as AdminTripSummary[]) next[t.slug] = t.title;
          return next;
        });
      }
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (pickerOpen) {
      const t = setTimeout(load, 200);
      return () => clearTimeout(t);
    }
  }, [pickerOpen, load]);

  function addTrip(slug: string) {
    if (items.some((i) => i.tripSlug === slug)) return;
    onChange([...items, { tripSlug: slug, enabled: true }]);
  }

  const chosenSlugs = new Set(items.map((i) => i.tripSlug));

  return (
    <div className="space-y-3">
      <ArrayFieldEditor<FeaturedTripEntry>
        items={items}
        onChange={onChange}
        draggable
        createItem={() => ({ tripSlug: "", enabled: true })}
        hideAdd
        emptyMessage="No trips chosen yet. Add trips from the picker below."
        renderItem={(item, _index, update) => (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{labels[item.tripSlug] ?? item.tripSlug}</p>
              <p className="text-xs text-muted-foreground">{item.tripSlug}</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={item.enabled} onCheckedChange={(v) => update({ enabled: v })} />
              <span className="text-xs text-muted-foreground">{item.enabled ? "Enabled" : "Disabled"}</span>
            </div>
          </div>
        )}
      />
      <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
        <Plus className="size-4" />
        Choose Trips
      </Button>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose Trips</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search trips by title…"
              className="pl-8"
            />
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : trips.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No trips found.</p>
          ) : (
            <div className="max-h-96 space-y-1 overflow-y-auto">
              {trips.map((trip) => {
                const isChosen = chosenSlugs.has(trip.slug);
                return (
                  <button
                    key={trip._id}
                    type="button"
                    disabled={isChosen}
                    onClick={() => addTrip(trip.slug)}
                    className="flex w-full items-center justify-between rounded-md border border-border p-3 text-left text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span>
                      <span className="font-medium">{trip.title}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{trip.destinationName} · {trip.status}</span>
                    </span>
                    {isChosen ? <X className="size-4 text-muted-foreground" /> : <Plus className="size-4 text-muted-foreground" />}
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
