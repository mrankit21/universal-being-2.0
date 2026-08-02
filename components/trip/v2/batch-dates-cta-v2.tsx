"use client";

import * as React from "react";
import Link from "next/link";

export interface BatchDatesCtaV2Props {
  heading?: string;
  description?: string;
  ctaLabel?: string;
  href: string;
}

/**
 * Trip 2.0 UI — "View Batch Dates" banner CTA, matching the reference
 * screenshot. Static content only for now; once approved this links to
 * `/trips/[slug]/book` and the heading/description can pull from
 * `Trip.title`/`Trip.shortDescription` if desired.
 */
export function BatchDatesCtaV2({
  heading = "Ready when you are",
  description = "Small group departures, crafted for the way you actually travel.",
  ctaLabel = "View Batch Dates",
  href,
}: BatchDatesCtaV2Props) {
  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-10 text-center sm:px-6">
      <h2 className="font-display text-2xl font-medium text-foreground sm:text-3xl">{heading}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground sm:text-base">{description}</p>
      <Link
        href={href}
        className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:text-base"
      >
        {ctaLabel}
      </Link>
    </section>
  );
}
