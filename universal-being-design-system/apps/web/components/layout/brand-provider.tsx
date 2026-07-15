"use client";

import * as React from "react";

import type { SiteBrand } from "@/lib/api/site-brand";

const BrandContext = React.createContext<SiteBrand | null>(null);

/**
 * BrandProvider — same shape as ThemeProvider: `app/layout.tsx` resolves
 * the brand once server-side via `getSiteBrand()` (DB first, static seed
 * as fallback) and hands it down as a prop, so server-rendered HTML and
 * the first client render always agree (no hydration mismatch, no flash
 * of the wrong/missing logo).
 */
export function BrandProvider({ brand, children }: { brand: SiteBrand; children: React.ReactNode }) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand(): SiteBrand {
  const ctx = React.useContext(BrandContext);
  if (!ctx) {
    throw new Error("useBrand must be used within a BrandProvider (app/layout.tsx wraps RootShell in one).");
  }
  return ctx;
}
