"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform, type PanInfo } from "framer-motion";

import { themeRegistry } from "@/data/themes";
import type { ResolvedHeroSlide } from "@/lib/api/home";
import { ThemeBackground } from "@/components/theme/theme-background";
import { buildThemeCssVars } from "@/lib/theme/theme-engine";
import { ease, duration as motionDuration } from "@/lib/motion-tokens";
import { Button } from "@/components/ui/button";
import { MotionCta } from "@/components/animation/motion-cta";
import { cn } from "@/lib/utils";

const SLIDE_DURATION_MS = 2000;

/**
 * HeroSection — Step 7.5A's cinematic homepage opener, made database-first
 * in Step 7.6C-B Part 1: slides now come from the resolved Homepage config
 * (`lib/api/home.ts`, admin-editable, Media Library-backed) rather than the
 * static `data/home/hero-slides.ts` file directly — that file is now only
 * the fallback `getResolvedHomepage()` uses when MongoDB has no slides
 * configured yet. The carousel engine, motion choreography, swipe/drag,
 * and slide-indicator UI are all unchanged from Step 7.5C.
 *
 * When a slide has a real image (chosen from the Media Library in the
 * Admin Panel), it renders full-bleed via `next/image` with the admin's
 * chosen overlay opacity. When it doesn't, the same `ThemeBackground`
 * Ken-Burns panel from before renders instead — so hero slides look
 * finished even before real photography is uploaded for every one.
 *
 * Mobile sizing: on phones the section's height matches the photo's own
 * aspect ratio exactly (`--hero-ratio`, from the image's stored width ×
 * height) instead of forcing a fixed full-screen height — a portrait phone
 * viewport is a very different shape from almost any landscape photo, and
 * forcing `object-cover` to fill a mismatched shape either crops hard or
 * leaves letterbox gaps. From `sm` upward the section goes back to a fixed
 * full-screen `h-[100svh]`, which is close enough to most photos' aspect
 * ratio that `object-cover` there doesn't need this. Slides with no real
 * image (the `ThemeBackground` placeholder case) always use the fixed
 * full-screen height — there's no photo shape to match.
 */
export function HeroSection({ slides }: { slides: ResolvedHeroSlide[] }) {
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const dragX = React.useRef(0);
  const sectionRef = React.useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : 140]);

  const count = slides.length;
  const slide = slides[index];
  const theme = themeRegistry[slide.themeKey as keyof typeof themeRegistry] ?? themeRegistry.brand;

  const goTo = React.useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count]
  );

  React.useEffect(() => {
    if (prefersReducedMotion || paused || count <= 1) return;
    const id = window.setInterval(() => goTo(index + 1), SLIDE_DURATION_MS);
    return () => window.clearInterval(id);
  }, [index, paused, prefersReducedMotion, goTo, count]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    dragX.current = 0;
    if (info.offset.x < -60) goTo(index + 1);
    else if (info.offset.x > 60) goTo(index - 1);
  }

  const textVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: (delay: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: motionDuration.slow, ease: ease.emphasized, delay },
    }),
  };

  if (!slide) return null;

  const heroStyle = {
    ...buildThemeCssVars(theme),
    ...(slide.image
      ? { "--hero-ratio": `${(slide.imageMobile ?? slide.image).width} / ${(slide.imageMobile ?? slide.image).height}` }
      : {}),
  } as React.CSSProperties;

  return (
    <section
      ref={sectionRef}
      className={cn(
        "relative isolate w-full overflow-hidden",
        slide.image
          ? "aspect-[var(--hero-ratio)] sm:aspect-auto sm:h-[100svh] sm:min-h-[560px]"
          : "h-[100svh] min-h-[560px]"
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={heroStyle}
      aria-roledescription="carousel"
      aria-label="Featured destinations"
    >
      {/* Background layer — parallax drift + crossfade + Ken Burns zoom per slide */}
      <motion.div className="absolute inset-0" style={{ y: parallaxY }}>
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={`${slide.eyebrow}-${index}`}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionDuration.slow * 2, ease: ease.standard }}
          >
            <motion.div
              className="absolute inset-0"
              initial={{ scale: 1 }}
              animate={{ scale: prefersReducedMotion ? 1 : 1.08 }}
              transition={{ duration: SLIDE_DURATION_MS / 1000, ease: "linear" }}
            >
              {slide.image ? (
                <>
                  <Image
                    src={(slide.imageMobile ?? slide.image).url}
                    alt={(slide.imageMobile ?? slide.image).alt}
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    className="object-cover md:hidden"
                    unoptimized
                  />
                  <Image
                    src={slide.image.url}
                    alt={slide.image.alt}
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    className="hidden object-cover md:block"
                    unoptimized
                  />
                </>
              ) : (
                <ThemeBackground theme={theme} area="hero" className="h-full w-full" />
              )}
            </motion.div>
            {/* Cinematic legibility scrim — opacity is admin-configurable per slide */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20"
              style={{ opacity: slide.overlayOpacity }}
              aria-hidden="true"
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Swipe surface (mobile) */}
      <motion.div
        className="absolute inset-0 touch-pan-y"
        drag="x"
        dragElastic={0.15}
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
      />

      {/* Foreground content */}
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col items-start justify-end gap-3 px-6 pb-6 sm:gap-5 sm:pb-28 md:justify-center md:pb-0">
        <AnimatePresence mode="wait">
          <div key={`${slide.eyebrow}-${index}`} className="flex flex-col items-start gap-3 sm:gap-5">
            {slide.eyebrow ? (
              <motion.span
                custom={0}
                variants={textVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white backdrop-blur-sm sm:px-4 sm:py-1.5 sm:text-xs"
              >
                {slide.eyebrow}
              </motion.span>
            ) : null}

            <motion.h1
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="max-w-2xl font-display text-2xl font-medium leading-[1.1] tracking-tight text-white sm:text-6xl sm:leading-[1.05] md:text-7xl"
            >
              {slide.heading.split(" ").map((word, i) => (
                <motion.span
                  key={`${slide.eyebrow}-${index}-${i}`}
                  custom={0.08 + i * 0.045}
                  variants={textVariants}
                  className="inline-block"
                >
                  {word}
                  {i < slide.heading.split(" ").length - 1 ? "\u00A0" : ""}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              custom={0.18}
              variants={textVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="max-w-xl text-sm text-white/85 sm:text-lg"
            >
              {slide.subtitle}
            </motion.p>

            <motion.div
              custom={0.28}
              variants={textVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="flex flex-wrap items-center gap-2 pt-1 sm:gap-3"
            >
              <MotionCta glow>
                <Button asChild size="lg" className="h-9 px-4 text-sm shadow-lg shadow-black/20 sm:h-12 sm:px-6 sm:text-base">
                  <Link href={slide.href}>
                    {slide.ctaLabel}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </MotionCta>
              <MotionCta>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-9 border-white/40 bg-white/5 px-4 text-sm text-white backdrop-blur-sm hover:bg-white/15 hover:text-white sm:h-12 sm:px-6 sm:text-base"
                >
                  <Link href={slide.secondaryCtaHref || "/trips"}>{slide.secondaryCtaLabel || "Explore all trips"}</Link>
                </Button>
              </MotionCta>
            </motion.div>

            {slide.badges.length > 0 ? (
              <motion.div
                custom={0.38}
                variants={textVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                className="flex flex-wrap items-center gap-2 pt-1"
              >
                {slide.badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm sm:px-3 sm:py-1 sm:text-xs"
                  >
                    {badge}
                  </span>
                ))}
              </motion.div>
            ) : null}
          </div>
        </AnimatePresence>
      </div>

    </section>
  );
}
