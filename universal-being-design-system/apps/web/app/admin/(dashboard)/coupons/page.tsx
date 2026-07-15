"use client";

/** Admin Coupon Management (Step 8C, Part 5). List + inline create form —
 * kept on one page rather than a separate /new route since coupons have a
 * small, flat field set that fits comfortably in a compact form. */
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DataTable, type Column } from "@/components/admin/data-table";

interface Coupon {
  _id: string;
  code: string;
  type: "percentage" | "flat";
  value: number;
  minAmount: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  perUserLimit?: number;
  active: boolean;
  endDate?: string;
}

const emptyForm = {
  code: "",
  type: "percentage" as "percentage" | "flat",
  value: "",
  minAmount: "",
  maxDiscount: "",
  usageLimit: "",
  perUserLimit: "",
  endDate: "",
};

export default function CouponsAdminPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/coupons");
    const json = await res.json();
    if (json.success) setCoupons(json.data);
    else toast.error(json.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createCoupon() {
    if (!form.code || !form.value) {
      toast.error("Code and value are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          type: form.type,
          value: Number(form.value),
          minAmount: form.minAmount ? Number(form.minAmount) : undefined,
          maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
          perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : undefined,
          endDate: form.endDate || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Could not create coupon.");
        return;
      }
      toast.success(`Coupon ${json.data.code} created.`);
      setForm(emptyForm);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(coupon: Coupon) {
    const res = await fetch(`/api/admin/coupons/${coupon._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !coupon.active }),
    });
    const json = await res.json();
    if (json.success) load();
    else toast.error(json.error);
  }

  const columns: Column<Coupon>[] = [
    { header: "Code", cell: (c) => <span className="font-mono font-medium">{c.code}</span> },
    { header: "Type", cell: (c) => (c.type === "percentage" ? `${c.value}%` : `₹${c.value}`) },
    { header: "Min Amount", cell: (c) => `₹${c.minAmount || 0}` },
    { header: "Usage", cell: (c) => `${c.usedCount}${c.usageLimit ? ` / ${c.usageLimit}` : ""}` },
    { header: "Per User Limit", cell: (c) => c.perUserLimit ?? "—" },
    { header: "Expires", cell: (c) => (c.endDate ? new Date(c.endDate).toLocaleDateString("en-IN") : "—") },
    { header: "Status", cell: (c) => <Badge variant={c.active ? "success" : "muted"}>{c.active ? "Active" : "Disabled"}</Badge> },
    {
      header: "",
      cell: (c) => (
        <Button variant="ghost" size="sm" onClick={() => toggleActive(c)}>
          {c.active ? "Disable" : "Enable"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Coupons</h1>
        <p className="text-sm text-muted-foreground">Create and manage discount codes for the Booking Engine.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New coupon</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Input placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "percentage" | "flat" })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="flat">Flat amount</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Value" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
          <Input placeholder="Min amount" type="number" value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: e.target.value })} />
          <Input placeholder="Max discount (%)" type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} />
          <Input placeholder="Usage limit" type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
          <Input placeholder="Per-user limit" type="number" value={form.perUserLimit} onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })} />
          <Input placeholder="Expiry date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          <Button onClick={createCoupon} disabled={saving} className="col-span-2 md:col-span-1">
            Create coupon
          </Button>
        </CardContent>
      </Card>

      <DataTable columns={columns} rows={coupons} loading={loading} rowKey={(c) => c._id} emptyMessage="No coupons yet." />
    </div>
  );
}
