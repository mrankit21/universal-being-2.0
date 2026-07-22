import type { Metadata } from "next";
import { PaymentStatusView } from "@/components/booking/payment-status-view";

export const metadata: Metadata = { title: "Payment unsuccessful", robots: { index: false, follow: false } };

export default async function PaymentFailedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <PaymentStatusView bookingId={id} outcome="failed" />
    </div>
  );
}
