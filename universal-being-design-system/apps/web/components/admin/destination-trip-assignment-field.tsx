"use client";

/**
 * DestinationTripAssignmentField — Step 7.6C-B Part 2's Destination ↔ Trip
 * relationship (Assign / Remove / Display Order / Featured Trips). Same
 * picker-dialog shape as `TripPickerField` (search the real Trip
 * collection, click to add) and the same `ArrayFieldEditor` reorder pattern
 * every other repeater in the Admin Panel uses.
 *
 * IMPORTANT — this intentionally never touches the Trip CMS itself. The
 * existing `PATCH /api/admin/trips/:id` route (unmodified, already accepts
 * a partial `{ destinationSlug, destinationName }` update) is the only way
 * a trip's destination link changes — "Assign" and "Remove" here just call
 * that existing endpoint. Only the destination-scoped extras (display
 * order, "featured within this destination") live in the `value` prop,
 * which is part of the Destination document itself and saved by the
 * surrounding `DestinationForm`'s normal Save action.
 */
import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/admin/status-badge";
import { ArrayFieldEditor } from "@/components/admin/array-field-editor";
import type { DestinationTripAssignment } from "@/types/destination";

interface AdminTripSummary {
  _id: string;
  slug: string;
  title: string;
  destinationSlug: string;
  destinationName: string;
  status: string;
}

interface AdminDestinationSummary {
  _id: string;
  slug: string;
  name: string;
}

export function DestinationTripAssignmentField({
  destinationId,
  destinationSlug,
  destinationName,
  value,
  onChange,
}: {
  /** Undefined on the "New Destination" form — a destination must exist
   * (and be saved) before trips can be assigned to it. */
  destinationId?: string;
  destinationSlug: string;
  destinationName: string;
  value: DestinationTripAssignment[];
  onChange: (next: DestinationTripAssignment[]) => void;
}) {
  const [assigned, setAssigned] = useState<AdminTripSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTrips, setPickerTrips] = useState<AdminTripSummary[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [removeTarget, setRemoveTarget] = useState<AdminTripSummary | null>(null);
  const [otherDestinations, setOtherDestinations] = useState<AdminDestinationSummary[]>([]);
  const [moveToSlug, setMoveToSlug] = useState("");
  const [removing, setRemoving] = useState(false);

  const loadAssigned = useCallback(async () => {
    if (!destinationSlug) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/trips?destinationSlug=${encodeURIComponent(destinationSlug)}&limit=100`);
      const json = await res.json();
      if (json.success) setAssigned(json.data.trips);
    } catch {
      toast.error("Couldn't load assigned trips — check your connection");
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [destinationSlug]);

  useEffect(() => {
    loadAssigned();
  }, [loadAssigned]);

  // Keep `value` (order/featured metadata) in sync — drop stale entries for
  // trips no longer assigned here, add fresh entries (order = end of list)
  // for trips assigned since the metadata was last saved.
  useEffect(() => {
    if (!loaded || loading) return;
    const assignedSlugs = new Set(assigned.map((t) => t.slug));
    const existingSlugs = new Set(value.map((a) => a.tripSlug));
    let next = value.filter((a) => assignedSlugs.has(a.tripSlug));
    const maxOrder = next.reduce((m, a) => Math.max(m, a.order), -1);
    let cursor = maxOrder;
    for (const trip of assigned) {
      if (!existingSlugs.has(trip.slug) && !next.some((a) => a.tripSlug === trip.slug)) {
        cursor += 1;
        next = [...next, { tripSlug: trip.slug, order: cursor, featured: false }];
      }
    }
    if (next.length !== value.length || next.some((a, i) => a.tripSlug !== value[i]?.tripSlug)) {
      onChange(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assigned, loading, loaded]);

  const loadPicker = useCallback(async () => {
    setPickerLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/admin/trips?${params.toString()}`);
      const json = await res.json();
      if (json.success) setPickerTrips(json.data.trips);
    } catch {
      toast.error("Couldn't load trips — check your connection");
    } finally {
      setPickerLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (pickerOpen) {
      const t = setTimeout(loadPicker, 200);
      return () => clearTimeout(t);
    }
  }, [pickerOpen, loadPicker]);

  async function assignTrip(trip: AdminTripSummary) {
    try {
      const res = await fetch(`/api/admin/trips/${trip._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinationSlug, destinationName }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Couldn't assign that trip");
        return;
      }
      toast.success(`${trip.title} assigned to ${destinationName}`);
      await loadAssigned();
    } catch {
      toast.error("Couldn't assign that trip");
    }
  }

  async function openRemove(trip: AdminTripSummary) {
    setRemoveTarget(trip);
    setMoveToSlug("");
    try {
      const res = await fetch(`/api/admin/destinations`);
      const json = await res.json();
      if (json.success) {
        setOtherDestinations(
          (json.data as AdminDestinationSummary[]).filter((d) => d.slug !== destinationSlug)
        );
      }
    } catch {
      setOtherDestinations([]);
    }
  }

  async function confirmRemove() {
    if (!removeTarget || !moveToSlug) return;
    const target = otherDestinations.find((d) => d.slug === moveToSlug);
    if (!target) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/admin/trips/${removeTarget._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinationSlug: target.slug, destinationName: target.name }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Couldn't remove that trip");
        return;
      }
      toast.success(`${removeTarget.title} moved to ${target.name}`);
      onChange(value.filter((a) => a.tripSlug !== removeTarget.slug));
      setRemoveTarget(null);
      await loadAssigned();
    } catch {
      toast.error("Couldn't remove that trip");
    } finally {
      setRemoving(false);
    }
  }

  if (!destinationId) {
    return (
      <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
        Save this destination first — trips can be assigned once it exists.
      </p>
    );
  }

  const orderedSlugs = value.map((a) => a.tripSlug);
  const orderedAssigned = assigned
    .slice()
    .sort((a, b) => orderedSlugs.indexOf(a.slug) - orderedSlugs.indexOf(b.slug));
  const assignedSlugSet = new Set(assigned.map((t) => t.slug));

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <ArrayFieldEditor<DestinationTripAssignment>
          items={value.filter((a) => assignedSlugSet.has(a.tripSlug))}
          onChange={onChange}
          draggable
          createItem={() => ({ tripSlug: "", order: 0, featured: false })}
          hideAdd
          emptyMessage="No trips assigned yet. Assign trips from the picker below."
          renderItem={(assignment, _index, update) => {
            const trip = orderedAssigned.find((t) => t.slug === assignment.tripSlug);
            if (!trip) return null;
            return (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{trip.title}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <StatusBadge status={trip.status} />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Star className="size-3.5 text-muted-foreground" />
                    <Switch checked={assignment.featured} onCheckedChange={(v) => update({ featured: v })} />
                    <span className="text-xs text-muted-foreground">Featured</span>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => openRemove(trip)}>
                    <X className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          }}
        />
      )}

      <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
        <Plus className="size-4" />
        Assign Trip
      </Button>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign a Trip to {destinationName}</DialogTitle>
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
          {pickerLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : pickerTrips.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No trips found.</p>
          ) : (
            <div className="max-h-96 space-y-1 overflow-y-auto">
              {pickerTrips.map((trip) => {
                const isHere = trip.destinationSlug === destinationSlug;
                return (
                  <button
                    key={trip._id}
                    type="button"
                    disabled={isHere}
                    onClick={() => assignTrip(trip)}
                    className="flex w-full items-center justify-between rounded-md border border-border p-3 text-left text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span>
                      <span className="font-medium">{trip.title}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {isHere ? "Already here" : trip.destinationName} · {trip.status}
                      </span>
                    </span>
                    {isHere ? <X className="size-4 text-muted-foreground" /> : <Plus className="size-4 text-muted-foreground" />}
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {removeTarget?.title} from {destinationName}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Every trip must belong to a destination. Choose where to move this trip — it will
            disappear from {destinationName}&apos;s page immediately.
          </p>
          <Select value={moveToSlug} onValueChange={setMoveToSlug}>
            <SelectTrigger><SelectValue placeholder="Move to destination…" /></SelectTrigger>
            <SelectContent>
              {otherDestinations.map((d) => (
                <SelectItem key={d.slug} value={d.slug}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setRemoveTarget(null)} disabled={removing}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmRemove} disabled={!moveToSlug || removing}>
              {removing ? "Moving…" : "Remove & Move"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
