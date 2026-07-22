/**
 * ImageKit server client — the single place that touches the ImageKit SDK
 * (mirrors the old rule for Cloudinary: one client, reused everywhere it's
 * needed, never re-instantiated ad hoc per route).
 *
 * Used by:
 *  - `/api/admin/media/sign`            → issues client-upload auth params
 *  - `/api/admin/media/[id]` (DELETE)    → removes the file from ImageKit
 *  - `/api/admin/media/[id]/replace`     → removes the OLD file from
 *                                          ImageKit after a successful swap
 *
 * Requires IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT.
 * Until those are set, `imagekitConfigured()` is false and the Media
 * Library UI falls back to the "Add by URL" flow — same graceful-degrade
 * behavior the old Cloudinary integration had.
 */
import ImageKit from "@imagekit/nodejs";

let cachedClient: ImageKit | null = null;

export function imagekitConfigured(): boolean {
  return Boolean(
    process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT
  );
}

/** Lazily-constructed ImageKit server client. Returns `null` when
 * credentials aren't configured yet so callers can fail gracefully instead
 * of throwing. */
export function getImageKitClient(): ImageKit | null {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) return null;
  if (!cachedClient) cachedClient = new ImageKit({ privateKey });
  return cachedClient;
}

/**
 * Best-effort delete of a file from ImageKit by its `fileId` (stored in the
 * Media document's `publicId` field, same slot the old Cloudinary
 * `public_id` used). Deliberately never throws: a provider-side delete
 * failure (file already gone, transient network issue, credentials not
 * configured) should never block the Media Library record itself from
 * being deleted or replaced — it's logged and swallowed instead.
 */
export async function deleteImageKitFileSafely(fileId?: string | null): Promise<void> {
  if (!fileId) return;
  const client = getImageKitClient();
  if (!client) return;
  try {
    await client.files.delete(fileId);
  } catch (err) {
    console.error(`[imagekit] failed to delete file "${fileId}":`, err);
  }
}
