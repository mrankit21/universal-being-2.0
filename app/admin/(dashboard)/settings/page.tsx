/* eslint-disable @typescript-eslint/no-explicit-any -- this page edits a loosely-typed JSON config blob by design */
"use client";

/** Site Settings (requirement #8): brand, contact, social, SEO defaults,
 * Google Maps, footer. */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FormField } from "@/components/admin/form-field";
import { ImageAssetField } from "@/components/admin/image-asset-field";

const emptyImage = () => ({
  provider: "placeholder" as const,
  url: "",
  alt: "",
  width: 512,
  height: 512,
  isPlaceholder: true,
});

export default function SiteSettingsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/site-settings")
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
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error); return; }
      toast.success("Site settings updated");
      setData(json.data);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Site Settings</h1>
          <p className="text-sm text-muted-foreground">Brand, contact details, social links, SEO defaults, and footer.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Settings"}</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Brand</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Company Name">
            <Input value={data.brandName} onChange={(e) => set(["brandName"], e.target.value)} />
          </FormField>
          <FormField label="Tagline">
            <Input value={data.tagline} onChange={(e) => set(["tagline"], e.target.value)} />
          </FormField>
          <FormField label="Brand Story" className="md:col-span-2">
            <Textarea rows={4} value={data.brandStory} onChange={(e) => set(["brandStory"], e.target.value)} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Homepage Version</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose which homepage goes live at <code>/</code>. Switching this never deletes either
            version&apos;s content — edit each one any time from its own panel (Homepage /
            Homepage 2.0) and the live site picks up whichever is selected here.
            &quot;Auto (by device)&quot; shows Homepage 2.0 to visitors on phones/tablets and the
            original Homepage to visitors on laptops/desktops — no manual switching needed.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Active Homepage">
            <Select
              value={data.activeHomepageVersion ?? "v1"}
              onValueChange={(v) => set(["activeHomepageVersion"], v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="v1">Homepage (original)</SelectItem>
                <SelectItem value="v2">Homepage 2.0 (new)</SelectItem>
                <SelectItem value="auto">Auto (phone = 2.0, laptop = original)</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trips Version</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose which trip page design goes live at <code>/trips/[slug]</code> across the whole site.
            Leaving this on &quot;Trips (original)&quot; keeps each trip on whatever its own &quot;Page
            Version&quot; field (in that Trip&apos;s editor) says. Switching this to &quot;Trip 2.0&quot;
            forces every trip that has a matching published Trip 2.0 page to use the new design — a trip
            with no published Trip 2.0 page yet keeps showing its original page either way.
            &quot;Auto (by device)&quot; is strict and ignores each trip&apos;s own &quot;Page
            Version&quot; field entirely: visitors on phones/tablets always get Trip 2.0 (a trip with
            no published Trip 2.0 page shows a not-found page for them, no fallback to the original),
            and visitors on laptops/desktops always get the original design.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Active Trips Design">
            <Select
              value={data.activeTripsVersion ?? "v1"}
              onValueChange={(v) => set(["activeTripsVersion"], v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="v1">Trips (original)</SelectItem>
                <SelectItem value="v2">Trip 2.0 (new)</SelectItem>
                <SelectItem value="auto">Auto (phone = 2.0, laptop = original)</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Brand Assets</CardTitle></CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <ImageAssetField
            label="Logo"
            value={data.logo ?? emptyImage()}
            onChange={(v) => set(["logo"], v)}
            category="logos"
          />
          <ImageAssetField
            label="Dark Logo"
            hint="Used on light backgrounds / print."
            value={data.logoDark ?? emptyImage()}
            onChange={(v) => set(["logoDark"], v)}
            category="logos"
          />
          <ImageAssetField
            label="Favicon"
            value={data.favicon ?? emptyImage()}
            onChange={(v) => set(["favicon"], v)}
            category="icons"
          />
          <ImageAssetField
            label="Apple Touch Icon"
            value={data.appleTouchIcon ?? emptyImage()}
            onChange={(v) => set(["appleTouchIcon"], v)}
            category="icons"
          />
          <ImageAssetField
            label="Open Graph Image"
            hint="Shown when the site is shared on social media."
            value={data.ogImage ?? emptyImage()}
            onChange={(v) => set(["ogImage"], v)}
            category="banners"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Phone Number">
            <Input value={data.contact.phone} onChange={(e) => set(["contact", "phone"], e.target.value)} />
          </FormField>
          <FormField label="WhatsApp">
            <Input value={data.contact.whatsapp} onChange={(e) => set(["contact", "whatsapp"], e.target.value)} />
          </FormField>
          <FormField label="Email">
            <Input value={data.contact.email} onChange={(e) => set(["contact", "email"], e.target.value)} />
          </FormField>
          <FormField label="Address">
            <Input value={data.contact.address} onChange={(e) => set(["contact", "address"], e.target.value)} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Social Links</CardTitle>
          <p className="text-sm text-muted-foreground">
            Add Instagram, Facebook, WhatsApp, etc. Upload a picture for each one — the footer shows that image
            instead of the built-in icon whenever one is uploaded.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.socialLinks.map((link: any, i: number) => (
            <div key={i} className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <ImageAssetField
                  label="Icon"
                  hint="Upload the logo picture for this platform (square works best)."
                  value={link.icon ?? emptyImage()}
                  onChange={(v) => {
                    const next = [...data.socialLinks];
                    next[i] = { ...link, icon: v };
                    set(["socialLinks"], next);
                  }}
                  category="icons"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => set(["socialLinks"], data.socialLinks.filter((_: any, idx: number) => idx !== i))}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Input value={link.platform} placeholder="Platform (e.g. facebook)" onChange={(e) => {
                  const next = [...data.socialLinks]; next[i] = { ...link, platform: e.target.value }; set(["socialLinks"], next);
                }} />
                <Input value={link.href} placeholder="URL" onChange={(e) => {
                  const next = [...data.socialLinks]; next[i] = { ...link, href: e.target.value }; set(["socialLinks"], next);
                }} />
                <Input value={link.label} placeholder="Label" onChange={(e) => {
                  const next = [...data.socialLinks]; next[i] = { ...link, label: e.target.value }; set(["socialLinks"], next);
                }} />
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => set(["socialLinks"], [...data.socialLinks, { platform: "", href: "", label: "", icon: emptyImage() }])}>
            <Plus className="size-4" /> Add Social Link
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">SEO Defaults</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Default Meta Title">
            <Input value={data.seoDefaults.title} onChange={(e) => set(["seoDefaults", "title"], e.target.value)} />
          </FormField>
          <FormField label="Default Meta Description">
            <Input value={data.seoDefaults.description} onChange={(e) => set(["seoDefaults", "description"], e.target.value)} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Google Maps & Footer</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <FormField label="Google Maps Embed URL">
            <Input value={data.googleMapsEmbedUrl ?? ""} onChange={(e) => set(["googleMapsEmbedUrl"], e.target.value)} />
          </FormField>
          <FormField label="Footer Copyright Holder">
            <Input value={data.footer.copyrightHolder} onChange={(e) => set(["footer", "copyrightHolder"], e.target.value)} />
          </FormField>
          <FormField label="Overlay Opacity (0–1)">
            <Input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={data.footer.overlayOpacity ?? 0.7}
              onChange={(e) => set(["footer", "overlayOpacity"], Math.min(1, Math.max(0, Number(e.target.value))))}
            />
          </FormField>
          <ImageAssetField
            label="Footer Background Image"
            value={data.footer.backgroundImage ?? emptyImage()}
            onChange={(v) => set(["footer", "backgroundImage"], v)}
            category="banners"
            hint="Leave empty for the plain purple background. Use Overlay Opacity to darken the image so footer text stays readable."
          />
          <ImageAssetField
            label="Mobile Footer Background Image (optional)"
            value={data.footer.backgroundImageMobile ?? emptyImage()}
            onChange={(v) => set(["footer", "backgroundImageMobile"], v)}
            category="banners"
            hint="Optional dedicated crop for phone screens (portrait, e.g. 1080×1920). Leave empty to reuse the Footer Background Image above — do this only if that image loses an important subject when cropped narrow."
          />
        </CardContent>
      </Card>
    </div>
  );
}
