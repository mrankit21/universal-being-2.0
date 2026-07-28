"use client";

import * as React from "react";

const SESSION_KEY = "ub_promo_popup_seen_v1";

export interface UsePromoPopupTriggerOptions {
  /** Delay before the popup opens, in ms. Requirement: 10–15s after landing. */
  delayMs?: number;
  /** Skip scheduling entirely — e.g. on /admin routes. */
  disabled?: boolean;
}

export interface UsePromoPopupTriggerResult {
  isOpen: boolean;
  close: () => void;
}

/**
 * usePromoPopupTrigger — owns the "show once per session, after a delay"
 * rule for the promotional popup, independent of how the popup itself is
 * rendered. Session-scoped (sessionStorage, not localStorage) on purpose:
 * requirement #1 says "don't show it again until the next session," and a
 * browser/tab session is exactly what sessionStorage tracks — it survives
 * refresh and SPA navigation but clears when the tab closes.
 *
 * Marks the session as "seen" the moment the popup is scheduled to open
 * (not on close) so a visitor who closes it, or simply never interacts
 * with it, still won't see it again if they reload mid-session.
 */
export function usePromoPopupTrigger({
  delayMs = 12000,
  disabled = false,
}: UsePromoPopupTriggerOptions = {}): UsePromoPopupTriggerResult {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (disabled) return;

    let alreadySeen = false;
    try {
      alreadySeen = window.sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      // Storage can throw in locked-down/private-browsing contexts — fail
      // safe by treating it as "not seen yet" rather than crashing.
    }
    if (alreadySeen) return;

    const timer = window.setTimeout(() => {
      try {
        window.sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // Ignore — worst case the popup can reappear on a later reload.
      }
      setIsOpen(true);
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [delayMs, disabled]);

  const close = React.useCallback(() => setIsOpen(false), []);

  return { isOpen, close };
}
