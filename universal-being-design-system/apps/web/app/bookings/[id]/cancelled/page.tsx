import type { Metadata } from "next";
import { PaymentStatusView } from "@/components/booking/payment-status-view";

export const metadata: Metadata = { title: "Payment cancelled", robots: { index: false, follow: false } };

export default async function PaymentCancelledPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <PaymentStatusView bookingId={id} outcome="cancelled" />
    </div>
  );
}
