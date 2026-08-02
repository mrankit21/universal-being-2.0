"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ExperienceCardV2 {
  id: string;
  tag: string;
  title: string;
  description: string;
  href: string;
  imageUrl: string;
  imageAlt: string;
}

const DEFAULT_EXPERIENCES: ExperienceCardV2[] = [
  {
    id: "stargazing",
    tag: "Stargazing",
    title: "Sleep under the stars",
    description: "Some of the clearest, darkest night skies in India.",
    href: "#",
    imageUrl: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Snow-capped mountain range at night",
  },
  {
    id: "monasteries",
    tag: "Culture",
    title: "Centuries-old monasteries",
    description: "Step into living Buddhist heritage, high above the clouds.",
    href: "#",
    imageUrl: "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Himalayan monastery on a hillside",
  },
  {
    id: "high-passes",
    tag: "Adventure",
    title: "Drive the high passes",
    description: "Cross some of the highest motorable roads on Earth.",
    href: "#",
    imageUrl: "https://images.unsplash.com/photo-1533130061792-64b345e4a833?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Winding mountain road",
  },
];

/**
 * Trip 2.0 UI — "Things To Experience" swipeable card carousel, matching
 * the reference screenshot (full-width photo card, tag pill, title,
 * description, "Explore" link, dot pagination). Static content only for
 * now; once approved this maps from `Trip.highlights` (or a dedicated
 * field, TBD with backend).
 */
export function ThingsToExperienceV2({ items = DEFAULT_EXPERIENCES }: { items?: ExperienceCardV2[] }) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = React.useState(0);

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActive(index);
  }

  return (
    <section id="things-to-experience" className="w-full py-8 sm:py-12">
      <h2 className="mb-6 px-4 font-display text-2xl font-semibold text-foreground sm:px-6 sm:text-3xl">
        Things To Experience
      </h2>

      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:px-6 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <div key={item.id} className="relative aspect-[16/10] w-full max-w-xl shrink-0 snap-center overflow-hidden rounded-2xl">
            <img src={item.imageUrl} alt={item.imageAlt} className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" aria-hidden="true" />
            <div className="relative z-10 flex h-full flex-col justify-end gap-2 p-6">
              <span className="w-fit rounded-full border border-white/40 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                {item.tag}
              </span>
              <h3 className="font-display text-xl font-semibold text-white sm:text-2xl">{item.title}</h3>
              <p className="max-w-sm text-sm text-white/80">{item.description}</p>
              <Link href={item.href} className="mt-1 inline-flex w-fit items-center gap-1 text-sm font-semibold text-white hover:underline">
                Explore
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5">
        {items.map((item, i) => (
          <span
            key={item.id}
            className={cn("h-1.5 rounded-full transition-all", i === active ? "w-6 bg-primary" : "w-1.5 bg-border")}
          />
        ))}
      </div>
    </section>
  );
}
