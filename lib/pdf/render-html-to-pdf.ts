/**
 * Renders an HTML string to a PDF buffer using headless Chrome, at a fixed
 * pixel size — this is what makes the ticket "pixel-perfect every time"
 * regardless of who's viewing it: unlike an in-app responsive view, this
 * render path always uses the exact same viewport (see TICKET_WIDTH /
 * TICKET_HEIGHT below, matching lib/pdf/ticket-html.ts's <body> size).
 *
 * Two runtimes:
 *  - Production (Vercel/serverless): `puppeteer-core` + `@sparticuz/chromium-min`.
 *    We previously used the *full* `@sparticuz/chromium` package, which bundles
 *    the Chromium binary + its .so files (libnss3.so etc.) inside node_modules
 *    and extracts them to /tmp at runtime. That kept failing with
 *    "libnss3.so: cannot open shared object file" even after LD_LIBRARY_PATH +
 *    outputFileTracingIncludes fixes — Next.js's build-time file tracer
 *    (@vercel/nft) and the package's runtime-extraction logic disagree about
 *    which files survive into the deployed function, and the shared libs get
 *    dropped regardless of how the tracer is told to include them.
 *    `chromium-min` sidesteps this entirely: it ships NO binary in the npm
 *    package, so there's nothing for the tracer to lose. Instead, at cold
 *    start, `chromium.executablePath(packUrl)` downloads a prebuilt tar pack
 *    (binary + all shared libs together) from a URL and extracts it straight
 *    into /tmp — completely outside Next.js's bundling/tracing pipeline.
 *      1. `CHROMIUM_PACK_URL` env var — the tar pack to download. Defaults to
 *         Sparticuz's own GitHub release matching the installed
 *         @sparticuz/chromium-min version (see package.json). Self-hosting
 *         this on S3/R2 is faster + more reliable for prod; see note below.
 *      2. `chromium.setGraphicsMode = false` — serverless has no GPU; leaving
 *         graphics mode on causes launch failures/freezes on some regions.
 *      3. `serverExternalPackages` in next.config.ts so Next.js doesn't try
 *         to webpack-bundle these two native-facing packages at all.
 *  - Local dev: falls back to the full `puppeteer` package (bundles its own
 *    Chromium + all system libraries already present on a dev machine).
 */

export const TICKET_WIDTH = 1120;
export const TICKET_HEIGHT = 640;

// Must match the installed @sparticuz/chromium-min version (package.json).
// Sparticuz publishes a matching tar pack on GitHub Releases for every
// version they ship — this is the "default" pack their own docs point to.
// For production traffic, download this once and re-host it on your own
// S3/R2 bucket (CHROMIUM_PACK_URL env var) — GitHub Releases isn't meant to
// serve high-frequency cold-start downloads and can rate-limit under load.
const DEFAULT_CHROMIUM_PACK_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar";

async function getBrowser() {
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium-min")).default;
    const puppeteer = await import("puppeteer-core");

    // No GPU in serverless — avoids the "freezes after Creating new page"
    // failure mode some regions hit with graphics mode left on.
    chromium.setGraphicsMode = false;

    const packUrl = process.env.CHROMIUM_PACK_URL || DEFAULT_CHROMIUM_PACK_URL;

    // chromium-min downloads + extracts the tar pack (binary + .so files
    // together) to /tmp on first call and caches it for the lifetime of the
    // function container — no LD_LIBRARY_PATH juggling needed, the pack's
    // own layout keeps the shared libs next to the binary.
    const executablePath = await chromium.executablePath(packUrl);

    return puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: chromium.headless,
    });
  }

  // Local dev — use full puppeteer (bundled Chromium), dynamically
  // imported so it's never required in the production bundle.
  const puppeteer = await import("puppeteer");
  return puppeteer.launch({ headless: true });
}

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: TICKET_WIDTH, height: TICKET_HEIGHT });
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      width: TICKET_WIDTH,
      height: TICKET_HEIGHT,
      printBackground: true,
      pageRanges: "1",
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
