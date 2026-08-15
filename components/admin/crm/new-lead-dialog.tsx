"use client";

/** Manual lead creation form (Admin -> CRM -> New Lead). Phase 1 only —
 * this is the "manual" source; Meta/website/WhatsApp create leads
 * automatically starting Phase 5/6. */
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const EMPTY = { name: "", phone: "", whatsappNumber: "", destination: "", travelTiming: "", notes: "" };

export function NewLeadDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "manual" }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Could not create lead.");
        return;
      }
      toast.success(`Lead ${json.data.leadId} created.`);
      setForm(EMPTY);
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Lead</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Name *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Customer name" />
            </div>
            <div>
              <Label className="text-xs">Phone *</Label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91…" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">WhatsApp (if different)</Label>
              <Input value={form.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} placeholder="Same as phone if blank" />
            </div>
            <div>
              <Label className="text-xs">Destination</Label>
              <Input value={form.destination} onChange={(e) => set("destination", e.target.value)} placeholder="e.g. Manali" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Travel timing</Label>
            <Input value={form.travelTiming} onChange={(e) => set("travelTiming", e.target.value)} placeholder="e.g. Next month, flexible" />
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Anything worth remembering about this lead" rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            Create Lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
