"use client";

/**
 * GalleryUploadField — generic sibling of `TripGalleryUploadField` for
 * bulk-uploading several images at once outside a trip's own editor (e.g.
 * Homepage 2.0's "Additional Hero Images"). Same drag & drop / multi-select
 * UX and per-file progress, but uploads with `scope: "library"` (shows up
 * in the main Media Library) instead of requiring a `tripSlug`.
 */
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadImageFile } from "@/lib/media/client-upload";
import type { ImageAsset } from "@/types/trip";

export function GalleryUploadField({
  category,
  usage,
  onUploaded,
  label = "Drag & drop multiple images here, or",
}: {
  /** Media Library category tag, e.g. "banners". */
  category: string;
  /** Optional `usage` tag stored on the uploaded asset (see `SmartMediaUpload`'s USAGE_TYPES). */
  usage?: string;
  onUploaded: (assets: ImageAsset[]) => void;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    setUploading(true);
    setProgress({ done: 0, total: list.length });
    const uploaded: ImageAsset[] = [];
    let failures = 0;
    for (const file of list) {
      try {
        const asset = await uploadImageFile(file, {
          category,
          scope: "library",
          usage,
        });
        uploaded.push({
          provider: "imagekit",
          url: asset.url,
          alt: asset.alt || "",
          width: asset.width || 1600,
          height: asset.height || 900,
          isPlaceholder: false,
        });
      } catch (err) {
        failures += 1;
        console.error("[gallery-upload] failed:", err);
      } finally {
        setProgress((p) => (p ? { done: p.done + 1, total: p.total } : p));
      }
    }
    if (uploaded.length > 0) {
      onUploaded(uploaded);
      toast.success(`${uploaded.length} image${uploaded.length === 1 ? "" : "s"} added`);
    }
    if (failures > 0) {
      toast.error(`${failures} image${failures === 1 ? "" : "s"} failed to upload`);
    }
    setUploading(false);
    setProgress(null);
  }

  return (
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
      }}
      className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
        dragOver ? "border-primary bg-primary/5" : "border-border"
      }`}
    >
      <UploadCloud className="size-7 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{label}</p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <Button type="button" variant="outline" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
        {uploading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
        {uploading ? `Uploading ${progress?.done ?? 0}/${progress?.total ?? 0}…` : "Upload multiple images"}
      </Button>
    </div>
  );
}
