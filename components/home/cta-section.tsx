"use client";

import Link from "next/link";
import Image from "next/image";
import { MessageCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import { useTheme } from "@/hooks/use-theme";
import { siteConfig } from "@/data/layout/site-config";
import { ThemeBackground } from "@/components/theme/theme-background";
import { Button } from "@/components/ui/button";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { FloatingElements } from "@/components/animation/floating-elements";
import { MotionCta } from "@/components/animation/motion-cta";
import { revealViewport, fadeInUp } from "@/lib/motion-tokens";
import type { ResolvedCtaSection } from "@/lib/api/home";

/**
 * CtaSection — Step 7.5B luxury closing banner, Step 7.5C motion pass
 * (ambient floating shapes, ripple/glow/lift buttons via `MotionCta`).
 *
 * Step 7.6C-B Part 1: heading/body/CTA/background image now come from the
 * resolved `ctaSection` config (admin-editable, database-first) instead of
 * being hardcoded — the WhatsApp button and newsletter form are unchanged
 * (out of this CMS phase's scope).
 */
export function CtaSection({ config }: { config: ResolvedCtaSection }) {
  const { theme } = useTheme();

  return (
    <section className="ub-luxury-section relative isolate overflow-hidden">
      {config.backgroundImage ? (
        <>
          <Image
            src={(config.backgroundImageMobile ?? config.backgroundImage).url}
            alt={(config.backgroundImageMobile ?? config.backgroundImage).alt}
            fill
            sizes="100vw"
            className="absolute inset-0 object-cover md:hidden"
            unoptimized
          />
          <Image
            src={config.backgroundImage.url}
            alt={config.backgroundImage.alt}
            fill
            sizes="100vw"
            className="absolute inset-0 hidden object-cover md:block"
            unoptimized
          />
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: config.overlayOpacity }}
            aria-hidden="true"
          />
        </>
      ) : (
        <ThemeBackground theme={theme} area="hero" className="absolute inset-0" />
      )}
      <FloatingElements className="relative text-white" />
      <motion.div
        className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-section-md text-center sm:py-section-lg"
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={revealViewport}
      >
        <h2 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-5xl">
          {config.heading}
        </h2>
        <p className="max-w-xl text-base text-muted-foreground sm:text-lg">{config.body}</p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <MotionCta glow>
            <Button asChild size="lg" className="shadow-ub-md">
              <Link href={config.ctaHref}>
                {config.ctaLabel}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </MotionCta>
          <MotionCta>
            <Button asChild size="lg" className="border-0 bg-[#25D366] text-white shadow-ub-md hover:bg-[#25D366]/90 hover:text-white">
              <a href={siteConfig.contact.whatsappHref} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" aria-hidden="true" />
                Chat on WhatsApp
              </a>
            </Button>
          </MotionCta>
        </div>

        <div className="mt-4 flex flex-col items-center gap-2">
          <NewsletterForm />
        </div>
      </motion.div>
    </section>
  );
}
