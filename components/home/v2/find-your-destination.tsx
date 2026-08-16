"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ResolvedSectionBackground } from "@/lib/api/home";
import { contactContent } from "@/data/shared/real-content";

/** Default full-bleed backdrop (aerial beach/coastline) used whenever the
 * admin hasn't picked a background image in Admin → Homepage 2.0. Keeps the
 * section themed even before any CMS image is configured. */
const DEFAULT_BACKGROUND_IMAGE = {
  url: "/images/find-your-destination-bg.jpg",
  alt: "Aerial view of a turquoise coastline meeting golden sand",
};

/**
 * Homepage UI v2 — "Find your destination" banner, modeled on the
 * visitabudhabi.ae reference: a full-bleed themed backdrop right under the
 * Featured Trips stack, carrying just a heading + one line of body copy
 * (no widget/form — keeps parity with the rest of `/new-home`'s
 * static-content-only sections). Admins typically pick a background crop
 * that visually continues the Featured Trips section image above it; when
 * none is set yet, `DEFAULT_BACKGROUND_IMAGE` keeps the section themed.
 *
 * Sized by the image itself (2026-08, Ankit): a plain `<img>` in normal
 * flow, not `fill` + `object-cover` in a fixed-height box — so a tall
 * portrait upload renders at its own full height with no cropping
 * ("jitni lambi photo hai utna lamba section hona chahiye"), matching the
 * same treatment as "Still Deciding?" (`lets-plan-your-trip-v2.tsx`).
 *
 * WhatsApp CTA (2026-08, CRM Phase 6): a "Chat on WhatsApp" button below
 * the body copy, same `wa.me` link + number as `/contact`
 * (`contactContent.whatsapp`) — this is a direct entry point into the
 * CRM's WhatsApp inbound webhook: a visitor's first message here creates
 * a CRM lead automatically (see `lib/crm/reply.ts` /
 * `app/api/webhooks/whatsapp/route.ts`), same as a click on the contact
 * page's existing WhatsApp links.
 */
export function FindYourDestination({
  heading = "Find your destination",
  body = "Your next adventure is waiting. Discover amazing places with Universal Being.",
  background,
  className,
}: {
  heading?: string;
  body?: string;
  background?: ResolvedSectionBackground;
  className?: string;
}) {
  const desktopImage = background?.backgroundImage ?? DEFAULT_BACKGROUND_IMAGE;
  const mobileImage = background?.backgroundImageMobile ?? background?.backgroundImage ?? DEFAULT_BACKGROUND_IMAGE;
  const overlayOpacity = background?.overlayOpacity ?? 0.35;

  return (
    <section className={cn("relative isolate w-full overflow-hidden", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mobileImage.url} alt={mobileImage.alt} className="block h-auto w-full md:hidden" loading="lazy" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={desktopImage.url}
        alt={desktopImage.alt}
        className="hidden h-auto w-full md:block"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity }} aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 mx-auto flex w-full max-w-2xl flex-col items-center justify-center px-4 text-center sm:px-6"
      >
        <h2 className="font-display text-4xl font-bold text-white sm:text-6xl">{heading}</h2>
        <p className="mx-auto mt-5 max-w-lg text-base text-white/85 sm:text-lg">{body}</p>
        <a
          href={`https://wa.me/${contactContent.whatsapp.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-105"
        >
          <MessageCircle className="size-4" /> Chat on WhatsApp
        </a>
      </motion.div>
    </section>
  );
}
