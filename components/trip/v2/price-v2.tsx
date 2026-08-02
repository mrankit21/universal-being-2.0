"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export interface PriceV2Props {
  basePrice: number;
  discountedPrice?: number;
  bookingAmount: number;
  bookHref: string;
}

function formatINR(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Trip 2.0 UI — dedicated Price section, split out from the pricing
 * table per serial-order revision (2026-07) so price sits on its own as
 * item #6, ahead of pickup variants and batch dates. Static content only
 * for now; once approved this maps from `Trip.price.base` /
 * `Trip.price.discounted` / `Trip.price.bookingAmount`, same fields the
 * old `TripPricingTable` already reads.
 */
export function PriceV2({ basePrice, discountedPrice, bookingAmount, bookHref }: PriceV2Props) {
  const displayPrice = discountedPrice ?? basePrice;
  const discountPercent = discountedPrice ? Math.round(((basePrice - discountedPrice) / basePrice) * 100) : null;

  return (
    <section id="price" className="mx-auto w-full max-w-md px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-7 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Price per person</span>

        <div className="flex items-baseline gap-2">
          <span className="font-display text-4xl font-semibold tracking-tight text-foreground">{formatINR(displayPrice)}</span>
          {discountedPrice ? (
            <span className="text-base text-muted-foreground line-through">{formatINR(basePrice)}</span>
          ) : null}
        </div>
        {discountPercent ? (
          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            {discountPercent}% off
          </span>
        ) : null}

        <p className="mt-1 text-sm text-muted-foreground">
          Reserve with just <span className="font-medium text-foreground">{formatINR(bookingAmount)}</span> — pay the rest before departure.
        </p>

        <Link
          href={bookHref}
          className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:text-base"
        >
          Reserve Your Seat
        </Link>

        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
          Fully refundable up to 15 days before departure
        </p>
      </div>
    </section>
  );
}
