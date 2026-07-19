"use client";

import Image from "next/image";
import { Users, ShieldCheck, Sparkles, Compass, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

import { valueProps, type ValuePropIconKey } from "@/data/home/value-props";
import { SectionHeading } from "@/components/primitives/section-heading";
import { Reveal } from "@/components/animation/reveal";
import { FloatingElements } from "@/components/animation/floating-elements";
import type { ResolvedSectionBackground } from "@/lib/api/home";

/** Static icon registry — same pattern as nav-link.tsx's NavIconKey map. */
const iconRegistry: Record<ValuePropIconKey, LucideIcon> = {
  users: Users,
  "shield-check": ShieldCheck,
  sparkles: Sparkles,
  compass: Compass,
};

const cardVariants = ["tilt", "scale", "tilt", "scale"] as const;

/**
 * ValuePropsSection — Step 7.5B "Why Universal Being" content, Step 7.5C
 * motion pass: alternating tilt/scale entrance per card (rather than every
 * section using the same fade-up), ambient `FloatingElements` in the
 * background, and a slow pulse glow behind each icon.
 */
export function ValuePropsSection({ background }: { background?: ResolvedSectionBackground }) {
  const hasImage = Boolean(background?.backgroundImage);

  return (
    <div className={hasImage ? "relative isolate overflow-hidden" : "ub-section-light relative"}>
      {hasImage && background?.backgroundImage ? (
        <>
          <Image
            src={(background.backgroundImageMobile ?? background.backgroundImage).url}
            alt={(background.backgroundImageMobile ?? background.backgroundImage).alt}
            fill
            sizes="100vw"
            className="absolute inset-0 object-cover md:hidden"
            unoptimized
          />
          <Image
            src={background.backgroundImage.url}
            alt={background.backgroundImage.alt}
            fill
            sizes="100vw"
            className="absolute inset-0 hidden object-cover md:block"
            unoptimized
          />
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: background.overlayOpacity }}
            aria-hidden="true"
          />
        </>
      ) : null}
      <section className="relative mx-auto max-w-6xl px-6 py-section-sm sm:py-section-md">
        <FloatingElements className="text-ub-brass-500" />

        <SectionHeading
          eyebrow="Why travel with us"
          title="Trips designed, not just booked"
          align="center"
          className={
            hasImage
              ? "relative mx-auto mb-10 max-w-2xl [&_h2]:text-white [&_p]:text-white/85 [&_span]:text-ub-brass-300"
              : "relative mx-auto mb-10 max-w-2xl"
          }
        />

        <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {valueProps.map((prop, i) => {
            const Icon = iconRegistry[prop.icon];
            return (
              <Reveal key={prop.title} variant={cardVariants[i % cardVariants.length]} delay={i * 0.06}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="ub-glass flex h-full flex-col items-start gap-4 rounded-xl border border-border bg-card p-6 shadow-ub-sm transition-shadow duration-ub-base hover:shadow-ub-md"
                >
                  <span className="relative flex size-12 items-center justify-center rounded-full bg-ub-brass-500/10 text-ub-brass-600">
                    <motion.span
                      className="absolute inset-0 rounded-full bg-ub-brass-500/15"
                      animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, delay: i * 0.3 }}
                      aria-hidden="true"
                    />
                    <motion.span
                      whileHover={{ scale: 1.08, rotate: 3 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="relative flex size-12 items-center justify-center"
                    >
                      <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                    </motion.span>
                  </span>
                  <h3 className="font-display text-base font-medium text-foreground">{prop.title}</h3>
                  <p className="text-sm text-muted-foreground">{prop.description}</p>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </section>
    </div>
  );
}
