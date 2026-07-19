"use client";

/**
 * TripImageAssetField — the Trip Editor's own image slot, used everywhere
 * ImageAssetField used to be used inside TripForm (Hero/Cover/Thumbnail/
 * Homepage Hero, per-gallery-item, per-itinerary-day, per-hotel, Review
 * photo, SEO OG image).
 *
 * Two ways to fill a slot, both without ever leaving the Trip edit screen:
 *  1. "Upload from device" — uploads straight to ImageKit and registers it
 *     with `scope: "trip"` + this Trip's slug, so it never clutters (or
 *     shows up in) the main Media Library grid.
 *  2. "Choose from this Trip's uploads" — picks among images already
 *     uploaded for *this* Trip only (never the general Media Library, and
 *     never another Trip's uploads) — keeps the two pools fully separate,
 *     per how the admin asked for this to work.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Check, ImageIcon, Loader2, Search, UploadCloud, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { uploadImageFile } from "@/lib/media/client-upload";
import type { ImageAsset } from "@/types/trip";

interface TripMediaAsset {
  _id: string;
  url: string;
  alt: string;
  title: string;
  width: number;
  height: number;
}

export function TripImageAssetField({
  label,
  value,
  onChange,
  category,
  usage,
  tripSlug,
  tripTitle,
  hint,
}: {
  label: string;
  value: ImageAsset;
  onChange: (next: ImageAsset) => void;
  /** Media category this upload should be filed under, e.g. "trip-hero", "trip-gallery". */
  category?: string;
  /** Optional bookkeeping tag, e.g. "trip-hero-image", "gallery-image". */
  usage?: string;
  /** Current Trip's slug — required to actually upload/browse. Undefined
   * while the Trip has no slug yet (brand-new, unsaved Trip). */
  tripSlug?: string;
  tripTitle?: string;
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [assets, setAssets] = useState<TripMediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    if (!tripSlug) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ scope: "trip", tripSlug, limit: "60" });
      if (debouncedSearch) params.set("q", debouncedSearch);
      const res = await fetch(`/api/admin/media?${params.toString()}`);
      const json = await res.json();
      if (json.success) setAssets(json.data.items);
    } finally {
      setLoading(false);
    }
  }, [tripSlug, debouncedSearch]);

  useEffect(() => {
    if (pickerOpen) load();
  }, [pickerOpen, load]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!tripSlug) {
      toast.error("Set the Trip's Title & Slug first (Basic Info tab), then upload images.");
      return;
    }
    const file = files[0];
    setUploading(true);
    try {
      const asset = await uploadImageFile(file, {
        category: category ?? "general",
        scope: "trip",
        relatedTripSlug: tripSlug,
        relatedTripTitle: tripTitle,
        usage,
      });
      onChange({
        ...value,
        provider: "imagekit",
        url: asset.url,
        alt: asset.alt || value.alt,
        width: asset.width || value.width,
        height: asset.height || value.height,
        isPlaceholder: false,
      });
      toast.success(`${label} uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function selectAsset(asset: TripMediaAsset) {
    onChange({
      ...value,
      provider: "imagekit",
      url: asset.url,
      alt: asset.alt || value.alt,
      width: asset.width || value.width,
      height: asset.height || value.height,
      isPlaceholder: false,
    });
    setPickerOpen(false);
  }

  function removeImage() {
    onChange({ ...value, url: "", isPlaceholder: true });
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex gap-3">
        <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
          {value.url ? (
            <Image src={value.url} alt={value.alt} width={80} height={80} className="size-full object-cover" unoptimized />
          ) : (
            <ImageIcon className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading || !tripSlug}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
              {uploading ? "Uploading…" : "Upload from device"}
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={!tripSlug} onClick={() => setPickerOpen(true)}>
              <ImageIcon className="size-4" />
              Choose from this Trip
            </Button>
            {value.url ? (
              <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={removeImage}>
                <X className="size-4" />
                Remove
              </Button>
            ) : null}
          </div>
          {!tripSlug ? (
            <p className="text-xs text-warning">Set the Trip&rsquo;s Title &amp; Slug in Basic Info first to enable uploads.</p>
          ) : null}
          <Input value={value.alt} onChange={(e) => onChange({ ...value, alt: e.target.value })} placeholder="Alt text" />
        </div>
      </div>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Choose from this Trip&rsquo;s uploads</DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search this trip's images…"
              className="pl-8"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Only images uploaded for this Trip show here — not the main Media Library.
          </p>

          {loading ? (
            <div className="grid max-h-96 grid-cols-4 gap-3 overflow-y-auto">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-md" />
              ))}
            </div>
          ) : assets.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No images uploaded for this Trip yet. Use &ldquo;Upload from device&rdquo; above.
            </p>
          ) : (
            <div className="grid max-h-96 grid-cols-4 gap-3 overflow-y-auto">
              {assets.map((asset) => {
                const isSelected = !!value.url && asset.url === value.url;
                return (
                  <button
                    key={asset._id}
                    type="button"
                    onClick={() => selectAsset(asset)}
                    title={asset.title}
                    className={`group relative overflow-hidden rounded-md border text-left ${
                      isSelected ? "border-primary ring-2 ring-primary" : "border-border hover:ring-2 hover:ring-primary"
                    }`}
                  >
                    <Image
                      src={asset.url}
                      alt={asset.alt}
                      width={160}
                      height={160}
                      className="aspect-square w-full object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent p-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {asset.title}
                    </div>
                    {isSelected ? (
                      <span className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
              setPickerOpen(false);
            }}
            className={`flex items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center text-xs text-muted-foreground transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <UploadCloud className="size-4" />
            Or drag &amp; drop a new image here to upload it for this Trip
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
