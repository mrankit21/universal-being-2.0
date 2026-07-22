/**
 * POST /api/admin/media/sign — issues ImageKit signed-upload auth params
 * (token/expire/signature) so the browser can upload directly to ImageKit
 * without the binary ever touching the Node server. Returns a clear 503
 * until ImageKit credentials are configured, so the Media Library UI can
 * fall back to the URL-based "register an existing image" flow in the
 * meantime — this route's response shape doesn't change once credentials
 * land, only its status/data.
 */
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";
import { getImageKitClient, imagekitConfigured } from "@/lib/media/imagekit";

export async function POST() {
  try {
    await requirePermission("media:write");

    if (!imagekitConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ImageKit is not configured yet. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, " +
            "and IMAGEKIT_URL_ENDPOINT to enable direct uploads. Until then, use the " +
            "'Add by URL' option in the Media Library.",
        },
        { status: 503 }
      );
    }

    const imagekit = getImageKitClient()!;
    // Bug: calling getAuthenticationParameters() with no args was returning
    // the SAME token across separate requests (ImageKit rejects a reused
    // token with a 400 — "token ... has been used before"), which broke
    // the Trip Gallery's multi-file upload (each file in the loop signs
    // separately). `getImageKitClient()` caches one ImageKit instance for
    // the whole server process, and the SDK's default token generation
    // appears to be memoized on that instance rather than re-rolled per
    // call — so we now generate a guaranteed-fresh v4 UUID token (and a
    // fresh expiry) ourselves on every request instead of trusting the
    // SDK default.
    const token = randomUUID();
    const expire = Math.floor(Date.now() / 1000) + 30 * 60; // 30 minutes
    const { signature } = imagekit.helper.getAuthenticationParameters(token, expire);

    return NextResponse.json({
      success: true,
      data: {
        token,
        expire,
        signature,
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
