/* eslint-disable @typescript-eslint/no-explicit-any -- this page edits a loosely-typed JSON config blob by design */
"use client";

/** Homepage Management (requirement #5): Hero Slider (up to 6 slides,
 * Media Library-backed, drag-and-drop order, enable/disable), Featured
 * Trips (picked from the real Trip collection), Testimonials (picked from
 * the real Testimonial collection), CTA + Promotional Banner, and
 * Section Order / Section Visibility — all one singleton document, saved
 * as a whole and reflected on the live homepage immediately (no deploy). */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/admin/form-field";
import { ImageAssetField } from "@/components/admin/image-asset-field";
import { ArrayFieldEditor } from "@/components/admin/array-field-editor";
import { TripPickerField } from "@/components/admin/trip-picker-field";
import { TestimonialPickerField } from "@/components/admin/testimonial-picker-field";
import { ThemeBackground } from "@/components/theme/theme-background";
import { themeRegistry } from "@/data/themes";

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero Slider",
  featuredTrips: "Featured Trips",
  themeExplorer: "Theme Explorer",
  valueProps: "Value Propositions",
  testimonials: "Testimonials",
  promoBanner: "Promotional Banner",
  cta: "CTA Section",
};

const THEME_KEYS = ["brand", "rajasthan", "winter", "monsoon", "beach", "mountain", "forest"];
const MAX_HERO_SLIDES = 6;

const BLANK_IMAGE = { provider: "placeholder", url: "", alt: "", width: 1920, height: 1080, isPlaceholder: true };

function emptyHeroSlide() {
  return {
    destinationLabel: "",
    image: { ...BLANK_IMAGE },
    heading: "",
    subtitle: "",
    ctaLabel: "Explore",
    ctaHref: "/trips",
    overlayOpacity: 0.45,
    order: 0,
    enabled: true,
    themeKey: "brand",
  };
}

export default function HomepagePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/homepage")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
        else toast.error(json.error);
      })
      .finally(() => setLoading(false));
  }, []);

  function set(path: string[], val: unknown) {
    setData((prev: any) => {
      const next = structuredClone(prev);
      let cursor = next;
      for (let i = 0; i < path.length - 1; i++) cursor = cursor[path[i]];
      cursor[path[path.length - 1]] = val;
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Keep each hero slide's `order` in sync with its position in the
      // array (drag-and-drop reorders the array; the DB reads `order`).
      const payload = {
        ...data,
        heroSlides: (data.heroSlides ?? []).map((s: any, i: number) => ({ ...s, order: i })),
      };
      const res = await fetch("/api/admin/homepage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error);
        return;
      }
      toast.success("Homepage updated — live on the site now");
      setData(json.data);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const heroSlides = data.heroSlides ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Homepage Management</h1>
          <p className="text-sm text-muted-foreground">Everything visible on the homepage, editable without a deploy.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Homepage"}</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Hero Slider</CardTitle>
          <Badge variant={heroSlides.length >= MAX_HERO_SLIDES ? "default" : "outline"}>
            {heroSlides.length} / {MAX_HERO_SLIDES} slides
          </Badge>
        </CardHeader>
        <CardContent>
          <ArrayFieldEditor<any>
            items={heroSlides}
            onChange={(v) => set(["heroSlides"], v)}
            draggable
            createItem={emptyHeroSlide}
            hideAdd
            emptyMessage="No hero slides yet — add up to 6 below."
            renderItem={(slide, index, update) => (
              <div className="space-y-3 py-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={slide.enabled} onCheckedChange={(v) => update({ enabled: v })} />
                    <span className="text-xs font-medium text-muted-foreground">
                      {slide.enabled ? "Enabled (published)" : "Disabled (hidden)"}
                    </span>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setPreviewIndex(previewIndex === index ? null : index)}>
                    {previewIndex === index ? "Hide preview" : "Preview"}
                  </Button>
                </div>

                {previewIndex === index ? <HeroSlidePreview slide={slide} /> : null}

                <div className="grid gap-3 md:grid-cols-2">
                  <FormField label="Destination">
                    <Input value={slide.destinationLabel} onChange={(e) => update({ destinationLabel: e.target.value })} placeholder="e.g. Rajasthan" />
                  </FormField>
                  <FormField label="Theme (background mood when no image)">
                    <select
                      className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                      value={slide.themeKey}
                      onChange={(e) => update({ themeKey: e.target.value })}
                    >
                      {THEME_KEYS.map((k) => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Heading">
                    <Input value={slide.heading} onChange={(e) => update({ heading: e.target.value })} />
                  </FormField>
                  <FormField label="Subtitle">
                    <Input value={slide.subtitle} onChange={(e) => update({ subtitle: e.target.value })} />
                  </FormField>
                  <FormField label="CTA Text">
                    <Input value={slide.ctaLabel} onChange={(e) => update({ ctaLabel: e.target.value })} />
                  </FormField>
                  <FormField label="CTA Link">
                    <Input value={slide.ctaHref} onChange={(e) => update({ ctaHref: e.target.value })} />
                  </FormField>
                  <FormField label="Overlay Opacity (0–1)">
                    <Input
                      type="number"
                      min={0}
                      max={1}
                      step={0.05}
                      value={slide.overlayOpacity}
                      onChange={(e) => update({ overlayOpacity: Math.min(1, Math.max(0, Number(e.target.value))) })}
                    />
                  </FormField>
                </div>

                <ImageAssetField
                  label="Hero Image"
                  value={slide.image ?? BLANK_IMAGE}
                  onChange={(v) => update({ image: v })}
                  category="homepage-hero"
                  hint="Chosen only from the Media Library. Leave empty to use the themed background instead."
                />
              </div>
            )}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            disabled={heroSlides.length >= MAX_HERO_SLIDES}
            onClick={() => set(["heroSlides"], [...heroSlides, emptyHeroSlide()])}
          >
            Add Slide
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">Drag slides by the handle to reorder. Maximum of 6 slides.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Promotional Banner</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-2 md:col-span-2">
            <Switch checked={data.promoBanner.enabled} onCheckedChange={(v) => set(["promoBanner", "enabled"], v)} id="promo-enabled" />
            <label htmlFor="promo-enabled" className="text-sm font-medium">Show promotional banner</label>
          </div>
          <FormField label="Heading">
            <Input value={data.promoBanner.heading} onChange={(e) => set(["promoBanner", "heading"], e.target.value)} />
          </FormField>
          <FormField label="CTA Label">
            <Input value={data.promoBanner.ctaLabel ?? ""} onChange={(e) => set(["promoBanner", "ctaLabel"], e.target.value)} />
          </FormField>
          <FormField label="Body" className="md:col-span-2">
            <Textarea rows={2} value={data.promoBanner.body} onChange={(e) => set(["promoBanner", "body"], e.target.value)} />
          </FormField>
          <FormField label="CTA Link">
            <Input value={data.promoBanner.ctaHref ?? ""} onChange={(e) => set(["promoBanner", "ctaHref"], e.target.value)} />
          </FormField>
          <div className="md:col-span-2">
            <ImageAssetField
              label="Banner Image"
              value={data.promoBanner.image ?? { provider: "placeholder", url: "", alt: "", width: 1600, height: 400, isPlaceholder: true }}
              onChange={(v) => set(["promoBanner", "image"], v)}
              category="banners"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">CTA Section</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Heading">
            <Input value={data.ctaSection.heading} onChange={(e) => set(["ctaSection", "heading"], e.target.value)} />
          </FormField>
          <FormField label="CTA Label">
            <Input value={data.ctaSection.ctaLabel} onChange={(e) => set(["ctaSection", "ctaLabel"], e.target.value)} />
          </FormField>
          <FormField label="Body" className="md:col-span-2">
            <Textarea rows={2} value={data.ctaSection.body} onChange={(e) => set(["ctaSection", "body"], e.target.value)} />
          </FormField>
          <FormField label="CTA Link">
            <Input value={data.ctaSection.ctaHref} onChange={(e) => set(["ctaSection", "ctaHref"], e.target.value)} />
          </FormField>
          <div className="md:col-span-2">
            <ImageAssetField
              label="Background Image"
              value={data.ctaSection.backgroundImage ?? { provider: "placeholder", url: "", alt: "", width: 1920, height: 1080, isPlaceholder: true }}
              onChange={(v) => set(["ctaSection", "backgroundImage"], v)}
              category="banners"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Featured Trips</CardTitle></CardHeader>
        <CardContent>
          <TripPickerField items={data.featuredTrips ?? []} onChange={(v) => set(["featuredTrips"], v)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Testimonials</CardTitle></CardHeader>
        <CardContent>
          <TestimonialPickerField ids={data.testimonialIds ?? []} onChange={(v) => set(["testimonialIds"], v)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Sections — Order &amp; Visibility</CardTitle></CardHeader>
        <CardContent>
          <ArrayFieldEditor<string>
            items={data.sectionOrder}
            onChange={(v) => set(["sectionOrder"], v)}
            hideAdd
            createItem={() => "hero"}
            renderItem={(section) => (
              <div className="flex items-center justify-between py-0.5">
                <p className="text-sm font-medium">{SECTION_LABELS[section] ?? section}</p>
                {section === "promoBanner" ? (
                  <span className="text-xs text-muted-foreground">Controlled by the toggle above</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={data.sectionVisibility?.[section] ?? true}
                      onCheckedChange={(v) => set(["sectionVisibility", section], v)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {(data.sectionVisibility?.[section] ?? true) ? "Visible" : "Hidden"}
                    </span>
                  </div>
                )}
              </div>
            )}
          />
          <p className="mt-2 text-xs text-muted-foreground">Drag or use the up/down arrows to reorder sections; use the switch to show/hide a section without losing its content.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function HeroSlidePreview({ slide }: { slide: any }) {
  const theme = themeRegistry[slide.themeKey as keyof typeof themeRegistry] ?? themeRegistry.brand;
  const hasImage = slide.image?.url && !slide.image?.isPlaceholder;

  return (
    <div className="relative isolate h-40 w-full overflow-hidden rounded-md border border-border">
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={slide.image.url} alt={slide.image.alt ?? ""} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <ThemeBackground theme={theme} area="section" className="absolute inset-0 h-full w-full" />
      )}
      <div className="absolute inset-0 bg-black" style={{ opacity: slide.overlayOpacity ?? 0.45 }} />
      <div className="relative z-10 flex h-full flex-col justify-end gap-1 p-4">
        {slide.destinationLabel ? (
          <span className="w-fit rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
            {slide.destinationLabel}
          </span>
        ) : null}
        <p className="font-display text-lg font-medium text-white">{slide.heading || "Heading preview"}</p>
        <p className="text-xs text-white/80">{slide.subtitle || "Subtitle preview"}</p>
      </div>
    </div>
  );
}
