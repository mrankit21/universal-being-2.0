import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /**
   * puppeteer-core and @sparticuz/chromium-min (lib/pdf/render-html-to-pdf.ts)
   * are native/binary-adjacent packages. Marking them external stops Next.js
   * from webpack-bundling them — they're require()'d normally from
   * node_modules at runtime instead.
   *
   * Note: @sparticuz/chromium-min itself ships no Chromium binary, so unlike
   * the old @sparticuz/chromium setup, there's no outputFileTracingIncludes
   * hack needed here anymore — the binary is downloaded straight to /tmp at
   * cold start (see CHROMIUM_PACK_URL in render-html-to-pdf.ts), completely
   * outside Next's build-time file tracing. That tracing/bundling mismatch
   * was the actual root cause of the recurring
   * "libnss3.so: cannot open shared object file" error.
   */
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium-min"],
  /**
   * Dev is tested from a phone over LAN (e.g. http://192.168.x.x:3000),
   * which Next.js 15 flags as a cross-origin dev request unless the
   * origin is explicitly allowlisted. This only affects `next dev`; it's
   * a no-op in production builds.
   */
  allowedDevOrigins: ["192.168.201.237"],
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