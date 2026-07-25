import type { Metadata } from "next";
import Link from "next/link";

import { cancellationPolicyContent, refundPolicyContent, contactContent } from "@/data/shared/real-content";
import { SectionHeading } from "@/components/primitives/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Trip cancellations | Universal Being",
  description: "How to cancel a booked trip, and what you get back at each stage before departure.",
};

const cancellationTiers = [
  { window: "More than 30 days before departure", outcome: "Full refund (minus any expenses already incurred for bookings)." },
  { window: "21–30 days before departure", outcome: "75% refund of the total trip cost." },
  { window: "11–20 days before departure", outcome: "50% refund of the total trip cost." },
  { window: "0–10 days before departure", outcome: "No refund." },
];

/**
 * Trip cancellations page (`/support/cancellations`) — footer-linked,
 * previously 404'd. Same cancellation-tier numbers as the printed trip
 * flyer's "Cancellation Policy" section, sourced from the shared
 * `cancellationPolicyContent` string so this page and every trip's default
 * policy field can never drift apart.
 */
export default function TripCancellationsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-section-sm sm:py-section-md">
      <SectionHeading eyebrow="Support" title="Trip cancellations" align="center" className="mx-auto mb-4" />
      <p className="mx-auto mb-10 max-w-xl text-center text-muted-foreground">{cancellationPolicyContent}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {cancellationTiers.map((tier) => (
          <Card key={tier.window}>
            <CardContent className="pt-5">
              <p className="font-medium text-foreground">{tier.window}</p>
              <p className="mt-1 text-sm text-muted-foreground">{tier.outcome}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10 rounded-lg border border-border p-6">
        <h2 className="mb-2 font-display text-xl font-medium text-foreground">How refunds are processed</h2>
        <p className="text-sm text-muted-foreground">{refundPolicyContent}</p>
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">
          To cancel a booking, message us on WhatsApp with your booking details.
        </p>
        <Button asChild>
          <a href={`https://wa.me/${contactContent.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
            Message us to cancel
          </a>
        </Button>
        <Link href="/legal/refunds" className="text-sm font-medium text-ub-brass-600 underline underline-offset-4">
          Read the full refund policy
        </Link>
      </div>
    </div>
  );
}
