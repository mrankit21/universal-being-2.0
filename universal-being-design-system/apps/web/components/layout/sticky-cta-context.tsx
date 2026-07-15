"use client";

import * as React from "react";

import type { StickyCtaAction } from "@/types/layout";

interface StickyCtaContextValue {
  actions: StickyCtaAction[];
  /** A future trip/booking page calls this to populate the bar. Empty
   * array or never calling it at all means the bar renders nothing —
   * this is the "visible only when required" mechanism. */
  show: (actions: StickyCtaAction[]) => void;
  clear: () => void;
}

const StickyCtaContext = React.createContext<StickyCtaContextValue | null>(null);

/**
 * StickyCtaProvider — mounted once in RootShell (Phase 4 rule: "future
 * pages must automatically inherit this layout"). A page opts in by
 * calling `useStickyCta().show([...])` in an effect; navigating away
 * should call `clear()` (or the page can return a cleanup effect) so the
 * bar doesn't leak into unrelated routes.
 */
export function StickyCtaProvider({ children }: { children: React.ReactNode }) {
  const [actions, setActions] = React.useState<StickyCtaAction[]>([]);

  const show = React.useCallback((next: StickyCtaAction[]) => setActions(next), []);
  const clear = React.useCallback(() => setActions([]), []);

  const value = React.useMemo(() => ({ actions, show, clear }), [actions, show, clear]);

  return <StickyCtaContext.Provider value={value}>{children}</StickyCtaContext.Provider>;
}

export function useStickyCta(): StickyCtaContextValue {
  const ctx = React.useContext(StickyCtaContext);
  if (!ctx) throw new Error("useStickyCta must be used within a StickyCtaProvider");
  return ctx;
}
