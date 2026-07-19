"use client";

/**
 * TripGalleryUploadField — "upload multiple images at once" for a Trip's
 * Gallery tab. Sits above the existing one-by-one ArrayFieldEditor list
 * (untouched) as an additive fast path: select or drag & drop several
 * files, each uploads straight to ImageKit and registers with
 * `scope: "trip"`, then all of them get appended to the Trip's gallery
 * array in one go.
 */
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadImageFile } from "@/lib/media/client-upload";
import type { ImageAsset } from "@/types/trip";

export function TripGalleryUploadField({
  tripSlug,
  tripTitle,
  onUploaded,
}: {
  tripSlug?: string;
  tripTitle?: string;
  onUploaded: (assets: ImageAsset[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!tripSlug) {
      toast.error("Set the Trip's Title & Slug first (Basic Info tab), then upload gallery images.");
      return;
    }
    const list = Array.from(files);
    setUploading(true);
    setProgress({ done: 0, total: list.length });
    const uploaded: ImageAsset[] = [];
    let failures = 0;
    for (const file of list) {
      try {
        const asset = await uploadImageFile(file, {
          category: "trip-gallery",
          scope: "trip",
          relatedTripSlug: tripSlug,
          relatedTripTitle: tripTitle,
          usage: "gallery-image",
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
        console.error("[trip-gallery-upload] failed:", err);
      } finally {
        setProgress((p) => (p ? { done: p.done + 1, total: p.total } : p));
      }
    }
    if (uploaded.length > 0) {
      onUploaded(uploaded);
      toast.success(`${uploaded.length} image${uploaded.length === 1 ? "" : "s"} added to gallery`);
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
      <p className="text-sm text-muted-foreground">Drag &amp; drop multiple gallery images here, or</p>
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
      <Button type="button" variant="outline" disabled={uploading || !tripSlug} onClick={() => fileInputRef.current?.click()}>
        {uploading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
        {uploading ? `Uploading ${progress?.done ?? 0}/${progress?.total ?? 0}…` : "Upload multiple images"}
      </Button>
      {!tripSlug ? (
        <p className="text-xs text-warning">Set the Trip&rsquo;s Title &amp; Slug in Basic Info first to enable uploads.</p>
      ) : (
        <p className="text-xs text-muted-foreground">These images are added straight to this Trip&rsquo;s gallery below.</p>
      )}
    </div>
  );
}
