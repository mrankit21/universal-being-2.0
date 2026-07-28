"use client";

/**
 * Shared client-side "remembered coupon" helper — the bridge between the
 * site-wide promo popup (`components/marketing/promo-offer-popup-form.tsx`)
 * and the booking form (`components/trip/booking-form.tsx`).
 *
 * Uses `localStorage`, not `sessionStorage`, on purpose: the popup's own
 * "show once per session" rule already lives in `sessionStorage`
 * (`use-promo-popup-trigger.ts`) and is intentionally short-lived, but a
 * visitor who copies a code, closes the tab, and comes back tomorrow to
 * book should still get it prefilled — remembering the coupon itself is a
 * convenience, not a re-engagement gate, so it can outlive the tab.
 *
 * Deliberately dumb (just a code string + timestamp): the booking form
 * always re-validates the code against the *specific trip* via
 * `/api/coupons/validate` before treating it as applied, so a stale or
 * no-longer-valid remembered code just fails validation instead of being
 * trusted blindly.
 */
const STORAGE_KEY = "ub_remembered_coupon_v1";
/** Don't keep prefilling a code forever — most promo coupons are
 * short-lived, so treat anything older than 7 days as stale. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface RememberedCoupon {
  code: string;
  savedAt: number;
}

export function rememberCoupon(code: string) {
  const trimmed = code.trim();
  if (!trimmed) return;
  try {
    const payload: RememberedCoupon = { code: trimmed, savedAt: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage can throw in locked-down/private-browsing contexts — the
    // booking form's manual coupon field still works without this.
  }
}

export function getRememberedCoupon(): string | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RememberedCoupon;
    if (!parsed?.code) return null;
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed.code;
  } catch {
    return null;
  }
}

export function forgetRememberedCoupon() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore — worst case the same code gets prefilled again next time.
  }
}
