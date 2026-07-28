"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";

export interface TripOption {
  _id: string;
  title: string;
}

export interface TripMultiSelectProps {
  value: string[];
  onChange: (tripIds: string[]) => void;
}

/**
 * TripMultiSelect — the "which trips does this coupon apply to" picker used
 * by both the coupon create form and the per-coupon scope/popup edit
 * dialog. Fetches from `/api/admin/trips` (the same admin-only list the
 * Trips page itself uses) rather than the public `lib/api/trips.ts`, since
 * this needs drafts included too — an admin should be able to attach a
 * coupon to a trip before it's published.
 */
export function TripMultiSelect({ value, onChange }: TripMultiSelectProps) {
  const [trips, setTrips] = React.useState<TripOption[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/trips?limit=100")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.success) setTrips(json.data.trips);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function toggle(tripId: string, checked: boolean) {
    onChange(checked ? [...value, tripId] : value.filter((id) => id !== tripId));
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading trips…
      </div>
    );
  }

  if (trips.length === 0) {
    return <p className="py-3 text-sm text-muted-foreground">No trips found.</p>;
  }

  return (
    <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-border p-3">
      {trips.map((trip) => (
        <label key={trip._id} className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={value.includes(trip._id)}
            onCheckedChange={(checked) => toggle(trip._id, checked === true)}
          />
          {trip.title}
        </label>
      ))}
    </div>
  );
}
