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
 */
export function AnnouncementBar({ config }: AnnouncementBarProps) {
  const [dismissed, setDismissed] = React.useState(false);

  if (!config || dismissed) return null;

  const Icon = KIND_ICON[config.kind];

  return (
    <div
      role="region"
      aria-label="Announcement"
      className={cn(
        "relative flex w-full items-center justify-center gap-2 bg-primary px-4 py-2 text-center text-sm text-primary-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <p className="min-w-0 truncate">
        {config.message}
        {config.href && config.linkLabel && (
          <Link href={config.href} className="ml-2 whitespace-nowrap font-semibold underline underline-offset-2">
            {config.linkLabel}
          </Link>
        )}
      </p>
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
