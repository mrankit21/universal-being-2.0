"use client";

/**
 * ImageAssetField — edits one `ImageAsset` slot (Architecture §13: "every
 * slot is a typed field, never a bare string"). This is the ONE Image
 * Picker every CMS module uses (Step 7.6B §8 — "wherever an image is
 * required, always open the Media Library Picker"): search, filter by
 * category, browse recent uploads, preview, choose, or remove — all backed
 * by `/api/admin/media`, the single source of truth (Step 7.6A).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ImageIcon, Link2, Loader2, Search, UploadCloud, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { uploadImageFile } from "@/lib/media/client-upload";
import type { ImageAsset } from "@/types/trip";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "homepage-hero", label: "Homepage Hero" },
  { value: "trip-hero", label: "Trip Hero" },
  { value: "trip-gallery", label: "Trip Gallery" },
  { value: "destination-hero", label: "Destination Hero" },
  { value: "destination-gallery", label: "Destination Gallery" },
  { value: "logos", label: "Logos" },
  { value: "icons", label: "Icons" },
  { value: "banners", label: "Banners" },
  { value: "general", label: "General" },
  { value: "future-videos", label: "Future Videos" },
];

interface MediaAsset {
  _id: string;
  url: string;
  alt: string;
  title: string;
  category: string;
  width: number;
  height: number;
}

export function ImageAssetField({
  label,
  value,
  onChange,
  category,
  hint,
}: {
  label: string;
  value: ImageAsset;
  onChange: (next: ImageAsset) => void;
  /** Pre-selects this category in the picker (e.g. "trip-gallery" for a Trip's gallery field). Just a default — the admin can still switch categories. */
  category?: string;
  hint?: string;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(category ?? "all");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (debouncedSearch) params.set("q", debouncedSearch);
      params.set("limit", "60");
      // With no search/category applied, the API's default sort (most
      // recent first) doubles as the "Recent Images" view the picker opens to.
      const res = await fetch(`/api/admin/media?${params.toString()}`);
      const json = await res.json();
      if (json.success) setAssets(json.data.items);
    } catch {
      toast.error("Couldn't load the media library — check your connection");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, debouncedSearch]);

  useEffect(() => {
    if (pickerOpen) load();
  }, [pickerOpen, load]);

  function openPicker() {
    setSearch("");
    setCategoryFilter(category ?? "all");
    setPickerOpen(true);
  }

  function selectAsset(asset: MediaAsset) {
    onChange({
      ...value,
      provider: "imagekit",
      url: asset.url,
      alt: asset.alt || value.alt,
      // asset.width/height can come back 0 from some media records; the
      // schema requires a positive int, so guard against 0 as well as
      // undefined (`||` alone lets 0 slip through and fails save).
      width: asset.width || value.width || 1600,
      height: asset.height || value.height || 900,
      isPlaceholder: false,
    });
    setPickerOpen(false);
  }

  async function handleUpload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const asset = await uploadImageFile(file, { category: category ?? "general" });
      onChange({
        ...value,
        provider: "imagekit",
        url: asset.url,
        alt: asset.alt || value.alt,
        width: asset.width || value.width || 1600,
        height: asset.height || value.height || 900,
        isPlaceholder: false,
      });
      toast.success(`${label} uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function removeImage() {
    onChange({ ...value, provider: "placeholder", url: "", isPlaceholder: true });
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
                handleUpload(e.target.files);
                e.target.value = "";
              }}
            />
            <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
              {uploading ? "Uploading…" : "Upload from device"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={openPicker}>
              <Link2 className="size-4" />
              Choose from Media Library
            </Button>
            {value.url ? (
              <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={removeImage}>
                <X className="size-4" />
                Remove Image
              </Button>
            ) : null}
          </div>
          <Input
            value={value.alt}
            onChange={(e) => onChange({ ...value, alt: e.target.value })}
            placeholder="Alt text"
          />
        </div>
      </div>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Choose from Media Library</DialogTitle>
          </DialogHeader>

          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-56 flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, filename, alt text, or tag…"
                className="pl-8"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!debouncedSearch && categoryFilter === "all" ? (
            <p className="text-xs text-muted-foreground">Showing recent uploads. Search or filter to narrow down.</p>
          ) : null}

          {loading ? (
            <div className="grid max-h-96 grid-cols-4 gap-3 overflow-y-auto">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-md" />
              ))}
            </div>
          ) : assets.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No images match. Add images from the Media Library page first.
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
