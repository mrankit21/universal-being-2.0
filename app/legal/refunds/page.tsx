import type { Metadata } from "next";
import Link from "next/link";

import { refundPolicyContent, cancellationPolicyContent } from "@/data/shared/real-content";
import { LegalPage } from "@/components/primitives/legal-page";

export const metadata: Metadata = {
  title: "Refund policy | Universal Being",
  description: "How and when refunds are processed for cancelled Universal Being bookings.",
};

/**
 * Refund policy (`/legal/refunds`) — footer-linked, previously 404'd. Pairs
 * the real `refundPolicyContent` with the same `cancellationPolicyContent`
 * shown on `/support/cancellations`, since a refund amount only makes
 * sense alongside the cancellation window that determines it.
 */
export default function RefundPolicyPage() {
  return (
    <>
      <LegalPage title="Refund policy" intro={[refundPolicyContent, cancellationPolicyContent]} />
      <p className="-mt-6 mb-16 text-center text-sm">
        <Link href="/support/cancellations" className="font-medium text-ub-brass-600 underline underline-offset-4">
          See the cancellation policy broken down by refund tier
        </Link>
      </p>
    </>
  );
}
