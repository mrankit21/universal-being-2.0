"use client";

/**
 * TripPickerField — Step 7.6C-B Part 1's "Choose Trips / Remove / Reorder /
 * Enable / Disable" requirement for Homepage → Featured Trips. Same picker
 * dialog shape as `ImageAssetField` (search the real collection, click to
 * add), reordering/removal reuses `ArrayFieldEditor` (drag-and-drop +
 * up/down, same component every other repeater in the Admin Panel uses).
 *
 * Trips-version aware (2026-08 fix): the live homepage resolves Featured
 * Trips against Trip 2.0 whenever Site Settings → "Trips Version" is
 * forced to "v2" (`getResolvedHomepage2` in `lib/api/home2.ts`) — a slug
 * chosen from the old Trip 1.0 collection simply won't match anything
 * there, silently falling back to "every published Trip 2.0 trip" instead
 * of the admin's actual picks. This field now checks that same site
 * setting on load and searches whichever collection (`/api/admin/trips`
 * or `/api/admin/trip2`) is actually live, so what you pick here is what
 * shows up on the homepage.
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
  /** Trip 1.0 summaries use `destinationName`, Trip 2.0 uses `location` —
   * normalized to this single field so the picker UI doesn't care which
   * collection it's searching. */
  subtitle: string;
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
  // Which collection is actually live on the homepage right now — decides
  // both the picker's search endpoint and the helper text shown above it.
  const [tripsVersion, setTripsVersion] = useState<"v1" | "v2" | null>(null);

  useEffect(() => {
    fetch("/api/admin/site-settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setTripsVersion(json.data.activeTripsVersion === "v2" ? "v2" : "v1");
        else setTripsVersion("v1");
      })
      .catch(() => setTripsVersion("v1"));
  }, []);

  const load = useCallback(async () => {
    if (!tripsVersion) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (search.trim()) params.set("q", search.trim());
      const endpoint = tripsVersion === "v2" ? "/api/admin/trip2" : "/api/admin/trips";
      const res = await fetch(`${endpoint}?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        const normalized: AdminTripSummary[] = json.data.trips.map(
          (t: { _id: string; slug: string; title: string; destinationName?: string; location?: string; status: string }) => ({
            _id: t._id,
            slug: t.slug,
            title: t.title,
            subtitle: t.destinationName ?? t.location ?? "",
            status: t.status,
          })
        );
        setTrips(normalized);
        setLabels((prev) => {
          const next = { ...prev };
          for (const t of normalized) next[t.slug] = t.title;
          return next;
        });
      }
    } finally {
      setLoading(false);
    }
  }, [search, tripsVersion]);

  useEffect(() => {
    if (pickerOpen && tripsVersion) {
      const t = setTimeout(load, 200);
      return () => clearTimeout(t);
    }
  }, [pickerOpen, tripsVersion, load]);

  function addTrip(slug: string) {
    if (items.some((i) => i.tripSlug === slug)) return;
    onChange([...items, { tripSlug: slug, enabled: true }]);
  }

  const chosenSlugs = new Set(items.map((i) => i.tripSlug));

  return (
    <div className="space-y-3">
      {tripsVersion ? (
        <p className="text-xs text-muted-foreground">
          Searching <strong>{tripsVersion === "v2" ? "Trip 2.0" : "Trip 1.0"}</strong> pages — the collection
          currently live on the site (Site Settings → Trips Version).
        </p>
      ) : null}
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
                      <span className="ml-2 text-xs text-muted-foreground">{trip.subtitle} · {trip.status}</span>
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
