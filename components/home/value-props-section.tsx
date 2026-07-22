"use client";

import Image from "next/image";

import { whyTravelFaqs } from "@/data/home/why-travel-faq";
import { SectionHeading } from "@/components/primitives/section-heading";
import { PremiumAccordion } from "@/components/home/premium-accordion";
import { Reveal } from "@/components/animation/reveal";
import { FloatingElements } from "@/components/animation/floating-elements";
import type { ResolvedSectionBackground } from "@/lib/api/home";

/**
 * ValuePropsSection — "Why Travel With Us". Previously a 4-up icon-card
 * grid (Step 7.5B/C); redesigned to a premium single-open FAQ accordion
 * per the reference design, keeping the same section heading/eyebrow and
 * the ambient FloatingElements background. The icon-card grid is fully
 * retired in favor of `data/home/why-travel-faq.ts` + `PremiumAccordion`.
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
          description="We design every detail so you can just enjoy the journey."
          align="center"
          className={
            hasImage
              ? "relative mx-auto mb-10 max-w-2xl [&_h2]:text-white [&_p]:text-white/85 [&_span]:text-ub-brass-300"
              : "relative mx-auto mb-10 max-w-2xl"
          }
        />

        <Reveal variant="up">
          <PremiumAccordion items={whyTravelFaqs} className="relative mx-auto max-w-3xl" />
        </Reveal>
      </section>
    </div>
  );
}
