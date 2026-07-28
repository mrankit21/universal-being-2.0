"use client";

import * as React from "react";

export interface PopupActiveCoupon {
  code: string;
  description?: string;
  type: "percentage" | "flat";
  value: number;
  /** Resolved trip titles (not IDs) when the coupon is trip-scoped; empty
   * array means the coupon is valid on every trip. */
  tripNames: string[];
  /** Set only when the coupon is scoped to exactly one trip — lets the
   * popup send the visitor straight to that trip's page after they claim
   * the offer. `null` for all-trips or multi-trip coupons. */
  singleTripSlug: string | null;
}

export interface UsePopupActiveCouponResult {
  /** `undefined` while loading, `null` once loaded if no coupon is flagged
   * "Show in Popup" in the admin Coupons page — either state means the
   * popup should not open yet. */
  coupon: PopupActiveCoupon | null | undefined;
}

/**
 * usePopupActiveCoupon — reads `/api/coupons/popup-active`, the public
 * endpoint backed by the admin Coupons page's "Show in Popup" toggle. This
 * is the actual on/off switch for the whole promo popup: if no coupon is
 * flagged, this resolves to `null` and `PromoOfferPopup` never opens,
 * regardless of the delay timer.
 */
export function usePopupActiveCoupon(): UsePopupActiveCouponResult {
  const [coupon, setCoupon] = React.useState<PopupActiveCoupon | null | undefined>(undefined);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/coupons/popup-active")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled) setCoupon(json?.success ? json.data : null);
      })
      .catch(() => {
        if (!cancelled) setCoupon(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { coupon };
}
