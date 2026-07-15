"use client";

import { useEffect } from "react";

import type { Trip } from "@/types/trip";
import { siteConfig } from "@/data/layout/site-config";
import { useStickyCta } from "@/components/layout/sticky-cta-context";

export interface TripStickyActionsProps {
  trip: Trip;
}

/**
 * TripStickyActions — the trip detail page's opt-in call to Phase 4's
 * `StickyCtaBar` mechanism (see `sticky-cta-bar.tsx`: "trip/booking pages
 * (a later phase) are what actually populate it"). No `book` action is
 * wired yet since booking/payment is explicitly out of scope for this step
 * (requirement #9) — WhatsApp and Call route straight to the real contact
 * numbers from `siteConfig`, and Share uses the Web Share API fallback
 * already built into the bar.
 */
export function TripStickyActions({ trip }: TripStickyActionsProps) {
  const { show, clear } = useStickyCta();

  useEffect(() => {
    const message = encodeURIComponent(`Hi! I'm interested in the ${trip.title} trip.`);
    show([
      {
        type: "whatsapp",
        label: "WhatsApp",
        href: `${siteConfig.contact.whatsappHref}?text=${message}`,
      },
      { type: "call", label: "Call us", href: siteConfig.contact.phoneHref },
      { type: "share", label: "Share" },
    ]);
    return () => clear();
  }, [trip.title, show, clear]);

  return null;
}
