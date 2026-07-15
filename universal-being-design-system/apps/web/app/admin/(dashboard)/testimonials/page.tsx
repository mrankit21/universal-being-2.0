"use client";

/** Testimonials Management (Step 7.6B §4): create/edit/delete customer
 * testimonials, publish toggle, star rating, and a customer avatar chosen
 * from the Media Library — never a bare uploaded image. */
import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Plus, Trash2, Star, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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

interface Testimonial {
  _id: string;
  authorName: string;
  authorLocation?: string;
  avatar?: ImageAssetLike;
  quote: string;
  rating: number;
  tripSlug?: string;
  published: boolean;
}

const emptyImage = (): ImageAssetLike => ({
  provider: "placeholder",
  url: "",
  alt: "",
  width: 200,
  height: 200,
  isPlaceholder: true,
});

function blank(): Omit<Testimonial, "_id"> {
  return { authorName: "", authorLocation: "", avatar: emptyImage(), quote: "", rating: 5, tripSlug: "", published: true };
}

export default function TestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(blank());
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/testimonials");
    const json = await res.json();
    if (json.success) setItems(json.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error); return; }
      toast.success("Testimonial created");
      setDraft(blank());
      setItems((prev) => [json.data, ...prev]);
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(id: string, patch: Partial<Testimonial>) {
    const res = await fetch(`/api/admin/testimonials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    if (json.success) setItems((prev) => prev.map((t) => (t._id === id ? json.data : t)));
    else toast.error(json.error);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      toast.success("Testimonial deleted");
      setItems((prev) => prev.filter((t) => t._id !== id));
    } else {
      toast.error(json.error);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Testimonials</h1>
        <p className="text-sm text-muted-foreground">
          Customer quotes shown on the homepage. Avatars are chosen from the Media Library.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">New Testimonial</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Customer Name">
            <Input value={draft.authorName} onChange={(e) => setDraft({ ...draft, authorName: e.target.value })} placeholder="e.g. Priya Sharma" />
          </FormField>
          <FormField label="Location" hint="Optional">
            <Input value={draft.authorLocation ?? ""} onChange={(e) => setDraft({ ...draft, authorLocation: e.target.value })} placeholder="e.g. Mumbai" />
          </FormField>
          <FormField label="Quote" className="md:col-span-2">
            <Textarea rows={3} value={draft.quote} onChange={(e) => setDraft({ ...draft, quote: e.target.value })} placeholder="What did they say about the trip?" />
          </FormField>
          <FormField label="Rating (1–5)">
            <Input
              type="number"
              min={1}
              max={5}
              value={draft.rating}
              onChange={(e) => setDraft({ ...draft, rating: Math.min(5, Math.max(1, Number(e.target.value) || 5)) })}
            />
          </FormField>
          <FormField label="Related Trip Slug" hint="Optional">
            <Input value={draft.tripSlug ?? ""} onChange={(e) => setDraft({ ...draft, tripSlug: e.target.value })} placeholder="e.g. udaipur" />
          </FormField>
          <div className="md:col-span-2">
            <ImageAssetField
              label="Customer Image"
              value={draft.avatar ?? emptyImage()}
              onChange={(v) => setDraft({ ...draft, avatar: v })}
              category="general"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={draft.published} onCheckedChange={(v) => setDraft({ ...draft, published: v })} id="published" />
            <label htmlFor="published" className="text-sm font-medium">Published</label>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={handleCreate} disabled={creating || !draft.authorName || !draft.quote}>
              <Plus className="size-4" /> Add Testimonial
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-3">
          {items.map((t) => (
            <Card key={t._id}>
              <CardContent className="flex items-start justify-between gap-4 pt-6">
                <div className="flex items-start gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
                    {t.avatar?.url ? (
                      <Image src={t.avatar.url} alt={t.avatar.alt} width={48} height={48} className="size-full object-cover" unoptimized />
                    ) : (
                      <User className="size-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{t.authorName}{t.authorLocation ? <span className="font-normal text-muted-foreground"> · {t.authorLocation}</span> : null}</p>
                    <p className="mt-1 flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`size-3.5 ${i < t.rating ? "fill-current" : "text-muted-foreground/30"}`} />
                      ))}
                    </p>
                    <p className="mt-1 max-w-xl text-sm text-muted-foreground">&ldquo;{t.quote}&rdquo;</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={t.published} onCheckedChange={(v) => handleUpdate(t._id, { published: v })} />
                    <span className="text-sm text-muted-foreground">{t.published ? "Published" : "Hidden"}</span>
                  </div>
                  <ConfirmDialog
                    trigger={<Button variant="ghost" size="icon"><Trash2 className="size-4 text-destructive" /></Button>}
                    title="Delete testimonial?"
                    description="This removes it from the homepage immediately."
                    onConfirm={() => handleDelete(t._id)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 ? <p className="text-sm text-muted-foreground">No testimonials yet.</p> : null}
        </div>
      )}
    </div>
  );
}
