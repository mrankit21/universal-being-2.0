"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { resolveTrip2Icon } from "./icon-registry";

export interface DidYouKnowCardV2 {
  id: string;
  icon: string;
  title: string;
  description: string;
  href: string;
}

const DEFAULT_FACTS: DidYouKnowCardV2[] = [
  {
    id: "highest-villages",
    icon: "Globe2",
    title: "Highest Motorable Villages",
    description: "Spiti is home to some of the highest permanently inhabited villages in the world.",
    href: "#",
  },
  {
    id: "cold-desert",
    icon: "Globe2",
    title: "A Cold Desert",
    description: "Spiti receives less rainfall than most deserts, and is technically a high-altitude desert.",
    href: "#",
  },
  {
    id: "oldest-monastery",
    icon: "Globe2",
    title: "One of Buddhism's Oldest Monasteries",
    description: "Key Monastery has stood for over a thousand years, surviving earthquakes, fires and invasions.",
    href: "#",
  },
];

/**
 * Trip 2.0 UI — "Did You Know" dark-section carousel. `icon` is a plain
 * string (resolved via `resolveTrip2Icon`), same reasoning as
 * `QuickLinksV2`. Now backend-connected via `getResolvedTrip2()` /
 * `Trip2Model.didYouKnow`; falls back to `DEFAULT_FACTS` when no `facts`
 * prop is passed.
 */
export function DidYouKnowV2({ facts = DEFAULT_FACTS }: { facts?: DidYouKnowCardV2[] }) {
  const [index, setIndex] = React.useState(0);
  const active = facts[index];
  const ActiveIcon = resolveTrip2Icon(active?.icon);
  if (!active) return null;

  function prev() {
    setIndex((i) => (i - 1 + facts.length) % facts.length);
  }
  function next() {
    setIndex((i) => (i + 1) % facts.length);
  }

  return (
    <section className="w-full bg-ub-ink-900 px-4 py-10 sm:px-6 sm:py-14">
      <h2 className="mb-8 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">Did You Know</h2>

      <div className="mx-auto max-w-md rounded-2xl bg-white p-7 shadow-ub-xl">
        <span className="flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary">
          <ActiveIcon className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <h3 className="mt-4 font-display text-xl font-semibold text-ub-ink-900">{active.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{active.description}</p>
        <Link href={active.href} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-ub-teal-500 hover:underline">
          Learn More
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-4">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous fact"
          className="flex size-9 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/10"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-1.5">
          {facts.map((f, i) => (
            <span key={f.id} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-6 bg-primary" : "w-1.5 bg-white/30")} />
          ))}
        </div>
        <button
          type="button"
          onClick={next}
          aria-label="Next fact"
          className="flex size-9 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/10"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
