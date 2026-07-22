"use client";

/** Single reusable form for both create and edit (Architecture §7 pattern
 * applied to Destinations, not just Trips). */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "./form-field";
import { ImageAssetField } from "./image-asset-field";
import { StringListEditor } from "./string-list-editor";
import { ArrayFieldEditor } from "./array-field-editor";
import { DestinationTripAssignmentField } from "./destination-trip-assignment-field";
import type { Destination } from "@/types/destination";
import type { ThemeKey } from "@/types/theme";

const THEME_KEYS: ThemeKey[] = ["brand", "rajasthan", "winter", "monsoon", "beach", "mountain", "forest", "udaipur", "spiti", "manali", "goa", "jibhi"];

const emptyImage = () => ({
  provider: "placeholder" as const,
  url: "",
  alt: "",
  width: 1600,
  height: 900,
  isPlaceholder: true,
});

const emptyPointOfInterest = () => ({
  name: "",
  description: "",
  category: "famous" as const,
  image: emptyImage(),
});

const POI_CATEGORIES = ["famous", "historical", "adventure"] as const;

type DestinationFormValue = Omit<Destination, "id" | "createdAt" | "updatedAt">;

function blank(): DestinationFormValue {
  return {
    slug: "",
    name: "",
    region: "",
    state: "",
    themeKey: "brand",
    tagline: "",
    shortDescription: "",
    longDescription: "",
    heroImage: emptyImage(),
    coverImage: emptyImage(),
    thumbnail: emptyImage(),
    gallery: [],
    bestSeason: [],
    altitude: "",
    highlights: [],
    pointsOfInterest: [],
    featured: false,
    homepageVisible: true,
    tripAssignments: [],
    status: "draft",
    seo: { title: "", description: "" },
    isPlaceholderContent: true,
  };
}

export function DestinationForm({
  destinationId,
  initialValue,
}: {
  destinationId?: string;
  initialValue?: DestinationFormValue;
}) {
  const router = useRouter();
  const [value, setValue] = useState<DestinationFormValue>(() => ({
    ...blank(),
    ...initialValue,
    thumbnail: initialValue?.thumbnail ?? emptyImage(),
    featured: initialValue?.featured ?? false,
    homepageVisible: initialValue?.homepageVisible ?? true,
    tripAssignments: initialValue?.tripAssignments ?? [],
    pointsOfInterest: initialValue?.pointsOfInterest ?? [],
  }));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  function set<K extends keyof DestinationFormValue>(key: K, val: DestinationFormValue[K]) {
    setValue((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors(null);
    try {
      const url = destinationId ? `/api/admin/destinations/${destinationId}` : "/api/admin/destinations";
      const method = destinationId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
      const json = await res.json();
      if (!json.success) {
        const fieldErrors = json.details?.fieldErrors as Record<string, string[]> | undefined;
        if (fieldErrors) setErrors(fieldErrors);
        // Surface exactly which field(s) failed instead of a bare generic
        // toast — "Validation failed" alone is undebuggable on mobile
        // where there's no DevTools/terminal to check.
        const fieldNames = fieldErrors ? Object.keys(fieldErrors) : [];
        const detail = fieldNames.length ? `: ${fieldNames.join(", ")}` : "";
        toast.error(`${json.error ?? "Something went wrong"}${detail}`);
        return;
      }
      toast.success(destinationId ? "Destination updated" : "Destination created");
      router.push("/admin/destinations");
      router.refresh();
    } catch {
      toast.error("Couldn't reach the server — check your connection and try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Basic Info</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Name" error={errors?.name?.[0]}>
            <Input value={value.name} onChange={(e) => set("name", e.target.value)} required />
          </FormField>
          <FormField label="Slug" hint="Lowercase, kebab-case (e.g. manali)" error={errors?.slug?.[0]}>
            <Input value={value.slug} onChange={(e) => set("slug", e.target.value)} required />
          </FormField>
          <FormField label="Region">
            <Input value={value.region} onChange={(e) => set("region", e.target.value)} />
          </FormField>
          <FormField label="State">
            <Input value={value.state} onChange={(e) => set("state", e.target.value)} />
          </FormField>
          <FormField label="Theme">
            <Select value={value.themeKey} onValueChange={(v) => set("themeKey", v as ThemeKey)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {THEME_KEYS.map((key) => (
                  <SelectItem key={key} value={key} className="capitalize">{key}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Status">
            <Select value={value.status} onValueChange={(v) => set("status", v as "draft" | "published")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Altitude" className="md:col-span-2">
            <Input value={value.altitude ?? ""} onChange={(e) => set("altitude", e.target.value)} placeholder="e.g. 2,050 m" />
          </FormField>
          <FormField label="Tagline" className="md:col-span-2">
            <Input value={value.tagline} onChange={(e) => set("tagline", e.target.value)} />
          </FormField>
          <FormField label="Short Description" className="md:col-span-2">
            <Textarea value={value.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} rows={2} />
          </FormField>
          <FormField label="Long Description" className="md:col-span-2">
            <Textarea value={value.longDescription} onChange={(e) => set("longDescription", e.target.value)} rows={5} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Imagery</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <ImageAssetField label="Hero Image" value={value.heroImage} onChange={(v) => set("heroImage", v)} category="destination-hero" hint="Wide banner shown at the top of the destination page." />
          <ImageAssetField
            label="Mobile Hero Image (optional)"
            value={value.heroImageMobile ?? emptyImage()}
            onChange={(v) => set("heroImageMobile", v)}
            category="destination-hero"
            hint="Optional dedicated crop for phone screens (portrait, e.g. 1080×1920). Leave empty to reuse the Hero Image above — do this only if that image loses an important subject when cropped narrow."
          />
          <ImageAssetField label="Cover Image" value={value.coverImage} onChange={(v) => set("coverImage", v)} category="destination-hero" hint="Used on the homepage Theme Explorer cards." />
          <ImageAssetField label="Thumbnail" value={value.thumbnail ?? emptyImage()} onChange={(v) => set("thumbnail", v)} category="destination-hero" hint="Tighter crop used on the Destinations listing cards. Falls back to Cover Image if left unset." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Gallery</CardTitle></CardHeader>
        <CardContent>
          <ArrayFieldEditor
            items={value.gallery}
            onChange={(v) => set("gallery", v)}
            addLabel="Add gallery image"
            emptyMessage="No gallery images yet."
            createItem={emptyImage}
            draggable
            renderItem={(img, _i, update) => (
              <ImageAssetField label="Gallery Image" value={img} onChange={update} category="destination-gallery" />
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Highlights & Season</CardTitle></CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <FormField label="Best Season">
            <StringListEditor items={value.bestSeason} onChange={(v) => set("bestSeason", v)} placeholder="e.g. October–March" addLabel="Add season" />
          </FormField>
          <FormField label="Highlights">
            <StringListEditor items={value.highlights} onChange={(v) => set("highlights", v)} placeholder="e.g. Old City & lakes" addLabel="Add highlight" />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Points of Interest</CardTitle>
          <p className="text-sm text-muted-foreground">
            Famous, historical, or adventure spots within this destination — each shown with its own
            photo on the destination page.
          </p>
        </CardHeader>
        <CardContent>
          <ArrayFieldEditor
            items={value.pointsOfInterest}
            onChange={(v) => set("pointsOfInterest", v)}
            addLabel="Add place"
            emptyMessage="No places added yet."
            createItem={emptyPointOfInterest}
            renderItem={(poi, _i, update) => (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Name">
                    <Input value={poi.name} onChange={(e) => update({ name: e.target.value })} placeholder="e.g. Naggar Castle" />
                  </FormField>
                  <FormField label="Category">
                    <Select value={poi.category} onValueChange={(v) => update({ category: v as typeof poi.category })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {POI_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
                <FormField label="Description">
                  <Textarea value={poi.description} onChange={(e) => update({ description: e.target.value })} rows={3} />
                </FormField>
                <ImageAssetField label="Photo" value={poi.image} onChange={(v) => update({ image: v })} category="destination-gallery" />
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visibility</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium">Featured Destination</p>
              <p className="text-xs text-muted-foreground">Spotlights this destination in listings.</p>
            </div>
            <Switch checked={value.featured} onCheckedChange={(v) => set("featured", v)} />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium">Homepage Visibility</p>
              <p className="text-xs text-muted-foreground">Show in the homepage destinations section.</p>
            </div>
            <Switch checked={value.homepageVisible} onCheckedChange={(v) => set("homepageVisible", v)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assigned Trips</CardTitle>
          <p className="text-sm text-muted-foreground">
            Assign or remove trips, reorder how they appear on this destination&apos;s page, and mark
            trips as Featured within this destination.
          </p>
        </CardHeader>
        <CardContent>
          <DestinationTripAssignmentField
            destinationId={destinationId}
            destinationSlug={value.slug}
            destinationName={value.name}
            value={value.tripAssignments}
            onChange={(v) => set("tripAssignments", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">SEO</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Meta Title">
            <Input value={value.seo.title} onChange={(e) => set("seo", { ...value.seo, title: e.target.value })} />
          </FormField>
          <FormField label="Meta Description">
            <Input value={value.seo.description} onChange={(e) => set("seo", { ...value.seo, description: e.target.value })} />
          </FormField>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : destinationId ? "Save Changes" : "Create Destination"}</Button>
      </div>
    </form>
  );
}
