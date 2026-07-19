/**
 * uploadImageFile — shared client-side upload helper, extracted from the
 * Media Library page's inline `uploadFile()` so the same "sign → post to
 * ImageKit → register in /api/admin/media" flow can be reused by the Trip
 * Editor's own per-trip upload fields (ImageAssetField's Media Library
 * usage keeps its own inline copy untouched).
 */
export interface ClientUploadMeta {
  category?: string;
  alt?: string;
  tags?: string[];
  /** "library" (default) = shows up in the main Media Library grid.
   * "trip" = only ever shown back inside the owning Trip's own editor. */
  scope?: "library" | "trip";
  relatedTripSlug?: string;
  relatedTripTitle?: string;
  usage?: string;
}

export interface UploadedMediaAsset {
  _id: string;
  url: string;
  thumbnailUrl?: string;
  alt: string;
  title: string;
  category: string;
  width: number;
  height: number;
  scope?: string;
}

export async function uploadImageFile(file: File, meta: ClientUploadMeta = {}): Promise<UploadedMediaAsset> {
  const signRes = await fetch("/api/admin/media/sign", { method: "POST" });
  const signJson = await signRes.json().catch(() => null);
  if (!signRes.ok || !signJson?.success) {
    throw new Error(
      signJson?.error ?? `Couldn't start upload (${signRes.status}). Direct upload isn't configured yet.`
    );
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
    throw new Error(`Upload to ImageKit failed (${uploadRes.status}): ${uploadJson?.message ?? "Unknown error"}`);
  }

  const registerRes = await fetch("/api/admin/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: "imagekit",
      publicId: uploadJson.fileId,
      url: uploadJson.url,
      thumbnailUrl: uploadJson.thumbnailUrl,
      alt: meta.alt ?? file.name,
      category: meta.category ?? "general",
      filename: file.name,
      mimeType: file.type,
      width: uploadJson.width,
      height: uploadJson.height,
      bytes: uploadJson.size,
      tags: meta.tags ?? [],
      scope: meta.scope ?? "library",
      relatedTripSlug: meta.relatedTripSlug,
      relatedTripTitle: meta.relatedTripTitle,
      usage: meta.usage,
    }),
  });
  const registerJson = await registerRes.json().catch(() => null);
  if (!registerJson?.success) {
    throw new Error(
      registerJson?.error ?? `Uploaded to ImageKit but saving it failed (${registerRes.status}).`
    );
  }
  return registerJson.data;
}
