"use client";

/**
 * Payment Success / Failed / Cancelled pages (Step 8C, Part 2). One shared
 * client component parameterized by `outcome` — the three pages
 * (`app/bookings/[id]/success`, `/failed`, `/cancelled`) are thin server
 * wrappers around this so the fetch-and-render logic lives in exactly one
 * place. Always re-fetches the booking's live status rather than trusting
 * the route it was reached through — a customer could land on `/failed`
 * from a stale link after later completing payment via retry, and the
 * page should reflect reality, not the URL.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Download, RefreshCcw, Ticket, FileText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface BookingDetail {
  id: string;
  tripTitle: string;
  departureStartDate?: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  amountPaid: number;
  remainingAmount: number;
  bookingAmountDue: number;
  currency: string;
  invoiceNumber?: string;
  paymentAttemptCount: number;
  reservationExpiresAt?: string | null;
}

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function PaymentStatusView({ bookingId, outcome }: { bookingId: string; outcome: "success" | "failed" | "cancelled" }) {
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`);
      const json = await res.json();
      if (json.success) setBooking(json.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  async function retryPayment() {
    setRetrying(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/retry-payment`, { method: "POST" });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Could not start a new payment attempt.");
        return;
      }
      const order = json.data.razorpayOrder;
      if (!order || !window.Razorpay) {
        toast.error("Online payment isn't available right now. Please contact support.");
        return;
      }
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        name: booking?.tripTitle,
        description: "Book Your Slot",
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const verifyRes = await fetch(`/api/bookings/${bookingId}/verify-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const verifyJson = await verifyRes.json();
          if (verifyJson.success) {
            toast.success("Payment received — your slot is confirmed!");
            await load();
          } else {
            toast.error(verifyJson.error ?? "Payment verification failed.");
          }
        },
      });
      rzp.open();
    } finally {
      setRetrying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  if (!booking) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="py-10 text-center text-muted-foreground">Booking not found.</CardContent>
      </Card>
    );
  }

  const isPaid = booking.paymentStatus === "paid";
  const title = isPaid ? "Payment successful" : outcome === "cancelled" ? "Payment cancelled" : "Payment unsuccessful";

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle className="font-display text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">{booking.tripTitle}</span>
          {booking.departureStartDate ? ` — ${new Date(booking.departureStartDate).toLocaleDateString("en-IN")}` : ""}
        </p>

        <div className="rounded-lg border border-border bg-secondary/40 p-3 space-y-1">
          <p>
            Booking ID: <span className="font-mono text-foreground">{booking.id}</span>
          </p>
          <p>Total amount: {money(booking.totalAmount, booking.currency)}</p>
          <p>Amount paid: {money(booking.amountPaid, booking.currency)}</p>
          <p>Remaining amount: {money(booking.remainingAmount, booking.currency)}</p>
          <div>
            Booking status: <Badge variant={isPaid ? "success" : "warning"}>{booking.status}</Badge>
          </div>
        </div>

        {!isPaid ? (
          <Button className="w-full" onClick={retryPayment} disabled={retrying}>
            {retrying ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <RefreshCcw className="size-4" aria-hidden="true" />}
            Retry payment {booking.paymentAttemptCount ? `(attempt ${booking.paymentAttemptCount + 1})` : ""}
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" asChild>
              <a href={`/api/bookings/${booking.id}/invoice`} target="_blank" rel="noreferrer">
                <FileText className="size-4" aria-hidden="true" /> Invoice
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={`/api/bookings/${booking.id}/ticket`} target="_blank" rel="noreferrer">
                <Ticket className="size-4" aria-hidden="true" /> E-Ticket
              </a>
            </Button>
          </div>
        )}

        <Button variant="ghost" className="w-full" asChild>
          <Link href="/trips">
            <Download className="size-4 rotate-180" aria-hidden="true" /> Browse more trips
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}