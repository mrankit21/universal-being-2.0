"use client";

import * as React from "react";
import { useCustomerAuth } from "@/components/layout/customer-auth-context";

export type SavedItemType = "trip" | "destination";

interface SavedContextValue {
  isLoading: boolean;
  isSaved: (itemType: SavedItemType, itemSlug: string) => boolean;
  /** Toggles save state optimistically, reverting on a failed request.
   * Returns "login-required" if there's no logged-in customer, so
   * callers (SaveButton) know to open the login modal instead. */
  toggle: (itemType: SavedItemType, itemSlug: string) => Promise<"saved" | "unsaved" | "login-required" | "error">;
}

const SavedContext = React.createContext<SavedContextValue | null>(null);

function keyOf(itemType: SavedItemType, itemSlug: string) {
  return `${itemType}:${itemSlug}`;
}

/**
 * SavedProvider — same one-fetch-on-mount shape as CustomerAuthProvider.
 * Mounted once in RootShell so every TripCard/DestinationCard heart
 * button shares one `Set<string>` of saved keys instead of each card
 * hitting `/api/saved` itself. Re-fetches whenever the customer logs
 * in/out (their saved set is obviously different) via the `customer.id`
 * dependency.
 */
export function SavedProvider({ children }: { children: React.ReactNode }) {
  const { customer } = useCustomerAuth();
  const [saved, setSaved] = React.useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetch("/api/saved")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled || !json?.success) return;
        const items: { itemType: SavedItemType; itemSlug: string }[] = json.data;
        setSaved(new Set(items.map((item) => keyOf(item.itemType, item.itemSlug))));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [customer?.id]);

  const isSaved = React.useCallback((itemType: SavedItemType, itemSlug: string) => saved.has(keyOf(itemType, itemSlug)), [saved]);

  const toggle = React.useCallback(
    async (itemType: SavedItemType, itemSlug: string) => {
      if (!customer) return "login-required" as const;

      const key = keyOf(itemType, itemSlug);
      const wasSaved = saved.has(key);

      // Optimistic update
      setSaved((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(key);
        else next.add(key);
        return next;
      });

      try {
        const res = wasSaved
          ? await fetch(`/api/saved/${itemType}/${itemSlug}`, { method: "DELETE" })
          : await fetch("/api/saved", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ itemType, itemSlug }),
            });

        if (!res.ok) throw new Error("Request failed");
        return wasSaved ? ("unsaved" as const) : ("saved" as const);
      } catch {
        // Revert the optimistic update
        setSaved((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(key);
          else next.delete(key);
          return next;
        });
        return "error" as const;
      }
    },
    [customer, saved]
  );

  const value = React.useMemo(() => ({ isLoading, isSaved, toggle }), [isLoading, isSaved, toggle]);

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved(): SavedContextValue {
  const ctx = React.useContext(SavedContext);
  if (!ctx) throw new Error("useSaved must be used within a SavedProvider");
  return ctx;
}
