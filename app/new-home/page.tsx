import type { Metadata } from "next";

import { HeroParallax } from "@/components/home/v2/hero-parallax";
import { FloatingQuickLinks } from "@/components/home/v2/floating-quick-links";
import { FeaturedTripsStack } from "@/components/home/v2/featured-trips-stack";
import { FloatingPillNavWired } from "@/components/home/v2/floating-pill-nav-wired";
import { FunFactsZigzag } from "@/components/home/v2/fun-facts-zigzag";
import { LetsPlanYourTripV2 } from "@/components/trip/v2/lets-plan-your-trip-v2";
import { ValuePropsSection } from "@/components/home/value-props-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { CtaSection } from "@/components/home/cta-section";
import { getResolvedHomepage2 } from "@/lib/api/home2";
import { getResolvedHomepage } from "@/lib/api/home";

export const metadata: Metadata = {
  title: "New Homepage UI Preview — Universal Being",
};

/**
 * Homepage UI v2 — preview only.
 *
 * This is intentionally a separate route (`/new-home`), not `app/page.tsx`.
 * The live homepage still renders through `getResolvedHomepage()` and the
 * existing `components/home/*` sections untouched — nothing about the
 * current integration (Homepage CMS, MongoDB, Featured Trips/Testimonials
 * resolution) is wired up here yet.
 *
 * Content backend (2026-08): every Homepage 2.0-specific section below
 * resolves through `getResolvedHomepage2()` — the same `HomepageV2Model`
 * singleton / `/api/admin/homepage2` panel that already drove Hero, Quick
 * Links and Featured Trips — extended with a `funFacts` array for the new
 * zigzag carousel. No hardcoded mock data left in this file; editing Fun
 * Facts in Admin → Homepage 2.0 reflects here immediately
 * (`revalidatePath("/")` on save).
 *
 * Shared sections (2026-08): "Why Travel With Us" (`ValuePropsSection`),
 * "From Past Travelers" (`TestimonialsSection`) and the closing "Ready for
 * your next trip?" CTA (`CtaSection`) are the same sections `app/page.tsx`
 * already shares between Homepage v1 and v2 — sourced from
 * `getResolvedHomepage()` (Admin → Homepage), not Homepage 2.0. They're
 * pulled in here too so this preview matches what v1 already shows below
 * the fold; editing their content stays in Admin → Homepage as before.
 * "Let's Plan Your Trip" reuses the existing, already backend-connected
 * `LetsPlanYourTripV2` component (`/api/trip2-leads`) unchanged — its
 * content isn't part of either CMS.
 *
 * Once the look is approved, the plan is: swap `app/page.tsx` to render
 * these v2 components in place of the current ones — no rewrite needed,
 * this page already renders off real data.
 */
export default async function NewHomePreview() {
  const [homepage2, homepage] = await Promise.all([getResolvedHomepage2(), getResolvedHomepage()]);
  const { hero, quickLinks, featuredTrips, funFacts } = homepage2;

  return (
    <main className="bg-background">
      <HeroParallax
        eyebrow={hero.eyebrow}
        heading={hero.heading}
        subheading={hero.subheading}
        ctaLabel={hero.ctaLabel}
        ctaHref={hero.ctaHref}
        imageUrl={hero.imageUrl}
        imageAlt={hero.imageAlt}
        imageMobileUrl={hero.imageMobileUrl}
        imageMobileAlt={hero.imageMobileAlt}
      />

      <FloatingQuickLinks items={quickLinks} />

      <FeaturedTripsStack trips={featuredTrips} />

      <FunFactsZigzag facts={funFacts} />

      <ValuePropsSection background={homepage.valuePropsSection} />

      <TestimonialsSection testimonials={homepage.testimonials} background={homepage.testimonialsSection} />

      <LetsPlanYourTripV2 />

      <CtaSection config={homepage.ctaSection} />

      <FloatingPillNavWired />
    </main>
  );
}
