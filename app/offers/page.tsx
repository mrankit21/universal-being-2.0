import type { Metadata } from "next";
import Link from "next/link";
import { Tag as TagIcon, Copy } from "lucide-react";

import { getActiveOffers } from "@/lib/api/offers";
import { SectionHeading } from "@/components/primitives/section-heading";
import { Tag } from "@/components/primitives/tag";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Offers | Universal Being",
  description: "Current discount codes and offers on Universal Being group trips.",
};

function formatValue(offer: { type: "percentage" | "flat"; value: number }) {
  return offer.type === "percentage" ? `${offer.value}% off` : `₹${offer.value} off`;
}

/**
 * Offers page (`/offers`) — was footer-linked but had no route (404).
 * Reads live, admin-managed coupons via `getActiveOffers()` (same
 * DB-with-fallback pattern as `/trips`), so a coupon created in
 * `/admin/coupons` shows up here automatically instead of needing a
 * second, hand-maintained copy of the same offer.
 */
export default async function OffersPage() {
  const offers = await getActiveOffers();

  return (
    <div className="mx-auto max-w-4xl px-6 py-section-sm sm:py-section-md">
      <SectionHeading
        eyebrow="Offers"
        title="Current offers"
        description="Apply these codes at checkout on any eligible trip."
        align="center"
        className="mx-auto mb-10"
      />

      {offers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <TagIcon className="size-6 text-ub-brass-500" aria-hidden="true" />
            <p className="text-foreground font-medium">No active offers right now</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Check back soon, or message us on WhatsApp — we often have seat-limited discounts for upcoming
              batches.
            </p>
            <Button asChild className="mt-2">
              <Link href="/trips">Browse trips</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {offers.map((offer) => (
            <Card key={offer.code}>
              <CardContent className="flex flex-col gap-2 pt-5">
                <div className="flex items-center justify-between">
                  <Tag tone="brass" className="font-mono text-sm">
                    {offer.code}
                  </Tag>
                  <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                    <Copy className="size-3.5" aria-hidden="true" />
                    {formatValue(offer)}
                  </span>
                </div>
                {offer.description && <p className="text-sm text-muted-foreground">{offer.description}</p>}
                <p className="text-xs text-muted-foreground">
                  {offer.minAmount > 0 ? `On bookings above ₹${offer.minAmount}. ` : ""}
                  {offer.maxDiscount ? `Max discount ₹${offer.maxDiscount}. ` : ""}
                  {offer.endDate ? `Valid till ${offer.endDate}.` : ""}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
