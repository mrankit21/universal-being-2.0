/* eslint-disable @typescript-eslint/no-explicit-any -- this page edits a loosely-typed JSON config blob by design, same as app/admin/(dashboard)/homepage/page.tsx */
"use client";

/** Homepage 2.0 Management — full admin control over the new homepage
 * (Hero Parallax, Floating Quick Links, Featured Trips Stack): which
 * image/heading/CTA the hero shows, what each quick-link box says and
 * where it links, and which real trips appear in Featured Trips. Saved as
 * one singleton document (`HomepageV2Model`, via `/api/admin/homepage2`)
 * and reflected on the live homepage immediately once Site Settings →
 * "Homepage Version" is switched to "Homepage 2.0 (new)" — no redeploy. */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FormField } from "@/components/admin/form-field";
import { ImageAssetField } from "@/components/admin/image-asset-field";
import { ArrayFieldEditor } from "@/components/admin/array-field-editor";
import { TripPickerField, type FeaturedTripEntry } from "@/components/admin/trip-picker-field";
import { QUICK_LINK_ICON_NAMES } from "@/components/home/v2/floating-quick-links";
import { FUN_FACT_ICON_NAMES } from "@/components/home/v2/fun-facts-zigzag";

const BLANK_IMAGE = { provider: "placeholder", url: "", alt: "", width: 1600, height: 900, isPlaceholder: true };

function emptyQuickLink() {
  return {
    title: "",
    href: "/",
    variant: "icon" as const,
    icon: "MapPinned",
    image: { ...BLANK_IMAGE },
    gallery: [] as { image: typeof BLANK_IMAGE; title: string }[],
    tag: "",
    description: "",
    wide: false,
    order: 0,
    enabled: true,
  };
}

function emptyGalleryImage() {
  return { image: { ...BLANK_IMAGE }, title: "" };
}

function emptyFunFact() {
  return {
    title: "",
    body: "",
    icon: "Globe",
    learnMoreHref: "",
    order: 0,
    enabled: true,
  };
}

const TAG_TONES = ["brass", "teal", "stone"] as const;

export default function Homepage2Page() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/homepage2")
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
      const res = await fetch("/api/admin/homepage2", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error); return; }
      toast.success("Homepage 2.0 updated");
      setData(json.data);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  // Featured Trips reuses TripPickerField (same picker used by the
  // original Homepage), just carrying extra tag/tagTone fields alongside
  // { tripSlug, enabled }.
  const featuredTripEntries: FeaturedTripEntry[] = (data.featuredTrips ?? []).map((f: any) => ({
    tripSlug: f.tripSlug,
    enabled: f.enabled,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Homepage 2.0</h1>
          <p className="text-sm text-muted-foreground">
            Hero image/text/CTA, Quick Links boxes, and Featured Trips for the new homepage. Switch which
            homepage is live from Site Settings → Homepage Version.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Homepage 2.0"}</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hero</CardTitle>
          <p className="text-sm text-muted-foreground">The full-bleed opening section. Leave blank to keep the current placeholder content.</p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Eyebrow (small label above heading)">
            <Input value={data.hero.eyebrow} onChange={(e) => set(["hero", "eyebrow"], e.target.value)} />
          </FormField>
          <FormField label="CTA Button Label">
            <Input value={data.hero.ctaLabel} onChange={(e) => set(["hero", "ctaLabel"], e.target.value)} />
          </FormField>
          <FormField label="Heading" className="md:col-span-2">
            <Input value={data.hero.heading} onChange={(e) => set(["hero", "heading"], e.target.value)} />
          </FormField>
          <FormField label="Subheading" className="md:col-span-2">
            <Textarea rows={3} value={data.hero.subheading} onChange={(e) => set(["hero", "subheading"], e.target.value)} />
          </FormField>
          <FormField label="CTA Link">
            <Input value={data.hero.ctaHref} onChange={(e) => set(["hero", "ctaHref"], e.target.value)} placeholder="/trips" />
          </FormField>
          <ImageAssetField
            label="Hero Background Image — Desktop / Laptop"
            value={data.hero.imageDesktop ?? BLANK_IMAGE}
            onChange={(v) => set(["hero", "imageDesktop"], v)}
            category="banners"
          />
          <ImageAssetField
            label="Hero Background Image — Mobile / Phone"
            value={data.hero.imageMobile ?? BLANK_IMAGE}
            onChange={(v) => set(["hero", "imageMobile"], v)}
            category="banners"
          />
          <p className="text-xs text-muted-foreground md:col-span-2">
            Mobile falls back to the desktop image if left blank — but a wide laptop photo often crops
            badly on a phone, so uploading a separate portrait/tighter crop here is recommended.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Links</CardTitle>
          <p className="text-sm text-muted-foreground">
            The tile grid right under the hero (Explore Trips, Transport, Hotels, Offers, etc.). Pick a shape
            per tile: <strong>Featured</strong> (one big spotlight card — use for the top tile), <strong>Image</strong>
            (photo card with a title), or <strong>Icon</strong> (icon chip + title + short description).
          </p>
        </CardHeader>
        <CardContent>
          <ArrayFieldEditor
            items={data.quickLinks}
            onChange={(next) => set(["quickLinks"], next)}
            draggable
            createItem={emptyQuickLink}
            addLabel="Add Quick Link"
            emptyMessage="No quick links yet — add the boxes that appear under the hero."
            renderItem={(item: any, index, update) => (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Title">
                    <Input value={item.title} onChange={(e) => update({ title: e.target.value })} />
                  </FormField>
                  <FormField label="Links to (page)">
                    <Input value={item.href} onChange={(e) => update({ href: e.target.value })} placeholder="/trips" />
                  </FormField>
                  <FormField label="Tile Shape">
                    <Select value={item.variant} onValueChange={(v) => update({ variant: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="featured">Featured (big spotlight card)</SelectItem>
                        <SelectItem value="image">Image (photo card)</SelectItem>
                        <SelectItem value="icon">Icon (icon + text)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <div className="flex items-center gap-2 self-end pb-1">
                    <Switch checked={item.enabled} onCheckedChange={(v) => update({ enabled: v })} />
                    <span className="text-sm text-muted-foreground">{item.enabled ? "Visible" : "Hidden"}</span>
                    <Switch checked={item.wide} onCheckedChange={(v) => update({ wide: v })} className="ml-4" />
                    <span className="text-sm text-muted-foreground">Full width</span>
                  </div>
                </div>

                {item.variant === "icon" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField label="Icon">
                      <Select value={item.icon} onValueChange={(v) => update({ icon: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {QUICK_LINK_ICON_NAMES.map((name) => (
                            <SelectItem key={name} value={name}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="Description (short)">
                      <Input value={item.description} onChange={(e) => update({ description: e.target.value })} />
                    </FormField>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ImageAssetField
                      label="Photo"
                      value={item.image ?? BLANK_IMAGE}
                      onChange={(v) => update({ image: v })}
                      category="banners"
                    />
                    {item.variant === "featured" ? (
                      <FormField label="Tag Pill (e.g. Featured)">
                        <Input value={item.tag} onChange={(e) => update({ tag: e.target.value })} />
                      </FormField>
                    ) : null}
                  </div>
                )}

                {item.variant === "featured" ? (
                  <div className="space-y-2 border-t border-border pt-3">
                    <div>
                      <p className="text-sm font-medium">Auto-Playing Gallery (optional)</p>
                      <p className="text-xs text-muted-foreground">
                        Add 2 or more images to make this card auto-cycle every ~3.5s (crossfade + slow zoom),
                        each with its own title — e.g. &quot;Must-See&quot; badge staying fixed while the photo and
                        title rotate through Zayed National Museum → Qasr Al Watan → Sheikh Zayed Grand Mosque.
                        The tag pill above stays fixed as the shared badge. Leave empty to just use the single
                        Photo above with no rotation.
                      </p>
                    </div>
                    <ArrayFieldEditor
                      items={item.gallery ?? []}
                      onChange={(next) => update({ gallery: next })}
                      draggable
                      createItem={emptyGalleryImage}
                      addLabel="Add Gallery Image"
                      emptyMessage="No gallery images — card will show the single Photo above with no auto-play."
                      renderItem={(slide: any, _i, updateSlide) => (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <FormField label="Slide Title (e.g. Zayed National Museum)">
                            <Input value={slide.title} onChange={(e) => updateSlide({ title: e.target.value })} />
                          </FormField>
                          <ImageAssetField
                            label="Slide Image"
                            value={slide.image ?? BLANK_IMAGE}
                            onChange={(v) => updateSlide({ image: v })}
                            category="banners"
                          />
                        </div>
                      )}
                    />
                  </div>
                ) : null}
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Featured Trips</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose real trips to feature on the homepage stack, in the order they should appear — the picker
            below automatically searches Trip 1.0 or Trip 2.0, whichever is live on the site (Site Settings →
            Trips Version), so what you pick here always matches what shows up on the homepage. Tag and tag
            color are optional — leave blank to use the trip&apos;s destination. Cover image is also optional
            — leave blank to use the trip&apos;s own cover photo, or upload one here to use a different photo
            just for this homepage card (the trip&apos;s own page is unaffected).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <TripPickerField
            items={featuredTripEntries}
            onChange={(nextEntries) => {
              // Merge picker changes back in, carrying over each item's
              // tag/tagTone by tripSlug (the picker only knows tripSlug/enabled).
              const bySlug = new Map((data.featuredTrips ?? []).map((f: any) => [f.tripSlug, f]));
              const merged = nextEntries.map((e) => ({
                tripSlug: e.tripSlug,
                enabled: e.enabled,
                tag: (bySlug.get(e.tripSlug) as any)?.tag ?? "",
                tagTone: (bySlug.get(e.tripSlug) as any)?.tagTone ?? "brass",
                coverImage: (bySlug.get(e.tripSlug) as any)?.coverImage ?? undefined,
              }));
              set(["featuredTrips"], merged);
            }}
          />
          {(data.featuredTrips ?? []).length > 0 ? (
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-sm font-medium">Tag overrides (optional)</p>
              {data.featuredTrips.map((f: any, i: number) => (
                <div key={f.tripSlug} className="grid grid-cols-1 gap-3 rounded-lg border border-border p-3 sm:grid-cols-3">
                  <FormField label={f.tripSlug}>
                    <Input
                      value={f.tag}
                      placeholder="Tag (defaults to destination)"
                      onChange={(e) => {
                        const next = [...data.featuredTrips];
                        next[i] = { ...f, tag: e.target.value };
                        set(["featuredTrips"], next);
                      }}
                    />
                  </FormField>
                  <FormField label="Tag Color">
                    <Select
                      value={f.tagTone}
                      onValueChange={(v) => {
                        const next = [...data.featuredTrips];
                        next[i] = { ...f, tagTone: v };
                        set(["featuredTrips"], next);
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TAG_TONES.map((tone) => (
                          <SelectItem key={tone} value={tone} className="capitalize">{tone}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <ImageAssetField
                    label="Cover Image Override (optional)"
                    value={f.coverImage ?? BLANK_IMAGE}
                    onChange={(v) => {
                      const next = [...data.featuredTrips];
                      next[i] = { ...f, coverImage: v };
                      set(["featuredTrips"], next);
                    }}
                    category="banners"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Featured Trips — Section Background</CardTitle>
          <p className="text-sm text-muted-foreground">
            Optional full-bleed background image behind the whole Featured Trips section (distinct from each
            card&apos;s own cover photo above). Leave empty for the plain section background.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Overlay Opacity (0–1)">
            <Input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={data.featuredTripsSection?.overlayOpacity ?? 0.6}
              onChange={(e) =>
                set(["featuredTripsSection", "overlayOpacity"], Math.min(1, Math.max(0, Number(e.target.value))))
              }
            />
          </FormField>
          <div className="md:col-span-2">
            <ImageAssetField
              label="Background Image"
              value={data.featuredTripsSection?.backgroundImage ?? BLANK_IMAGE}
              onChange={(v) => set(["featuredTripsSection", "backgroundImage"], v)}
              category="banners"
              hint="Leave empty for the plain background. Use Overlay Opacity to keep card text/badges readable over the image."
            />
          </div>
          <div className="md:col-span-2">
            <ImageAssetField
              label="Mobile Background Image (optional)"
              value={data.featuredTripsSection?.backgroundImageMobile ?? { ...BLANK_IMAGE, width: 1080, height: 1920 }}
              onChange={(v) => set(["featuredTripsSection", "backgroundImageMobile"], v)}
              category="banners"
              hint="Optional dedicated crop for phone screens (portrait, e.g. 1080×1920). Leave empty to reuse the Background Image above."
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Find Your Destination</CardTitle>
          <p className="text-sm text-muted-foreground">
            Full-bleed banner right under Featured Trips — heading + one line of body text over an
            optional backdrop image. For a seamless look, pick a background crop that visually continues
            the Featured Trips section image above it.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-2 md:col-span-2">
            <Switch
              checked={data.findDestination?.enabled ?? true}
              onCheckedChange={(v) => set(["findDestination", "enabled"], v)}
            />
            <span className="text-sm text-muted-foreground">
              {(data.findDestination?.enabled ?? true) ? "Visible" : "Hidden"}
            </span>
          </div>
          <FormField label="Heading">
            <Input
              value={data.findDestination?.heading ?? "Find your destination"}
              onChange={(e) => set(["findDestination", "heading"], e.target.value)}
            />
          </FormField>
          <FormField label="Overlay Opacity (0–1)">
            <Input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={data.findDestination?.overlayOpacity ?? 0.5}
              onChange={(e) =>
                set(["findDestination", "overlayOpacity"], Math.min(1, Math.max(0, Number(e.target.value))))
              }
            />
          </FormField>
          <FormField label="Body text" className="md:col-span-2">
            <Textarea
              rows={2}
              value={
                data.findDestination?.body ??
                "Your next adventure is waiting. Discover amazing places with Universal Being."
              }
              onChange={(e) => set(["findDestination", "body"], e.target.value)}
            />
          </FormField>
          <div className="md:col-span-2">
            <ImageAssetField
              label="Background Image"
              value={data.findDestination?.backgroundImage ?? BLANK_IMAGE}
              onChange={(v) => set(["findDestination", "backgroundImage"], v)}
              category="banners"
              hint="Leave empty for the plain background. Use Overlay Opacity to keep the heading/text readable over the image."
            />
          </div>
          <div className="md:col-span-2">
            <ImageAssetField
              label="Mobile Background Image (optional)"
              value={data.findDestination?.backgroundImageMobile ?? { ...BLANK_IMAGE, width: 1080, height: 1920 }}
              onChange={(v) => set(["findDestination", "backgroundImageMobile"], v)}
              category="banners"
              hint="Optional dedicated crop for phone screens (portrait, e.g. 1080×1920). Leave empty to reuse the Background Image above."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fun Facts</CardTitle>
          <p className="text-sm text-muted-foreground">
            The &quot;Did you know?&quot; zigzag-edge card carousel. Add as many facts as you like — they
            appear in the order set below, swipeable with dots underneath. Leave empty to show the
            reference placeholder facts.
          </p>
        </CardHeader>
        <CardContent>
          <ArrayFieldEditor
            items={data.funFacts ?? []}
            onChange={(next) => set(["funFacts"], next)}
            draggable
            createItem={emptyFunFact}
            addLabel="Add Fun Fact"
            emptyMessage="No fun facts yet — add a &quot;Did you know?&quot; card."
            renderItem={(item: any, index, update) => (
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Title">
                  <Input value={item.title} onChange={(e) => update({ title: e.target.value })} />
                </FormField>
                <FormField label="Icon">
                  <Select value={item.icon} onValueChange={(v) => update({ icon: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FUN_FACT_ICON_NAMES.map((name) => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Body text" className="sm:col-span-2">
                  <Textarea rows={2} value={item.body} onChange={(e) => update({ body: e.target.value })} />
                </FormField>
                <FormField label="Learn More link (optional)">
                  <Input
                    value={item.learnMoreHref}
                    onChange={(e) => update({ learnMoreHref: e.target.value })}
                    placeholder="/destinations"
                  />
                </FormField>
                <div className="flex items-center gap-2 self-end pb-1">
                  <Switch checked={item.enabled} onCheckedChange={(v) => update({ enabled: v })} />
                  <span className="text-sm text-muted-foreground">{item.enabled ? "Visible" : "Hidden"}</span>
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fun Facts — Section Background</CardTitle>
          <p className="text-sm text-muted-foreground">
            Optional full-bleed background image behind the whole Fun Facts carousel (replaces the plain
            teal background). Leave empty for the plain section background.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Overlay Opacity (0–1)">
            <Input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={data.funFactsSection?.overlayOpacity ?? 0.6}
              onChange={(e) =>
                set(["funFactsSection", "overlayOpacity"], Math.min(1, Math.max(0, Number(e.target.value))))
              }
            />
          </FormField>
          <div className="md:col-span-2">
            <ImageAssetField
              label="Background Image"
              value={data.funFactsSection?.backgroundImage ?? BLANK_IMAGE}
              onChange={(v) => set(["funFactsSection", "backgroundImage"], v)}
              category="banners"
              hint="Leave empty for the plain teal background. Use Overlay Opacity to keep card text readable over the image."
            />
          </div>
          <div className="md:col-span-2">
            <ImageAssetField
              label="Mobile Background Image (optional)"
              value={data.funFactsSection?.backgroundImageMobile ?? { ...BLANK_IMAGE, width: 1080, height: 1920 }}
              onChange={(v) => set(["funFactsSection", "backgroundImageMobile"], v)}
              category="banners"
              hint="Optional dedicated crop for phone screens (portrait, e.g. 1080×1920). Leave empty to reuse the Background Image above."
            />
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
