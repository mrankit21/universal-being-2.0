"use client";

/** Tiny client boundary that ONLY reads the pathname to decide whether to
 * render its children on /admin routes. Deliberately imports nothing else
 * — `children` (e.g. <SiteFooter />, which fetches from MongoDB via
 * mongoose) is rendered server-side by the parent Server Component and
 * passed down as an already-built element tree. If this file imported
 * SiteFooter directly instead of receiving it as `children`, webpack would
 * try to bundle mongoose/mongodb (Node-only, needs `net`) for the browser
 * and the dev server would crash with "Module not found: Can't resolve
 * 'net'". Keep this file free of any non-UI imports. */
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function HideOnAdmin({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;

  if (isAdminRoute) return null;
  return <>{children}</>;
}
