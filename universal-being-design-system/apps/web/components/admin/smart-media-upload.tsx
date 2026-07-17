"use client";

/**
 * SmartMediaUpload — IMPROVE-1 "Travel-Aware Smart Media Library Workflow"
 * (REVISION). Implements the 6 numbered cases from the revised spec:
 *
 *   1. Trip        → Choose Trip → Image Type (Trip-only options) → [Gallery Position]
 *   2. Homepage Hero→ Choose Destination → (no Image Type step) → Hero Slide
 *   3. Destination  → Choose Destination → Image Type (Destination-only options) → [Gallery Position]
 *   4. Logo         → Logo Type (Header/Footer/Dark/Favicon/Apple Icon)
 *   5. Announcement → locked to Banner
 *   6. Review       → locked to Reviewer Image
 *
 * Smart Filtering: each Asset Type only ever shows the Image Type options
 * that make sense for it (spec: "Do NOT show every Image Type for every
 * Asset Type"). Cases with nothing to pick (Announcement, Review, CTA,
 * General) skip the dropdown entirely and show the locked usage as plain
 * text instead — there's nothing to choose, so nothing to click.
 *
 * Every field this component sets lives on optional Media model properties,
 * so this stays purely additive — leaving "General" selected behaves
 * exactly like the pre-Improve-1 upload flow.
 */
import { CheckCircle2, Circle, MoveRight } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FormField } from "@/components/admin/form-field";
import { cn } from "@/lib/utils";

/**
 * Destination is its own Asset Type again (Choose Destination → Image Type,
 * same shape as Trip) — homepage destination cards (`ThemeExplorerSection`)
 * need real cover photos uploaded somewhere, and folding them into Trip
 * left no way to do that from the wizard. Homepage Hero stays folded into
 * Trip's Image Type list (below) rather than becoming its own Asset Type.
 */
export const ASSET_TYPES: { value: string; label: string }[] = [
  { value: "trip", label: "Trip" },
  { value: "destination", label: "Destination" },
  { value: "logo", label: "Logo" },
  { value: "announcement", label: "Announcement" },
  { value: "review", label: "Review" },
  { value: "general", label: "General" },
];

/** Full usage taxonomy — used for the Smart Filters row and the Detail
 * Panel, where every value should stay selectable regardless of the asset's
 * current Asset Type. The wizard itself uses the filtered, per-case lists
 * below instead of this full list. */
export const USAGE_TYPES: { value: string; label: string }[] = [
  { value: "homepage-hero-image", label: "Homepage Hero Image" },
  { value: "trip-hero-image", label: "Trip Hero Image" },
  { value: "destination-hero", label: "Destination Hero" },
  { value: "cover-image", label: "Cover Image" },
  { value: "thumbnail", label: "Thumbnail" },
  { value: "gallery-image", label: "Gallery Image" },
  { value: "banner", label: "Banner" },
  { value: "review-image", label: "Review Image" },
  { value: "header-logo", label: "Header Logo" },
  { value: "footer-logo", label: "Footer Logo" },
  { value: "dark-logo", label: "Dark Logo" },
  { value: "favicon", label: "Favicon" },
  { value: "apple-icon", label: "Apple Icon" },
  { value: "general", label: "General" },
];

export const assetTypeLabel = (v?: string) => (v ? ASSET_TYPES.find((a) => a.value === v)?.label ?? v : undefined);
export const usageLabel = (v?: string) => (v ? USAGE_TYPES.find((u) => u.value === v)?.label ?? v : undefined);

interface UsageOption {
  value: string;
  label: string;
}

/** REVISION — "Smart Filtering": exactly which Image Type options (and
 * which upstream picker) each Asset Type gets, per Cases 1–6 of the spec.
 * `usageOptions: null` means there's nothing to choose — usage is locked to
 * `fixedUsage` and shown as read-only text instead of a dropdown. */
interface AssetTypeConfig {
  needsTrip: boolean;
  needsDestination: boolean;
  usageStepLabel: string;
  usageOptions: UsageOption[] | null;
  fixedUsage?: string;
  /** Case 2 only: Homepage Hero skips the Image Type step and goes
   * straight to Hero Slide. */
  skipToHeroSlide?: boolean;
}

export const ASSET_TYPE_CONFIG: Record<string, AssetTypeConfig> = {
  trip: {
    needsTrip: true,
    needsDestination: false,
    usageStepLabel: "Image Type",
    usageOptions: [
      { value: "homepage-hero-image", label: "Homepage Hero" },
      { value: "trip-hero-image", label: "Trip Hero" },
      { value: "cover-image", label: "Cover Image" },
      { value: "thumbnail", label: "Thumbnail" },
      { value: "gallery-image", label: "Gallery" },
    ],
  },
  destination: {
    needsTrip: false,
    needsDestination: true,
    usageStepLabel: "Image Type",
    usageOptions: [
      { value: "destination-hero", label: "Destination Hero" },
      { value: "cover-image", label: "Cover Image" },
      { value: "thumbnail", label: "Thumbnail" },
      { value: "gallery-image", label: "Gallery" },
    ],
  },
  logo: {
    needsTrip: false,
    needsDestination: false,
    usageStepLabel: "Logo Type",
    usageOptions: [
      { value: "header-logo", label: "Header Logo" },
      { value: "footer-logo", label: "Footer Logo" },
      { value: "dark-logo", label: "Dark Logo" },
      { value: "favicon", label: "Favicon" },
      { value: "apple-icon", label: "Apple Icon" },
    ],
  },
  announcement: {
    needsTrip: false,
    needsDestination: false,
    usageStepLabel: "Image Type",
    usageOptions: null,
    fixedUsage: "banner",
  },
  review: {
    needsTrip: false,
    needsDestination: false,
    usageStepLabel: "Image Type",
    usageOptions: null,
    fixedUsage: "review-image",
  },
  general: {
    needsTrip: false,
    needsDestination: false,
    usageStepLabel: "Image Type",
    usageOptions: null,
    fixedUsage: "general",
  },
};

export interface TripOption {
  slug: string;
  title: string;
}

export interface DestinationOption {
  slug: string;
  name: string;
}

export interface SmartUploadMeta {
  assetType: string;
  relatedTripSlug?: string;
  relatedTripTitle?: string;
  relatedDestinationSlug?: string;
  relatedDestinationName?: string;
  usage?: string;
  heroSlideNumber?: number;
  galleryPosition?: number;
}

export function defaultSmartUploadMeta(): SmartUploadMeta {
  return { assetType: "general", usage: "general" };
}

function configFor(assetType: string): AssetTypeConfig {
  return ASSET_TYPE_CONFIG[assetType] ?? ASSET_TYPE_CONFIG.general;
}

/** REVISION — "Upload Progress": builds the ✔ Step n checklist shown below
 * the wizard, reflecting exactly which of this Asset Type's steps are
 * filled in so far. Steps that don't apply to the current case (e.g. no
 * Trip step for Homepage Hero) are left out rather than shown as skipped. */
function buildSteps(value: SmartUploadMeta, config: AssetTypeConfig) {
  const steps: { label: string; done: boolean }[] = [{ label: "Asset Type", done: !!value.assetType }];

  if (config.needsTrip) steps.push({ label: "Choose Trip", done: !!value.relatedTripSlug });
  if (config.needsDestination) steps.push({ label: "Choose Destination", done: !!value.relatedDestinationSlug });

  if (config.usageOptions && !config.skipToHeroSlide) {
    steps.push({ label: config.usageStepLabel, done: !!value.usage });
  }

  const effectiveUsage = value.usage ?? config.fixedUsage;
  if (effectiveUsage === "homepage-hero-image") {
    steps.push({ label: "Hero Slide", done: !!value.heroSlideNumber });
  } else if (effectiveUsage === "gallery-image") {
    steps.push({ label: "Gallery Position", done: !!value.galleryPosition });
  }

  steps.push({ label: "Upload", done: false });
  return steps;
}

function UploadProgress({ steps }: { steps: { label: string; done: boolean }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      {steps.map((step, i) => (
        <span key={step.label} className="flex items-center gap-1.5">
          <span className={cn("flex items-center gap-1", step.done ? "text-primary" : "text-muted-foreground")}>
            {step.done ? <CheckCircle2 className="size-3.5" /> : <Circle className="size-3.5" />}
            {step.label}
          </span>
          {i < steps.length - 1 ? <MoveRight className="size-3 text-muted-foreground" /> : null}
        </span>
      ))}
    </div>
  );
}

export function SmartMediaUpload({
  value,
  onChange,
  trips,
  destinations,
}: {
  value: SmartUploadMeta;
  onChange: (next: SmartUploadMeta) => void;
  trips: TripOption[];
  destinations: DestinationOption[];
}) {
  const config = configFor(value.assetType);

  function setAssetType(assetType: string) {
    const next = configFor(assetType);
    // Fixed-usage cases (Logo has no single default — Announcement/
    // Review/CTA/General/Homepage Hero do) lock usage immediately;
    // filtered-list cases (Trip, Destination) default to their first
    // option so there's always a sensible value without an extra click.
    const nextUsage = next.fixedUsage ?? next.usageOptions?.[0]?.value;
    onChange({
      assetType,
      // Downstream selections don't carry across asset types.
      relatedTripSlug: undefined,
      relatedTripTitle: undefined,
      relatedDestinationSlug: undefined,
      relatedDestinationName: undefined,
      // The Hero Slide / Gallery Position selects always *display* a
      // default of 1 regardless of state (`value.heroSlideNumber ?? 1`),
      // so when the auto-selected usage requires one of those fields it
      // must be initialized to match what's on screen — otherwise the
      // dropdown shows "Slide 1" while the underlying value stays
      // undefined forever (its onValueChange never fires because the
      // visible value never changes), permanently failing isWizardReady().
      heroSlideNumber: nextUsage === "homepage-hero-image" ? 1 : undefined,
      galleryPosition: nextUsage === "gallery-image" ? 1 : undefined,
      usage: nextUsage,
    });
  }

  function setUsage(usage: string) {
    onChange({
      ...value,
      usage,
      heroSlideNumber: usage === "homepage-hero-image" ? (value.heroSlideNumber ?? 1) : undefined,
      galleryPosition: usage === "gallery-image" ? (value.galleryPosition ?? 1) : undefined,
    });
  }

  const effectiveUsage = value.usage ?? config.fixedUsage;
  const tripOptions = trips.map((t) => ({ value: t.slug, label: t.title }));
  const destinationOptions = destinations.map((d) => ({ value: d.slug, label: d.name }));

  return (
    <div className="space-y-3">
      <div className="grid gap-4 rounded-lg border border-dashed border-border p-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormField label="1. Asset Type">
          <Select value={value.assetType} onValueChange={setAssetType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSET_TYPES.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {config.needsDestination ? (
          <FormField label="2. Destination">
            <Select
              value={value.relatedDestinationSlug ?? ""}
              onValueChange={(slug) => {
                const dest = destinations.find((d) => d.slug === slug);
                onChange({ ...value, relatedDestinationSlug: slug, relatedDestinationName: dest?.name });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose destination…" />
              </SelectTrigger>
              <SelectContent>
                {destinationOptions.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        ) : null}

        {config.needsTrip ? (
          <FormField label="2. Choose Trip">
            <Select
              value={value.relatedTripSlug ?? ""}
              onValueChange={(slug) => {
                const trip = trips.find((t) => t.slug === slug);
                onChange({ ...value, relatedTripSlug: slug, relatedTripTitle: trip?.title });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose trip…" />
              </SelectTrigger>
              <SelectContent>
                {tripOptions.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        ) : null}

        {/* Case 2 (Homepage Hero): no Image Type step at all — straight to
            Hero Slide. Cases 5/6/CTA/General: nothing to choose, so the
            locked usage is shown as plain text rather than a dropdown. */}
        {config.usageOptions ? (
          <FormField label={`3. ${config.usageStepLabel}`}>
            <Select value={effectiveUsage} onValueChange={setUsage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {config.usageOptions.map((u) => (
                  <SelectItem key={u.value} value={u.value}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        ) : !config.skipToHeroSlide ? (
          <FormField label={`3. ${config.usageStepLabel}`}>
            <p className="flex h-9 items-center rounded-md border border-dashed border-border bg-muted/40 px-3 text-sm text-muted-foreground">
              {usageLabel(effectiveUsage)} (fixed)
            </p>
          </FormField>
        ) : null}

        {effectiveUsage === "homepage-hero-image" ? (
          <FormField label="4. Hero Slide">
            <Select
              value={String(value.heroSlideNumber ?? 1)}
              onValueChange={(v) => onChange({ ...value, heroSlideNumber: Number(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    Slide {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        ) : null}

        {effectiveUsage === "gallery-image" ? (
          <FormField label="4. Gallery Position">
            <Select
              value={String(value.galleryPosition ?? 1)}
              onValueChange={(v) => onChange({ ...value, galleryPosition: Number(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    Gallery Image {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        ) : null}
      </div>

      <UploadProgress steps={buildSteps(value, config)} />
    </div>
  );
}