/* eslint-disable @typescript-eslint/no-explicit-any -- edits a loosely-typed JSON document by design, same as app/admin/(dashboard)/settings/page.tsx */
"use client";

/**
 * Trip 2.0 Backdrops — one dashboard for the 6 section backgrounds that
 * are the SAME across every Trip 2.0 page (Day by Day Itinerary,
 * Inclusions & Exclusions, Batch Dates, Things To Experience, Did You
 * Know, Still Deciding?), as opposed to Trip Editor → Trip 2.0's "Section Backgrounds"
 * card (Quick Links, Price), which is set per trip.
 *
 * Backed by the same singleton `SiteSettingsModel` / `/api/admin/site-
 * settings` route as the Site Settings page — this just edits one slice
 * of that document (`trip2SectionBackdrops`) — so saving here never
 * touches brand/contact/footer fields, and vice versa.
 */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FormField } from "@/components/admin/form-field";
import { ImageAssetField } from "@/components/admin/image-asset-field";
import { SECTION_BACKDROP_STEP_OPTIONS, DEFAULT_SECTION_BACKDROP_STEP } from "@/lib/theme/section-backdrop-opacity";

const BLANK_IMAGE = { provider: "placeholder", url: "", alt: "", width: 1600, height: 900, isPlaceholder: true };

const SECTIONS: { key: string; label: string; hint: string }[] = [
  {
    key: "itinerary",
    label: "Day by Day Itinerary",
    hint: "Behind the itinerary timeline shown under \u201cChoose Your Pickup City\u201d on every trip.",
  },
  {
    key: "inclusionsExclusions",
    label: "Inclusions & Exclusions",
    hint: "Behind the Inclusions/Exclusions list.",
  },
  {
    key: "batchDates",
    label: "Batch Dates",
    hint: "Behind the upcoming batch dates section.",
  },
  {
    key: "thingsToExperience",
    label: "Things To Experience",
    hint: "Behind the Things To Experience cards.",
  },
  {
    key: "didYouKnow",
    label: "Did You Know",
    hint: "Behind the Did You Know facts.",
  },
  {
    key: "stillDeciding",
    label: "Still Deciding? (Let's Plan Your Trip)",
    hint: "Behind the lead-capture card near the end of the page, for visitors still on the fence.",
  },
];

function emptyBackdrop() {
  return { image: { ...BLANK_IMAGE }, opacityStep: DEFAULT_SECTION_BACKDROP_STEP };
}

export default function Trip2BackdropsPage() {
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

  function setSection(key: string, next: { image: unknown; opacityStep: number }) {
    setData((prev: any) => ({
      ...prev,
      trip2SectionBackdrops: { ...(prev.trip2SectionBackdrops ?? {}), [key]: next },
    }));
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
      if (!json.success) {
        toast.error(json.error);
        return;
      }
      toast.success("Trip 2.0 backdrops updated");
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
          <h1 className="text-2xl font-semibold tracking-tight">Trip 2.0 Backdrops</h1>
          <p className="text-sm text-muted-foreground">
            One background photo per section, applied the same way across every published Trip 2.0 page. Leave a
            photo blank to keep that section plain (no backdrop) until you set one.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Backdrops"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {SECTIONS.map(({ key, label, hint }) => {
          const section = data.trip2SectionBackdrops?.[key] ?? emptyBackdrop();
          return (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="text-base">{label}</CardTitle>
                <p className="text-sm text-muted-foreground">{hint}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ImageAssetField
                  label="Background Photo"
                  value={section.image ?? BLANK_IMAGE}
                  onChange={(v) => setSection(key, { ...section, image: v })}
                  category="trip-section-backdrop"
                  hint="Leave empty to render this section without a backdrop, on every trip."
                />
                <FormField label="Overlay Intensity" hint="How much the cream tint covers the photo — 1 is lightest, 7 is darkest.">
                  <Select
                    value={String(section.opacityStep ?? DEFAULT_SECTION_BACKDROP_STEP)}
                    onValueChange={(v) => setSection(key, { ...section, opacityStep: Number(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTION_BACKDROP_STEP_OPTIONS.map((opt) => (
                        <SelectItem key={opt.step} value={String(opt.step)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
