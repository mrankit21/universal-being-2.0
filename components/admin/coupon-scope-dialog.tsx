"use client";

import * as React from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { TripMultiSelect } from "@/components/admin/trip-multi-select";

export interface CouponScopeDialogCoupon {
  _id: string;
  code: string;
  showInPopup: boolean;
  tripIds: string[];
}

export interface CouponScopeDialogProps {
  coupon: CouponScopeDialogCoupon | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

/**
 * CouponScopeDialog — the "Manage" surface opened from a row in the
 * Coupons admin table. Two independent settings live here:
 *
 * 1. Show in Popup — the on/off switch for the site-wide promo popup
 *    (`components/marketing/promo-offer-popup.tsx`). Turning this on here
 *    is enforced server-side (`/api/admin/coupons/[id]` PATCH) to turn it
 *    off on every other coupon, so there's only ever one popup coupon.
 * 2. Applies to — All trips vs a specific set, i.e. `Coupon.tripIds`. An
 *    empty array means global (matches `lib/coupons/validate-coupon.ts`'s
 *    existing "tripIds.length === 0 → valid everywhere" rule), so this is
 *    just a friendlier UI over a field the Booking Engine already reads.
 */
export function CouponScopeDialog({ coupon, onOpenChange, onSaved }: CouponScopeDialogProps) {
  const [showInPopup, setShowInPopup] = React.useState(false);
  const [scope, setScope] = React.useState<"all" | "specific">("all");
  const [tripIds, setTripIds] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!coupon) return;
    setShowInPopup(coupon.showInPopup);
    setScope(coupon.tripIds.length > 0 ? "specific" : "all");
    setTripIds(coupon.tripIds);
  }, [coupon]);

  async function handleSave() {
    if (!coupon) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/coupons/${coupon._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showInPopup,
          tripIds: scope === "all" ? [] : tripIds,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Could not save.");
        return;
      }
      toast.success(`${coupon.code} updated.`);
      onSaved();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!coupon} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>Manage {coupon?.code}</DialogTitle>
        <DialogDescription>Control where this coupon shows up and which trips it applies to.</DialogDescription>

        <div className="space-y-5 pt-2">
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="show-in-popup">Show in Popup</Label>
              <p className="text-xs text-muted-foreground">
                Only one coupon can be shown in the site-wide popup at a time.
              </p>
            </div>
            <Switch id="show-in-popup" checked={showInPopup} onCheckedChange={setShowInPopup} />
          </div>

          <div className="space-y-2">
            <Label>Applies to</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as "all" | "specific")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All trips</SelectItem>
                <SelectItem value="specific">Specific trips</SelectItem>
              </SelectContent>
            </Select>
            {scope === "specific" ? <TripMultiSelect value={tripIds} onChange={setTripIds} /> : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
