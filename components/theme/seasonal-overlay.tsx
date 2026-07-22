"use client";

import { useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import type { ThemeOverlayConfig } from "@/types/theme";

export interface SeasonalOverlayProps {
  config: ThemeOverlayConfig;
  className?: string;
}

/**
 * SeasonalOverlay — Architecture §4: "purely presentational ... all SVG
 * motif swaps, not separate components." Reads only the three boolean
 * overlay flags; a new theme that wants fog just sets `overlay.fog = true`
 * and this component already knows how to render it — no new component,
 * no theme-name branch.
 */
export function SeasonalOverlay({ config, className }: SeasonalOverlayProps) {
  const prefersReducedMotion = useReducedMotion();
  if (!config.fog && !config.waves && !config.frost) return null;

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      {config.fog && (
        <div
          className={cn(
            "absolute inset-x-[-10%] top-1/3 h-1/3 bg-[image:var(--ub-theme-gradient-section)] opacity-30 blur-2xl",
            !prefersReducedMotion && "animate-[ub-fog-drift_18s_ease-in-out_infinite]"
          )}
        />
      )}

      {config.waves && (
        <svg
          className={cn(
            "absolute inset-x-0 bottom-0 h-24 w-full text-[color:var(--ub-theme-primary)] opacity-25",
            !prefersReducedMotion && "animate-[ub-wave-bob_6s_ease-in-out_infinite]"
          )}
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M0,64 C300,120 600,0 900,56 C1050,84 1150,72 1200,56 L1200,120 L0,120 Z" />
        </svg>
      )}

      {config.frost && (
        <div className="absolute inset-0 shadow-[inset_0_0_140px_40px_var(--ub-theme-background)] opacity-40" />
      )}
    </div>
  );
}
