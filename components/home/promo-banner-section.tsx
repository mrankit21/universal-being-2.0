"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { MotionCta } from "@/components/animation/motion-cta";
import { revealViewport, fadeInUp } from "@/lib/motion-tokens";
import type { ResolvedPromoBanner } from "@/lib/api/home";

/**
 * PromoBannerSection — Step 7.6C-B Part 1. The Homepage model/Admin Panel
 * has had a fully editable `promoBanner` config since Step 7's Homepage
 * Management page, but no component ever rendered it on the live site —
 * this closes that gap so "Promotional Banner" (requirement #5's list) is
 * actually visible once an admin enables it, database-first like every
 * other section.
 */
export function PromoBannerSection({ config }: { config: ResolvedPromoBanner }) {
  if (!config.enabled) return null;

  return (
    <section className="relative isolate overflow-hidden border-y border-border bg-muted/40">
      {config.image ? (
        <Image
          src={config.image.url}
          alt={config.image.alt}
          fill
          sizes="100vw"
          className="absolute inset-0 object-cover"
          unoptimized
        />
      ) : null}
      {config.image ? <div className="absolute inset-0 bg-black/50" aria-hidden="true" /> : null}

      <motion.div
        className={`relative mx-auto flex max-w-5xl flex-col items-center gap-3 px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left ${
          config.image ? "text-white" : ""
        }`}
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={revealViewport}
      >
        <div>
          {config.heading ? <h3 className="font-display text-xl font-medium sm:text-2xl">{config.heading}</h3> : null}
          {config.body ? <p className={`mt-1 text-sm ${config.image ? "text-white/85" : "text-muted-foreground"}`}>{config.body}</p> : null}
        </div>
        {config.ctaLabel && config.ctaHref ? (
          <MotionCta>
            <Button asChild size="lg" variant={config.image ? "outline" : "primary"} className={config.image ? "border-white/40 bg-white/5 text-white backdrop-blur-sm hover:bg-white/15 hover:text-white" : ""}>
              <Link href={config.ctaHref}>
                {config.ctaLabel}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </MotionCta>
        ) : null}
      </motion.div>
    </section>
  );
}
