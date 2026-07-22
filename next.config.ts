import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /**
   * Brand/media assets (logo, favicon, trip photos) are picked from the
   * Media Library or pasted via "Add by URL", so their host isn't known
   * ahead of time — it's whatever ImageKit endpoint or external URL an
   * admin used. Without a remotePatterns entry, next/image hard-errors on
   * any hostname it doesn't recognize and the image silently fails to
   * render on the live site (while still previewing fine inside the admin
   * form). Allowing any https host here is the fix; tighten to the real
   * ImageKit endpoint once IMAGEKIT_URL_ENDPOINT is set in production.
   */
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
