"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, Tag, Ticket, Clock, PartyPopper, X, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AnnouncementConfig, AnnouncementKind } from "@/types/layout";

/** Icon per announcement kind — purely presentational, resolved from the
 * config's `kind` field, same registry pattern used throughout this codebase. */
const KIND_ICON: Record<AnnouncementKind, LucideIcon> = {
  trip: Sparkles,
  offer: Tag,
  coupon: Ticket,
  "limited-seats": Clock,
  festival: PartyPopper,
};

export interface AnnouncementBarProps {
  config: AnnouncementConfig | null;
}

/**
 * AnnouncementBar — renders nothing when `config` is null or after the
 * visitor dismisses it, so pages that don't need one simply pass `null`
 * (still zero component edits, per the "everything configurable" rule).
 * Dismissal is session-only React state (no persistence dependency), so
 * server and first client render always agree: both start visible.
 *
 * The message scrolls as a continuous, seamless ticker-style loop rather
 * than truncating — see the `.animate-ub-marquee` keyframes in
 * `app/globals.css` for how the seamless-loop math works. Hovering pauses
 * the scroll (`group-hover` below) so the message and its link stay
 * readable and clickable instead of sliding out from under the cursor.
 *
 * Visitors with `prefers-reduced-motion` get a static, centered, truncated
 * line instead of the loop — the global reduced-motion rule in
 * globals.css caps every animation to a single near-instant iteration,
 * which would otherwise freeze an infinite marquee mid-scroll rather than
 * actually respecting the preference.
 */
export function AnnouncementBar({ config }: AnnouncementBarProps) {
  const [dismissed, setDismissed] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  if (!config || dismissed) return null;

  const Icon = KIND_ICON[config.kind];

  const message = (
    <>
      {config.message}
      {config.href && config.linkLabel && (
        <Link href={config.href} className="ml-2 whitespace-nowrap font-semibold underline underline-offset-2">
          {config.linkLabel}
        </Link>
      )}
    </>
  );

  // Same visual content as `message`, but with the link swapped for inert
  // text — used only for the aria-hidden duplicate copy in the marquee so
  // keyboard/tab order never lands on an invisible-to-screen-readers link.
  const messageInert = (
    <>
      {config.message}
      {config.href && config.linkLabel && (
        <span className="ml-2 whitespace-nowrap font-semibold underline underline-offset-2">
          {config.linkLabel}
        </span>
      )}
    </>
  );

  return (
    <div
      role="region"
      aria-label="Announcement"
      className={cn(
        "group relative flex w-full items-center gap-2 bg-primary py-2 text-sm text-primary-foreground",
        config.dismissible ? "pl-4 pr-10" : "px-4",
        !reducedMotion && "overflow-hidden"
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {reducedMotion ? (
        <p className="min-w-0 truncate text-center">{message}</p>
      ) : (
        <div className="flex min-w-max shrink-0 items-center animate-ub-marquee group-hover:[animation-play-state:paused]">
          <span className="flex shrink-0 items-center whitespace-nowrap pr-16">{message}</span>
          {/* Exact duplicate, hidden from assistive tech — purely so the
              loop has a second copy to scroll into view seamlessly. */}
          <span className="flex shrink-0 items-center whitespace-nowrap pr-16" aria-hidden="true">
            {messageInert}
          </span>
        </div>
      )}
      {config.dismissible && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss announcement"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 hover:bg-primary-foreground/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
