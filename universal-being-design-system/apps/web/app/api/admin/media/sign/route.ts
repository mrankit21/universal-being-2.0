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
    const { token, expire, signature } = imagekit.helper.getAuthenticationParameters();

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
