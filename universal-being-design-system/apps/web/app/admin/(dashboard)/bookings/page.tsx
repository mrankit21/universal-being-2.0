"use client";

/** Booking Management dashboard (requirement #9). */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DataTable, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { toast } from "sonner";

interface BookingRow {
  _id: string;
  customerName: string;
  customerEmail: string;
  tripTitle: string;
  seatsBooked: number;
  totalAmount: number;
  status: string;
  paymentStatus?: string;
  createdAt: string;
}

const PAYMENT_LABEL: Record<string, string> = {
  "not-applicable": "—",
  pending: "Payment Pending",
  paid: "Payment Received",
  refunded: "Refunded",
  failed: "Payment Failed",
};

export default function BookingsListPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [sort, setSort] = useState("createdAt:-1");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (status !== "all") params.set("status", status);
    if (paymentStatus !== "all") params.set("paymentStatus", paymentStatus);
    params.set("sort", sort);
    const res = await fetch(`/api/admin/bookings?${params}`);
    const json = await res.json();
    if (json.success) setBookings(json.data.bookings);
    else toast.error(json.error);
    setLoading(false);
  }, [query, status, paymentStatus, sort]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const columns: Column<BookingRow>[] = [
    { header: "Customer", cell: (b) => <div><p className="font-medium">{b.customerName}</p><p className="text-xs text-muted-foreground">{b.customerEmail}</p></div> },
    { header: "Trip", cell: (b) => b.tripTitle },
    { header: "Seats", cell: (b) => b.seatsBooked },
    { header: "Amount", cell: (b) => `₹${b.totalAmount.toLocaleString("en-IN")}` },
    { header: "Status", cell: (b) => <StatusBadge status={b.status} /> },
    { header: "Payment", cell: (b) => <span className="text-sm text-muted-foreground">{PAYMENT_LABEL[b.paymentStatus ?? "not-applicable"]}</span> },
    { header: "Booked On", cell: (b) => new Date(b.createdAt).toLocaleDateString("en-IN") },
    { header: "", cell: (b) => <Link href={`/admin/bookings/${b._id}`}><Button variant="ghost" size="icon"><Eye className="size-4" /></Button></Link> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
        <p className="text-sm text-muted-foreground">Track and manage every trip booking.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Input placeholder="Search by name, email, phone, trip…" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="slot-reserved">Slot Reserved</SelectItem>
            <SelectItem value="slot-paid">Slot Paid</SelectItem>
            <SelectItem value="remaining-payment-pending">Remaining Payment Pending</SelectItem>
            <SelectItem value="remaining-payment-received">Remaining Payment Received</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payment statuses</SelectItem>
            <SelectItem value="pending">Payment Pending</SelectItem>
            <SelectItem value="paid">Payment Received</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
            <SelectItem value="failed">Payment Failed</SelectItem>
            <SelectItem value="not-applicable">Not applicable</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt:-1">Newest first</SelectItem>
            <SelectItem value="createdAt:1">Oldest first</SelectItem>
            <SelectItem value="totalAmount:-1">Amount: high to low</SelectItem>
            <SelectItem value="totalAmount:1">Amount: low to high</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} rows={bookings} loading={loading} rowKey={(b) => b._id} emptyMessage="No bookings yet." />
    </div>
  );
}
