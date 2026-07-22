"use client";

/**
 * Media Library — Digital Asset Management foundation (Step 7.6A).
 * The single source of truth for every image used across the site.
 *
 * Uploads two ways:
 *  1. "Upload from device" (click or drag & drop) — gets signed params from
 *     `/api/admin/media/sign` and posts the file directly to ImageKit.
 *     Requires IMAGEKIT_* env vars; falls back gracefully if unset.
 *  2. "Add by URL" — registers an already-hosted image. Always available,
 *     so the library is fully usable even without ImageKit configured.
 *
 * Every asset can be searched, filtered by category, previewed in a detail
 * panel, renamed, re-tagged, re-categorized, replaced (new binary, same
 * record), copied, and deleted — with a live "Used In" list computed from
 * the site's content collections.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Copy,
  ExternalLink,
  ImageIcon,
  Loader2,
  Plus,
  Replace,
  Search,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { FormField } from "@/components/admin/form-field";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  SmartMediaUpload,
  defaultSmartUploadMeta,
  type SmartUploadMeta,
  type TripOption,
  type DestinationOption,
} from "@/components/admin/smart-media-upload";

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
const categoryLabel = (v: string) => CATEGORIES.find((c) => c.value === v)?.label ?? v;

/** Best-effort mapping from the SmartMediaUpload wizard's granular `usage`
 * value to the library's browse/filter `category`, so wizard uploads still
 * sort sensibly in the existing grid + filter without a schema migration. */
function categoryForUsage(usage?: string): string {
  switch (usage) {
    case "homepage-hero-image":
      return "homepage-hero";
    case "trip-hero-image":
      return "trip-hero";
    case "cover-image":
    case "thumbnail":
    case "gallery-image":
      return "trip-gallery";
    case "destination-hero":
      return "destination-hero";
    case "header-logo":
    case "footer-logo":
    case "dark-logo":
    case "favicon":
    case "apple-icon":
      return "logos";
    case "banner":
      return "banners";
    default:
      return "general";
  }
}

/** A Trip-asset wizard selection isn't "complete" (and shouldn't be
 * uploadable) until every required step is filled in. */
function isWizardReady(meta: SmartUploadMeta): boolean {
  if (meta.assetType === "trip") {
    if (!meta.relatedTripSlug || !meta.usage) return false;
    if (meta.usage === "gallery-image" && !meta.galleryPosition) return false;
    if (meta.usage === "homepage-hero-image" && !meta.heroSlideNumber) return false;
  }
  return true;
}

interface UsageReference {
  model: string;
  id: string;
  label: string;
  field: string;
  href?: string;
}

interface MediaAsset {
  _id: string;
  url: string;
  thumbnailUrl?: string;
  title: string;
  slug: string;
  alt: string;
  width: number;
  height: number;
  category: string;
  tags: string[];
  filename: string;
  mimeType?: string;
  bytes?: number;
  provider: string;
  publicId?: string;
  uploadedBy?: string;
  usageReferences: UsageReference[];
  createdAt: string;
}

function formatBytes(bytes?: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export default function MediaLibraryPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [unusedOnly, setUnusedOnly] = useState(false);

  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [addMeta, setAddMeta] = useState<SmartUploadMeta>(defaultSmartUploadMeta());
  const [adding, setAdding] = useState(false);

  const [uploadMeta, setUploadMeta] = useState<SmartUploadMeta>(defaultSmartUploadMeta());
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trip-First CMS: every Trip currently on the site, for the "Choose Trip"
  // step — a plain dropdown listing ALL trips from MongoDB, no search box.
  const [trips, setTrips] = useState<TripOption[]>([]);
  const [destinations, setDestinations] = useState<DestinationOption[]>([]);

  // Live ImageKit config status (see /api/admin/media/config) — replaces
  // the old static "Requires IMAGEKIT_..." text, which showed unconditionally
  // regardless of whether the env vars were actually set. `null` = still
  // checking; only used to decide what to show, direct upload is always
  // attempted (the sign endpoint is the real source of truth) so this can
  // never block a working upload even if the probe itself fails.
  const [imagekitReady, setImagekitReady] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/media/config")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setImagekitReady(Boolean(json.data.imagekitConfigured));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/admin/trips?limit=1000")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setTrips(json.data.trips.map((t: { slug: string; title: string }) => ({ slug: t.slug, title: t.title })));
        }
      })
      .catch(() => {});
    fetch("/api/admin/destinations")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setDestinations(
            (json.data as Array<{ slug: string; name: string }>).map((d) => ({ slug: d.slug, name: d.name }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingField, setSavingField] = useState<string | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replacing, setReplacing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (unusedOnly) params.set("unused", "true");
      params.set("page", String(page));
      params.set("limit", "24");
      const res = await fetch(`/api/admin/media?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setAssets(json.data.items);
        setTotal(json.data.total);
        setPages(json.data.pages);
        setCategoryCounts(json.data.categories ?? {});
      } else {
        toast.error(json.error ?? "Failed to load media library");
      }
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, debouncedSearch, unusedOnly, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to page 1 whenever a filter changes.
  useEffect(() => {
    setPage(1);
  }, [categoryFilter, debouncedSearch, unusedOnly]);

  async function handleAddByUrl() {
    if (!url) return;
    setAdding(true);
    try {
      const filename = url.split("/").pop() || "image";
      const res = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "local",
          url,
          alt,
          category: categoryForUsage(addMeta.usage),
          filename,
          width: 1600,
          height: 900,
          ...addMeta,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error);
        return;
      }
      toast.success("Image added to library");
      setUrl("");
      setAlt("");
      setAddMeta(defaultSmartUploadMeta());
      load();
    } finally {
      setAdding(false);
    }
  }

  async function uploadFile(file: File): Promise<void> {
    setUploading(true);
    try {
      const signRes = await fetch("/api/admin/media/sign", { method: "POST" });
      const signJson = await signRes.json().catch(() => null);
      if (!signRes.ok || !signJson?.success) {
        // Include the HTTP status in the toast itself — on mobile there's
        // no DevTools console to check, so the toast has to carry enough
        // detail on its own (401/403 = session/permission problem, 503 =
        // ImageKit env vars missing, anything else = an actual server bug).
        console.error("[media] sign request failed:", signRes.status, signJson);
        toast.error(
          `Couldn't start upload (${signRes.status}): ${signJson?.error ?? "Direct upload isn't configured yet. Use 'Add by URL' instead."}`
        );
        return;
      }
      const { token, expire, signature, publicKey } = signJson.data;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);
      formData.append("publicKey", publicKey);
      formData.append("token", token);
      formData.append("expire", String(expire));
      formData.append("signature", signature);
      formData.append("useUniqueFileName", "true");

      const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        body: formData,
      });
      const uploadJson = await uploadRes.json().catch(() => null);
      if (!uploadRes.ok) {
        console.error("[media] ImageKit upload failed:", uploadRes.status, uploadJson);
        toast.error(`Upload to ImageKit failed (${uploadRes.status}): ${uploadJson?.message ?? "Unknown error"}`);
        return;
      }

      const registerRes = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "imagekit",
          publicId: uploadJson.fileId,
          url: uploadJson.url,
          thumbnailUrl: uploadJson.thumbnailUrl,
          alt: file.name,
          category: categoryForUsage(uploadMeta.usage),
          filename: file.name,
          mimeType: file.type,
          width: uploadJson.width,
          height: uploadJson.height,
          bytes: uploadJson.size,
          ...uploadMeta,
        }),
      });
      const registerJson = await registerRes.json().catch(() => null);
      if (!registerJson?.success) {
        console.error("[media] register-in-library failed:", registerRes.status, registerJson);
        toast.error(`Uploaded to ImageKit but saving it failed (${registerRes.status}): ${registerJson?.error ?? "Unknown error"}`);
        return;
      }
      toast.success(`${file.name} uploaded`);
      if (registerJson.data?.note) toast.message(registerJson.data.note);
    } catch (err) {
      console.error("[media] upload threw:", err);
      toast.error(`Upload failed: ${err instanceof Error ? err.message : "check your connection and try again."}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!isWizardReady(uploadMeta)) {
      toast.error("Finish the Trip / Image Type selection above before uploading.");
      return;
    }
    const list = Array.from(files);
    for (const file of list) {
      await uploadFile(file);
    }
    load();
    setUploadMeta(defaultSmartUploadMeta());
  }

  async function openDetail(asset: MediaAsset) {
    setSelected(asset);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/media/${asset._id}`);
      const json = await res.json();
      if (json.success) setSelected(json.data);
    } finally {
      setDetailLoading(false);
    }
  }

  async function patchSelected(patch: Record<string, unknown>, fieldKey: string) {
    if (!selected) return;
    setSavingField(fieldKey);
    try {
      const res = await fetch(`/api/admin/media/${selected._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Update failed");
        return;
      }
      setSelected(json.data);
      setAssets((prev) => prev.map((a) => (a._id === json.data._id ? { ...a, ...json.data } : a)));
    } finally {
      setSavingField(null);
    }
  }

  async function handleReplace(file: File) {
    if (!selected) return;
    setReplacing(true);
    try {
      const signRes = await fetch("/api/admin/media/sign", { method: "POST" });
      const signJson = await signRes.json();
      if (!signJson.success) {
        toast.error(signJson.error ?? "Direct upload isn't configured yet.");
        return;
      }
      const { token, expire, signature, publicKey } = signJson.data;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);
      formData.append("publicKey", publicKey);
      formData.append("token", token);
      formData.append("expire", String(expire));
      formData.append("signature", signature);
      formData.append("useUniqueFileName", "true");

      const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        body: formData,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) {
        toast.error(uploadJson.message ?? "Upload to ImageKit failed.");
        return;
      }

      const replaceRes = await fetch(`/api/admin/media/${selected._id}/replace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "imagekit",
          publicId: uploadJson.fileId,
          url: uploadJson.url,
          thumbnailUrl: uploadJson.thumbnailUrl,
          filename: file.name,
          mimeType: file.type,
          width: uploadJson.width,
          height: uploadJson.height,
          bytes: uploadJson.size,
        }),
      });
      const replaceJson = await replaceRes.json();
      if (!replaceJson.success) {
        toast.error(replaceJson.error);
        return;
      }
      toast.success("Image replaced");
      if (replaceJson.data.note) toast.message(replaceJson.data.note);
      setSelected(replaceJson.data);
      load();
    } finally {
      setReplacing(false);
    }
  }

  async function handleDelete(id: string, force = false) {
    const res = await fetch(`/api/admin/media/${id}${force ? "?force=true" : ""}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      toast.success("Removed from library");
      setAssets((prev) => prev.filter((a) => a._id !== id));
      setSelected(null);
      load();
    } else if (res.status === 409) {
      toast.error(json.error);
    } else {
      toast.error(json.error ?? "Delete failed");
    }
  }

  function copyUrl(assetUrl: string) {
    navigator.clipboard.writeText(assetUrl);
    toast.success("URL copied");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Media Library</h1>
          <p className="text-sm text-muted-foreground">
            The single source of truth for every image on the site — {total} asset{total === 1 ? "" : "s"}.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFilesSelected(e.dataTransfer.files);
            }}
            className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <UploadCloud className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Drag & drop images here, or</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFilesSelected(e.target.files);
                e.target.value = "";
              }}
            />
            <div className="w-full max-w-3xl">
              <SmartMediaUpload value={uploadMeta} onChange={setUploadMeta} trips={trips} destinations={destinations} />
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={uploading || !isWizardReady(uploadMeta)}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
              {uploading ? "Uploading…" : "Choose Image(s)"}
            </Button>
            {imagekitReady === false ? (
              <p className="text-xs text-warning">
                ImageKit isn&rsquo;t configured yet (IMAGEKIT_PUBLIC_KEY / IMAGEKIT_PRIVATE_KEY / IMAGEKIT_URL_ENDPOINT
                missing in .env.local) — direct upload will fail. Use &ldquo;Add Image by URL&rdquo; below instead.
              </p>
            ) : imagekitReady === true ? (
              <p className="text-xs text-muted-foreground">ImageKit is configured — direct upload is ready.</p>
            ) : null}
          </div>

          <details className="rounded-lg border border-border p-4">
            <summary className="cursor-pointer text-sm font-medium">Add Image by URL</summary>
            <div className="mt-4 space-y-4">
              <SmartMediaUpload value={addMeta} onChange={setAddMeta} trips={trips} destinations={destinations} />
              <div className="grid gap-4 md:grid-cols-4">
                <FormField label="Image URL" className="md:col-span-2">
                  <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
                </FormField>
                <FormField label="Alt Text" className="md:col-span-2">
                  <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe the image" />
                </FormField>
                <div className="md:col-span-4">
                  <Button type="button" onClick={handleAddByUrl} disabled={adding || !url || !isWizardReady(addMeta)}>
                    {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                    Add to Library
                  </Button>
                </div>
              </div>
            </div>
          </details>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, filename, alt text, or tag…"
              className="pl-8"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories ({total})</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label} ({categoryCounts[c.value] ?? 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant={unusedOnly ? "primary" : "outline"}
            size="sm"
            onClick={() => setUnusedOnly((v) => !v)}
          >
            Unused only
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No images match these filters yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {assets.map((asset) => (
            <button
              key={asset._id}
              type="button"
              onClick={() => openDetail(asset)}
              className="group relative overflow-hidden rounded-lg border border-border bg-muted text-left"
            >
              <div className="aspect-square w-full overflow-hidden">
                <Image
                  src={asset.url}
                  alt={asset.alt}
                  width={240}
                  height={240}
                  className="size-full object-cover transition-transform group-hover:scale-105"
                  unoptimized
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                <p className="truncate text-xs font-medium text-white">{asset.title}</p>
                <p className="truncate text-[10px] text-white/70">{categoryLabel(asset.category)}</p>
              </div>
              {asset.usageReferences.length === 0 ? (
                <Badge variant="warning" className="absolute right-1.5 top-1.5">
                  Unused
                </Badge>
              ) : (
                <Badge variant="secondary" className="absolute right-1.5 top-1.5">
                  {asset.usageReferences.length} use{asset.usageReferences.length === 1 ? "" : "s"}
                </Badge>
              )}
            </button>
          ))}
        </div>
      )}

      {pages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pages}
          </span>
          <Button type="button" variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      ) : null}

      {/* Detail side panel */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle className="sr-only">{selected.title}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-lg border border-border bg-muted">
                    {selected.url ? (
                      <Image
                        src={selected.url}
                        alt={selected.alt}
                        width={600}
                        height={450}
                        className="w-full object-contain"
                        unoptimized
                      />
                    ) : (
                      <div className="flex aspect-video items-center justify-center">
                        <ImageIcon className="size-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => copyUrl(selected.url)}>
                      <Copy className="size-4" />
                      Copy URL
                    </Button>
                    <Button type="button" variant="outline" size="sm" asChild>
                      <a href={selected.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="size-4" />
                        Open
                      </a>
                    </Button>
                    <input
                      ref={replaceInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file) handleReplace(file);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={replacing}
                      onClick={() => replaceInputRef.current?.click()}
                    >
                      {replacing ? <Loader2 className="size-4 animate-spin" /> : <Replace className="size-4" />}
                      Replace Image
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <Button type="button" variant="outline" size="sm" className="text-destructive">
                          <Trash2 className="size-4" />
                          Delete
                        </Button>
                      }
                      title="Delete this image?"
                      description={
                        selected.usageReferences.length > 0
                          ? `This image is used in ${selected.usageReferences.length} place${selected.usageReferences.length === 1 ? "" : "s"}. Deleting removes it from the library but not from pages that still reference it.`
                          : "This will remove it from the Media Library. This can't be undone."
                      }
                      onConfirm={() => handleDelete(selected._id, selected.usageReferences.length > 0)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <FormField label="Title">
                    <Input
                      defaultValue={selected.title}
                      key={`title-${selected._id}`}
                      onBlur={(e) => {
                        if (e.target.value.trim() && e.target.value !== selected.title) {
                          patchSelected({ title: e.target.value.trim() }, "title");
                        }
                      }}
                    />
                  </FormField>
                  <FormField label="Alt Text" hint="Used for accessibility and SEO.">
                    <Input
                      defaultValue={selected.alt}
                      key={`alt-${selected._id}`}
                      onBlur={(e) => {
                        if (e.target.value !== selected.alt) {
                          patchSelected({ alt: e.target.value }, "alt");
                        }
                      }}
                    />
                  </FormField>
                  <FormField label="Category">
                    <Select
                      value={selected.category}
                      onValueChange={(v) => patchSelected({ category: v }, "category")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Tags" hint="Comma-separated.">
                    <Input
                      defaultValue={selected.tags.join(", ")}
                      key={`tags-${selected._id}`}
                      onBlur={(e) => {
                        const tags = e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean);
                        patchSelected({ tags }, "tags");
                      }}
                    />
                  </FormField>

                  <div className="grid grid-cols-2 gap-3 rounded-lg border border-border p-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Dimensions</p>
                      <p>{selected.width && selected.height ? `${selected.width} × ${selected.height}px` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">File Size</p>
                      <p>{formatBytes(selected.bytes)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Uploaded</p>
                      <p>{formatDate(selected.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Uploaded By</p>
                      <p className="truncate">{selected.uploadedBy ?? "—"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">File Name</p>
                      <p className="truncate">{selected.filename}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Used In</p>
                    {detailLoading ? (
                      <Skeleton className="h-16 w-full" />
                    ) : selected.usageReferences.length === 0 ? (
                      <Badge variant="warning">Unused Asset</Badge>
                    ) : (
                      <ul className="space-y-1.5">
                        {selected.usageReferences.map((ref, i) => (
                          <li key={i} className="flex items-center justify-between rounded-md border border-border px-3 py-1.5 text-sm">
                            <span>
                              {ref.model}: {ref.label}{" "}
                              <span className="text-xs text-muted-foreground">({ref.field})</span>
                            </span>
                            {ref.href ? (
                              <a href={ref.href} className="text-xs text-primary hover:underline">
                                View
                              </a>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {savingField ? <p className="text-xs text-muted-foreground">Saving…</p> : null}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
