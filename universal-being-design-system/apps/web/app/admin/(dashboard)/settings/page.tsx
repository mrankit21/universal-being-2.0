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
        <CardHeader><CardTitle className="text-base">Social Links</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {data.socialLinks.map((link: any, i: number) => (
            <div key={i} className="grid grid-cols-[1fr_2fr_1fr_auto] gap-2">
              <Input value={link.platform} placeholder="Platform" onChange={(e) => {
                const next = [...data.socialLinks]; next[i] = { ...link, platform: e.target.value }; set(["socialLinks"], next);
              }} />
              <Input value={link.href} placeholder="URL" onChange={(e) => {
                const next = [...data.socialLinks]; next[i] = { ...link, href: e.target.value }; set(["socialLinks"], next);
              }} />
              <Input value={link.label} placeholder="Label" onChange={(e) => {
                const next = [...data.socialLinks]; next[i] = { ...link, label: e.target.value }; set(["socialLinks"], next);
              }} />
              <Button variant="ghost" size="icon" onClick={() => set(["socialLinks"], data.socialLinks.filter((_: any, idx: number) => idx !== i))}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => set(["socialLinks"], [...data.socialLinks, { platform: "", href: "", label: "" }])}>
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
        </CardContent>
      </Card>
    </div>
  );
}
