import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /**
   * puppeteer-core and @sparticuz/chromium (lib/pdf/render-html-to-pdf.ts)
   * ship native binaries and platform-specific files. If Next.js tries to
   * bundle them into the serverless function via webpack, the Chromium
   * binary and its shared libraries (libnss3.so etc.) get mishandled and
   * fail to load at runtime. Marking them external makes Next.js require()
   * them normally from node_modules instead.
   */
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
  /**
   * THE ACTUAL FIX for "libnss3.so: cannot open shared object file" on
   * Vercel: Next.js decides which node_modules files to ship with each
   * serverless function by statically tracing `require`/`import` calls
   * (via @vercel/nft). @sparticuz/chromium doesn't `require()` its .so
   * files — it extracts them from its `bin/` folder at runtime — so the
   * tracer never sees they're needed and leaves them out of the deployed
   * function entirely. The Chromium binary then runs in `/tmp` with no
   * shared libraries next to it, no matter what LD_LIBRARY_PATH is set to.
   * This explicitly forces the whole bin/ folder into every function's
   * bundle so the files actually exist at runtime.
   */
  outputFileTracingIncludes: {
    "/**": ["./node_modules/@sparticuz/chromium/bin/**"],
  },
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