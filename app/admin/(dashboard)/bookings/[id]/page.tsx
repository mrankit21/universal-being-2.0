/* eslint-disable @typescript-eslint/no-explicit-any -- this page edits a loosely-typed JSON config blob by design */
"use client";

/** Booking Details + status control (requirement #9). */
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { StatusBadge } from "@/components/admin/status-badge";
import { FormField } from "@/components/admin/form-field";
import { BookingStatusTimeline } from "@/components/admin/booking-status-timeline";
import { useCountdown } from "@/components/trip/booking-countdown";

/** Admin-panel "Countdown Remaining" readout (requirement: Booking Details
 * must display it when a reservation is pending). Reuses the same
 * countdown hook the public booking form uses, so admin and customer never
 * disagree about how much time is left. */
function ReservationCountdown({ expiresAt }: { expiresAt?: string }) {
  const msLeft = useCountdown(expiresAt);
  if (msLeft === null) return null;
  const expired = msLeft <= 0;
  const totalSeconds = Math.max(0, Math.floor(msLeft / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return (
    <p>
      <span className="text-muted-foreground">Countdown Remaining:</span>{" "}
      {expired ? <Badge variant="destructive">Expired</Badge> : <span className="font-medium text-foreground">{m}:{String(s).padStart(2, "0")}</span>}
    </p>
  );
}

const REMAINING_METHOD_LABEL: Record<string, string> = {
  "cash-during-trip": "Cash During Trip (Travelling Bus / Tour Start)",
  upi: "UPI (coming soon)",
  "bank-transfer": "Bank Transfer (coming soon)",
  card: "Card (coming soon)",
  other: "Other (coming soon)",
};

const REMAINING_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  received: "Received",
  "not-applicable": "Not applicable",
};

const PAYMENT_LABEL: Record<string, string> = {
  "not-applicable": "Not applicable",
  pending: "Payment Pending",
  paid: "Payment Received",
  refunded: "Refunded",
  failed: "Payment Failed",
};

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    fetch(`/api/admin/bookings/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setBooking(json.data);
          setNotes(json.data.notes ?? "");
          setAmountPaid(String(json.data.amountPaid ?? 0));
        } else {
          toast.error(json.error);
        }
      });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function patch(body: Record<string, unknown>, successMessage: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error); return; }
      toast.success(successMessage);
      setBooking(json.data);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(status: string) {
    await patch({ status, statusNote: statusNote || undefined }, "Booking status updated");
    setStatusNote("");
  }

  async function updatePaymentStatus(paymentStatus: string) {
    await patch({ paymentStatus }, "Payment status updated");
  }

  async function updateRemainingPaymentMethod(remainingPaymentMethod: string) {
    await patch({ remainingPaymentMethod }, "Remaining payment method updated");
  }

  async function updateRemainingPaymentStatus(remainingPaymentStatus: string) {
    await patch({ remainingPaymentStatus }, "Remaining payment status updated");
  }

  async function saveNotes() {
    await patch({ notes }, "Notes saved");
  }

  async function saveAmountPaid() {
    const value = Number(amountPaid);
    if (Number.isNaN(value) || value < 0) { toast.error("Enter a valid amount"); return; }
    await patch({ amountPaid: value }, "Amount paid updated");
  }

  if (!booking) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Booking Details</h1>
          <p className="text-sm text-muted-foreground">{booking.tripTitle}</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>Back to Bookings</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Customer</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Name:</span> {booking.customerName}</p>
            <p><span className="text-muted-foreground">Email:</span> {booking.customerEmail}</p>
            <p><span className="text-muted-foreground">Phone:</span> {booking.customerPhone}</p>
            {booking.customerGender ? <p><span className="text-muted-foreground">Gender:</span> {booking.customerGender}</p> : null}
            {booking.customerAge ? <p><span className="text-muted-foreground">Age:</span> {booking.customerAge}</p> : null}
            {booking.customerCity ? <p><span className="text-muted-foreground">City:</span> {booking.customerCity}</p> : null}
            {booking.emergencyContactName || booking.emergencyContactPhone ? (
              <p>
                <span className="text-muted-foreground">Emergency contact:</span>{" "}
                {booking.emergencyContactName} {booking.emergencyContactPhone ? `· ${booking.emergencyContactPhone}` : ""}
              </p>
            ) : null}
            {booking.specialRequests ? (
              <p><span className="text-muted-foreground">Special requests:</span> {booking.specialRequests}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Booking</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Trip:</span> {booking.tripTitle}</p>
            {booking.pickupVariantName ? (
              <p><span className="text-muted-foreground">Pickup:</span> {booking.pickupVariantName}</p>
            ) : null}
            {booking.departureStartDate ? (
              <p>
                <span className="text-muted-foreground">Departure:</span>{" "}
                {new Date(booking.departureStartDate).toLocaleDateString("en-IN")}
                {booking.departureEndDate ? ` – ${new Date(booking.departureEndDate).toLocaleDateString("en-IN")}` : ""}
              </p>
            ) : null}
            <p><span className="text-muted-foreground">Seats:</span> {booking.seatsBooked}</p>
            {booking.sharingType && booking.sharingType !== "quad" ? (
              <p>
                <span className="text-muted-foreground">Room Sharing:</span>{" "}
                {booking.sharingType === "double" ? "Double Sharing" : "Triple Sharing"}
                {booking.sharingTypeMarkupPerPerson ? ` (+₹${booking.sharingTypeMarkupPerPerson.toLocaleString("en-IN")}/person)` : ""}
              </p>
            ) : null}
            {booking.offerPrice ? <p><span className="text-muted-foreground">Price / person:</span> ₹{booking.offerPrice.toLocaleString("en-IN")}</p> : null}
            {booking.discountAmount > 0 ? <p><span className="text-muted-foreground">Discount:</span> ₹{booking.discountAmount.toLocaleString("en-IN")}</p> : null}
            <p><span className="text-muted-foreground">Total Amount:</span> ₹{booking.totalAmount.toLocaleString("en-IN")}</p>
            {booking.bookingAmountDue ? <p><span className="text-muted-foreground">Book Your Slot Amount:</span> ₹{booking.bookingAmountDue.toLocaleString("en-IN")}</p> : null}
            <p><span className="text-muted-foreground">Slot Amount Paid:</span> ₹{booking.amountPaid.toLocaleString("en-IN")}</p>
            <p><span className="text-muted-foreground">Remaining Amount:</span> ₹{(booking.remainingAmount ?? 0).toLocaleString("en-IN")}</p>
            <p><span className="text-muted-foreground">Remaining Payment Method:</span> {REMAINING_METHOD_LABEL[booking.remainingPaymentMethod ?? "cash-during-trip"] ?? booking.remainingPaymentMethod}</p>
            <p><span className="text-muted-foreground">Remaining Payment Status:</span> {REMAINING_STATUS_LABEL[booking.remainingPaymentStatus ?? "pending"] ?? booking.remainingPaymentStatus}</p>
            <p className="flex items-center gap-2"><span className="text-muted-foreground">Booking Status:</span> <StatusBadge status={booking.status} /> {booking.status === "expired" ? <Badge variant="destructive">Expired</Badge> : null}</p>
            <p><span className="text-muted-foreground">Payment:</span> {PAYMENT_LABEL[booking.paymentStatus ?? "not-applicable"]}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Booking Expiry Timer</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {booking.reservationStartedAt ? (
              <p><span className="text-muted-foreground">Reservation Started At:</span> {new Date(booking.reservationStartedAt).toLocaleString("en-IN")}</p>
            ) : (
              <p className="text-muted-foreground">No active reservation window.</p>
            )}
            {booking.reservationExpiresAt ? (
              <p><span className="text-muted-foreground">Reservation Expires At:</span> {new Date(booking.reservationExpiresAt).toLocaleString("en-IN")}</p>
            ) : null}
            {booking.status === "slot-reserved" || booking.status === "pending" ? (
              <ReservationCountdown expiresAt={booking.reservationExpiresAt} />
            ) : null}
            {booking.status === "expired" ? <Badge variant="destructive">Reservation Expired — seat released automatically</Badge> : null}
          </CardContent>
        </Card>

        {booking.travelers?.length > 0 ? (
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Travellers</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {booking.travelers.map((t: any, i: number) => (
                <div key={i} className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium text-foreground">{t.fullName}</p>
                  <p className="text-muted-foreground">
                    {t.age ? `${t.age} yrs` : ""}{t.age && t.gender ? " · " : ""}{t.gender ?? ""}
                  </p>
                  {t.idProofType ? (
                    <p className="text-muted-foreground">{t.idProofType}: {t.idProofNumber ?? "—"}</p>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader><CardTitle className="text-base">Update Status</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <FormField label="Status">
              <Select value={booking.status} onValueChange={updateStatus} disabled={saving}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="slot-reserved">Slot Reserved</SelectItem>
                  <SelectItem value="slot-paid">Slot Paid</SelectItem>
                  <SelectItem value="remaining-payment-pending">Remaining Payment Pending</SelectItem>
                  <SelectItem value="remaining-payment-received">Remaining Payment Received</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Trip Completed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Note for this status change (optional)">
              <Input value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="e.g. Confirmed after deposit received" />
            </FormField>
            <p className="text-xs text-muted-foreground">Cancelling or expiring releases the booked seats back to the batch automatically.</p>

            <FormField label="Payment status">
              <Select value={booking.paymentStatus ?? "not-applicable"} onValueChange={updatePaymentStatus} disabled={saving}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-applicable">Not applicable</SelectItem>
                  <SelectItem value="pending">Payment Pending</SelectItem>
                  <SelectItem value="paid">Payment Received</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="failed">Payment Failed</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Amount paid (₹)">
              <div className="flex gap-2">
                <Input type="number" min={0} value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
                <Button size="sm" onClick={saveAmountPaid} disabled={saving}>Save</Button>
              </div>
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Remaining Payment Method</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <FormField label="Method" hint="Only Cash During Trip is collected today — the others are reserved for future phases.">
              <Select value={booking.remainingPaymentMethod ?? "cash-during-trip"} onValueChange={updateRemainingPaymentMethod} disabled={saving}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(REMAINING_METHOD_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Remaining payment status">
              <Select value={booking.remainingPaymentStatus ?? "pending"} onValueChange={updateRemainingPaymentStatus} disabled={saving}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(REMAINING_STATUS_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Internal Notes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <Button size="sm" onClick={saveNotes} disabled={saving}>Save Notes</Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Status Timeline</CardTitle></CardHeader>
          <CardContent>
            <BookingStatusTimeline events={booking.statusHistory ?? []} />
          </CardContent>
        </Card>

        <PaymentManagementCard booking={booking} onChanged={load} />
      </div>
    </div>
  );
}

/** Payment Management (Step 8C, Part 11) — the admin-side surface for
 * everything Step 8C added: invoice/ticket downloads, manual
 * remaining-payment entry, refund initiation, and resending customer
 * notifications. Kept as its own component so the main page above (which
 * already handles booking/status/notes) doesn't grow further. */
function PaymentManagementCard({ booking, onChanged }: { booking: any; onChanged: () => void }) {
  const [manualAmount, setManualAmount] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function recordManualPayment() {
    if (!manualAmount) { toast.error("Enter an amount."); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id ?? booking._id}/manual-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(manualAmount), notes: manualNote || undefined }),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error ?? "Could not record payment."); return; }
      toast.success("Manual payment recorded.");
      setManualAmount("");
      setManualNote("");
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function initiateRefund() {
    if (!refundReason) { toast.error("Enter a reason."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id ?? booking._id, reason: refundReason }),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error ?? "Could not create refund."); return; }
      toast.success("Refund created — approve/process it from the Refunds page.");
      setRefundReason("");
    } finally {
      setBusy(false);
    }
  }

  async function resend(event: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id ?? booking._id}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event }),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error ?? "Could not send."); return; }
      toast.success("Notification sent.");
    } finally {
      setBusy(false);
    }
  }

  const bookingId = booking.id ?? booking._id;

  return (
    <Card className="lg:col-span-2">
      <CardHeader><CardTitle className="text-base">Payment Management</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <a href={`/api/bookings/${bookingId}/invoice`} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm">Download Invoice</Button>
          </a>
          <a href={`/api/bookings/${bookingId}/ticket`} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm">Download Ticket</Button>
          </a>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => resend("booking-created")}>Resend Seat Reserved Email</Button>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => resend("payment-success")}>Resend Payment Email</Button>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => resend("remaining-payment-reminder")}>Resend Reminder</Button>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => resend("invoice")}>Email Invoice</Button>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => resend("ticket")}>Email Ticket</Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <FormField label="Record manual remaining payment (₹)">
            <div className="flex gap-2">
              <Input type="number" value={manualAmount} onChange={(e) => setManualAmount(e.target.value)} placeholder={String(booking.remainingAmount ?? 0)} />
              <Button size="sm" onClick={recordManualPayment} disabled={busy}>Record</Button>
            </div>
            <Textarea rows={2} className="mt-2" value={manualNote} onChange={(e) => setManualNote(e.target.value)} placeholder="Admin payment note (optional)" />
          </FormField>

          <FormField label="Initiate refund">
            <Textarea rows={2} value={refundReason} onChange={(e) => setRefundReason(e.target.value)} placeholder="Reason for refund" />
            <Button size="sm" className="mt-2" variant="outline" onClick={initiateRefund} disabled={busy || booking.paymentStatus !== "paid"}>
              Create refund request
            </Button>
          </FormField>
        </div>
      </CardContent>
    </Card>
  );
}
