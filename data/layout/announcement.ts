import type { AnnouncementConfig } from "@/types/layout";

/**
 * Announcement bar config — AnnouncementBar renders whichever config is
 * passed to it; nothing about copy, kind, or link is hardcoded in the
 * component. This file holds the active default and a few examples for the
 * other supported kinds. A future admin surface would replace this file
 * (or its export) with a CMS-backed fetch — the component contract doesn't
 * change either way.
 */
export const activeAnnouncement: AnnouncementConfig | null = {
  id: "spiti-2026-early-bird",
  kind: "limited-seats",
  message: "Spiti Valley, Sept batch — 4 seats left at early-bird pricing.",
  href: "/trips/spiti-valley",
  linkLabel: "View trip",
  dismissible: true,
};

/** Reference examples for the other announcement kinds — not rendered by
 * default, useful when wiring a real content source later. */
export const announcementExamples: Record<string, AnnouncementConfig> = {
  offer: {
    id: "monsoon-offer",
    kind: "offer",
    message: "Monsoon getaways — flat 10% off, ends this week.",
    href: "/offers",
    linkLabel: "See offers",
    dismissible: true,
  },
  coupon: {
    id: "first-trip-coupon",
    kind: "coupon",
    message: "First trip with us? Use code FIRSTTRIP for ₹1,000 off.",
    dismissible: true,
  },
  festival: {
    id: "diwali-campaign",
    kind: "festival",
    message: "Diwali batches now open across Rajasthan and the Himalayas.",
    href: "/destinations",
    linkLabel: "Explore",
    dismissible: true,
  },
  trip: {
    id: "manali-upcoming",
    kind: "trip",
    message: "New trip added: Manali — Winter Edition.",
    href: "/trips/manali",
    linkLabel: "Check dates",
    dismissible: true,
  },
};
