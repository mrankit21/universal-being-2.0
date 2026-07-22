"use client";

/** Announcement Management (requirement #6): edit, enable/disable, expiry. */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/admin/form-field";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ImageAssetField } from "@/components/admin/image-asset-field";

interface ImageAssetLike {
  provider: "imagekit" | "cloudinary" | "local" | "placeholder";
  url: string;
  alt: string;
  width: number;
  height: number;
  isPlaceholder: boolean;
}

interface Announcement {
  _id: string;
  kind: string;
  message: string;
  href?: string;
  linkLabel?: string;
  dismissible: boolean;
  enabled: boolean;
  expiresAt?: string;
  image?: ImageAssetLike;
}

const KINDS = ["trip", "offer", "coupon", "limited-seats", "festival"];

const emptyImage = (): ImageAssetLike => ({
  provider: "placeholder",
  url: "",
  alt: "",
  width: 1200,
  height: 400,
  isPlaceholder: true,
});

function blank(): Omit<Announcement, "_id"> {
  return { kind: "offer", message: "", href: "", linkLabel: "", dismissible: true, enabled: true, expiresAt: "", image: emptyImage() };
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(blank());
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/announcements");
    const json = await res.json();
    if (json.success) setItems(json.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error); return; }
      toast.success("Announcement created");
      setDraft(blank());
      setItems((prev) => [json.data, ...prev]);
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(id: string, patch: Partial<Announcement>) {
    const res = await fetch(`/api/admin/announcements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    if (json.success) setItems((prev) => prev.map((a) => (a._id === id ? json.data : a)));
    else toast.error(json.error);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      toast.success("Announcement deleted");
      setItems((prev) => prev.filter((a) => a._id !== id));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Announcement Bar</h1>
        <p className="text-sm text-muted-foreground">Manage the site-wide announcement banner, its expiry, and whether it&apos;s shown.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">New Announcement</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Kind">
            <Select value={draft.kind} onValueChange={(v) => setDraft({ ...draft, kind: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{KINDS.map((k) => <SelectItem key={k} value={k} className="capitalize">{k}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="Expiry Date" hint="Optional">
            <Input type="date" value={draft.expiresAt ?? ""} onChange={(e) => setDraft({ ...draft, expiresAt: e.target.value })} />
          </FormField>
          <FormField label="Message" className="md:col-span-2">
            <Input value={draft.message} onChange={(e) => setDraft({ ...draft, message: e.target.value })} placeholder="e.g. Early-bird pricing ends this week!" />
          </FormField>
          <FormField label="Link (optional)">
            <Input value={draft.href ?? ""} onChange={(e) => setDraft({ ...draft, href: e.target.value })} placeholder="/trips/manali" />
          </FormField>
          <FormField label="Link Label (optional)">
            <Input value={draft.linkLabel ?? ""} onChange={(e) => setDraft({ ...draft, linkLabel: e.target.value })} placeholder="View Trip" />
          </FormField>
          <div className="flex items-center gap-2">
            <Switch checked={draft.dismissible} onCheckedChange={(v) => setDraft({ ...draft, dismissible: v })} id="dismissible" />
            <label htmlFor="dismissible" className="text-sm font-medium">Dismissible by visitors</label>
          </div>
          <div className="md:col-span-2">
            <ImageAssetField
              label="Banner Image (optional)"
              hint="Shown alongside the announcement message where the layout supports it."
              value={draft.image ?? emptyImage()}
              onChange={(v) => setDraft({ ...draft, image: v })}
              category="banners"
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={handleCreate} disabled={creating || !draft.message}><Plus className="size-4" /> Create Announcement</Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a._id}>
              <CardContent className="flex items-center justify-between gap-4 pt-6">
                <div className="flex items-center gap-3">
                  {a.image?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.image.url} alt={a.image.alt} className="h-10 w-16 shrink-0 rounded object-cover" />
                  ) : null}
                  <div>
                    <p className="font-medium">{a.message}</p>
                    <p className="text-xs capitalize text-muted-foreground">{a.kind}{a.expiresAt ? ` · expires ${a.expiresAt}` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={a.enabled} onCheckedChange={(v) => handleUpdate(a._id, { enabled: v })} />
                    <span className="text-sm text-muted-foreground">{a.enabled ? "Enabled" : "Disabled"}</span>
                  </div>
                  <ConfirmDialog
                    trigger={<Button variant="ghost" size="icon"><Trash2 className="size-4 text-destructive" /></Button>}
                    title="Delete announcement?"
                    description="This removes it from the site immediately."
                    onConfirm={() => handleDelete(a._id)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 ? <p className="text-sm text-muted-foreground">No announcements yet.</p> : null}
        </div>
      )}
    </div>
  );
}
