"use client";

import * as React from "react";
import { useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { getResponsiveDensity } from "@/lib/theme/theme-engine";
import type { ThemeParticleConfig } from "@/types/theme";

export interface ParticleFieldProps {
  config: ThemeParticleConfig;
  className?: string;
}

interface Particle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  scale: number;
  drift: number;
}

/** Per-type CSS animation name — the only "switch" in this file, and it
 * switches on the generic `type` field, never on a theme key. A future
 * theme reusing an existing type (e.g. a new desert mood using
 * "gold-dust") needs zero changes here. */
const ANIMATION_BY_TYPE: Record<ThemeParticleConfig["type"], string> = {
  "gold-dust": "ub-particle-fall",
  snow: "ub-particle-fall",
  rain: "ub-particle-rain",
  leaves: "ub-particle-drift",
  birds: "ub-particle-glide",
  ice: "ub-particle-fall",
  "lantern-glow": "ub-particle-rise",
  none: "",
};

const SHAPE_CLASS_BY_TYPE: Record<ThemeParticleConfig["type"], string> = {
  "gold-dust": "size-1 rounded-full",
  snow: "size-1.5 rounded-full",
  rain: "h-4 w-px",
  leaves: "size-2 rounded-[2px]",
  birds: "h-1 w-2.5 rounded-full",
  ice: "size-1 rounded-full",
  "lantern-glow": "size-2.5 rounded-full shadow-[0_0_10px_3px_rgba(240,194,106,0.55)]",
  none: "",
};

/**
 * ParticleField — Architecture §4/§8: "theme-driven ambient motion
 * (snow/gold-dust/rain), capped density, prefers-reduced-motion aware."
 * GPU-only: animates transform + opacity, nothing else, so it never
 * triggers layout. Renders nothing until mounted client-side so the
 * randomized particle layout can never mismatch server vs. client HTML.
 */
export function ParticleField({ config, className }: ParticleFieldProps) {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);
  const [viewportWidth, setViewportWidth] = React.useState(1280);

  React.useEffect(() => {
    setMounted(true);
    const update = () => setViewportWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const particles = React.useMemo<Particle[]>(() => {
    if (config.type === "none") return [];
    const count = getResponsiveDensity(config.density, viewportWidth);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * config.speed,
      duration: config.speed * (0.7 + Math.random() * 0.6),
      scale: 0.6 + Math.random() * 0.8,
      drift: Math.random() * 40 - 20,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.type, config.density, config.speed, viewportWidth, mounted]);

  if (!mounted || prefersReducedMotion || config.type === "none" || particles.length === 0) {
    return null;
  }

  const animationName = ANIMATION_BY_TYPE[config.type];
  const shapeClass = SHAPE_CLASS_BY_TYPE[config.type];

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className={cn("absolute top-[-5%] opacity-0", shapeClass)}
          style={{
            left: `${p.left}%`,
            backgroundColor: config.color,
            transform: `scale(${p.scale})`,
            animation: `${animationName} ${p.duration}s linear ${p.delay}s infinite`,
            // Custom property read by the keyframes for horizontal sway/glide distance.
            ["--ub-particle-drift" as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
