/* eslint-disable @typescript-eslint/no-explicit-any -- this page edits a loosely-typed JSON config blob by design */
"use client";

/**
 * Theme Management (requirement #4). Every `ThemeConfig` field (Architecture
 * §4) is editable: the common ones — colors, typography mood, CTA style,
 * animation preset, decorative background/particles — get dedicated
 * controls; everything else in the config is reachable via the "Advanced"
 * raw-JSON editor so no field of `ThemeConfig` is ever locked out of the
 * Admin Panel, without hand-building 20 bespoke sub-forms.
 */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/admin/form-field";

interface ThemeDoc {
  _id: string;
  key: string;
  name: string;
  config: Record<string, any>;
  isSeasonal: boolean;
  seasonalStart?: string;
  seasonalEnd?: string;
  isActiveHomepageTheme: boolean;
}

const TYPOGRAPHY_MOODS = ["warm", "cool", "airy", "earthy", "crisp"];
const CTA_STYLES = ["solid", "gradient", "glass"];
const BUTTON_STYLES = ["solid", "outline", "glass", "pill"];
const ANIMATION_PRESETS = ["warm-drift", "cold-drift", "rain-fall", "wave-motion", "fog-drift", "leaf-fall", "none"];
const PARTICLE_TYPES = ["gold-dust", "snow", "rain", "leaves", "birds", "none"];

function ThemeEditor({ theme, onSaved }: { theme: ThemeDoc; onSaved: (t: ThemeDoc) => void }) {
  const [config, setConfig] = useState(theme.config);
  const [isSeasonal, setIsSeasonal] = useState(theme.isSeasonal);
  const [seasonalStart, setSeasonalStart] = useState(theme.seasonalStart ?? "");
  const [seasonalEnd, setSeasonalEnd] = useState(theme.seasonalEnd ?? "");
  const [isActive, setIsActive] = useState(theme.isActiveHomepageTheme);
  const [jsonText, setJsonText] = useState(JSON.stringify(theme.config, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function patchConfig(path: string[], val: unknown) {
    setConfig((prev: any) => {
      const next = structuredClone(prev);
      let cursor = next;
      for (let i = 0; i < path.length - 1; i++) cursor = cursor[path[i]];
      cursor[path[path.length - 1]] = val;
      setJsonText(JSON.stringify(next, null, 2));
      return next;
    });
  }

  async function handleSave() {
    let finalConfig = config;
    try {
      finalConfig = JSON.parse(jsonText);
      setJsonError(null);
    } catch {
      setJsonError("Advanced config is not valid JSON — fix it before saving.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/themes/${theme._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: theme.key,
          config: finalConfig,
          isSeasonal,
          seasonalStart: seasonalStart || undefined,
          seasonalEnd: seasonalEnd || undefined,
          isActiveHomepageTheme: isActive,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error);
        return;
      }
      toast.success(`${theme.name} theme updated`);
      onSaved(json.data);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="capitalize">{theme.name}</CardTitle>
          <CardDescription>Theme key: {theme.key}</CardDescription>
        </div>
        {theme.isActiveHomepageTheme ? <Badge>Active Homepage Theme</Badge> : null}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Primary Color">
            <Input type="color" value={config.palette?.primary ?? "#000000"} onChange={(e) => patchConfig(["palette", "primary"], e.target.value)} className="h-10" />
          </FormField>
          <FormField label="Secondary Color">
            <Input type="color" value={config.palette?.secondary ?? "#000000"} onChange={(e) => patchConfig(["palette", "secondary"], e.target.value)} className="h-10" />
          </FormField>
          <FormField label="Accent Color">
            <Input type="color" value={config.palette?.accent ?? "#000000"} onChange={(e) => patchConfig(["palette", "accent"], e.target.value)} className="h-10" />
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Typography Mood">
            <Select value={config.typographyMood} onValueChange={(v) => patchConfig(["typographyMood"], v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TYPOGRAPHY_MOODS.map((m) => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="CTA Style">
            <Select value={config.cta?.style} onValueChange={(v) => patchConfig(["cta", "style"], v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CTA_STYLES.map((m) => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="Button Style">
            <Select value={config.button?.style} onValueChange={(v) => patchConfig(["button", "style"], v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{BUTTON_STYLES.map((m) => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Animation Preset (Decorative Background)">
            <Select value={config.animation?.preset} onValueChange={(v) => patchConfig(["animation", "preset"], v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ANIMATION_PRESETS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="Particle Type">
            <Select value={config.particle?.type} onValueChange={(v) => patchConfig(["particle", "type"], v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PARTICLE_TYPES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="Particle Density">
            <Input type="number" min={0} value={config.particle?.density ?? 0} onChange={(e) => patchConfig(["particle", "density"], Number(e.target.value))} />
          </FormField>
        </div>

        <div className="flex flex-wrap items-center gap-6 rounded-md border border-border p-4">
          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} id={`active-${theme._id}`} />
            <label htmlFor={`active-${theme._id}`} className="text-sm font-medium">Active homepage theme</label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isSeasonal} onCheckedChange={setIsSeasonal} id={`seasonal-${theme._id}`} />
            <label htmlFor={`seasonal-${theme._id}`} className="text-sm font-medium">Seasonal theme</label>
          </div>
          {isSeasonal ? (
            <div className="flex items-center gap-2">
              <Input placeholder="MM-DD start" value={seasonalStart} onChange={(e) => setSeasonalStart(e.target.value)} className="w-28" />
              <span className="text-muted-foreground">to</span>
              <Input placeholder="MM-DD end" value={seasonalEnd} onChange={(e) => setSeasonalEnd(e.target.value)} className="w-28" />
            </div>
          ) : null}
        </div>

        <FormField label="Advanced: full theme config (JSON)" error={jsonError ?? undefined} hint="Every ThemeConfig field is editable here, including gradients, motifs, dark mode, borders, and shadows.">
          <Textarea rows={10} className="font-mono text-xs" value={jsonText} onChange={(e) => setJsonText(e.target.value)} />
        </FormField>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Theme"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ThemesPage() {
  const [themes, setThemes] = useState<ThemeDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/themes")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setThemes(json.data);
        else toast.error(json.error);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Theme Management</h1>
        <p className="text-sm text-muted-foreground">
          Tune the active theme, seasonal themes, homepage theme, typography, colors, CTA style, decorative
          backgrounds, and animation presets.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading themes…</p>
      ) : (
        <div className="space-y-6">
          {themes.map((theme) => (
            <ThemeEditor
              key={theme._id}
              theme={theme}
              onSaved={(updated) => setThemes((prev) => prev.map((t) => (t._id === updated._id ? updated : t)))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
