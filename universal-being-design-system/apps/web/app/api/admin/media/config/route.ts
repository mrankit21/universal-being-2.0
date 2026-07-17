/**
 * GET /api/admin/media/config — tiny read-only probe the Media Library page
 * calls on mount to find out whether direct-to-ImageKit uploads are actually
 * usable right now.
 *
 * Before this route existed, the "Requires IMAGEKIT_PUBLIC_KEY /
 * IMAGEKIT_PRIVATE_KEY / IMAGEKIT_URL_ENDPOINT in .env.local" text under the
 * upload dropzone was static copy — it displayed unconditionally regardless
 * of whether those env vars were actually set, so it couldn't be trusted as
 * a live signal (and stayed visible even after ImageKit was configured and
 * working). This route calls the same `imagekitConfigured()` check the sign
 * endpoint already uses, so the client can show an accurate, live status.
 */
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";
import { imagekitConfigured } from "@/lib/media/imagekit";

export async function GET() {
  try {
    await requirePermission("media:read");
    return NextResponse.json({ success: true, data: { imagekitConfigured: imagekitConfigured() } });
  } catch (err) {
    return handleApiError(err);
  }
}
