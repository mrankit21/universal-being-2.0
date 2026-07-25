/**
 * Renders an HTML string to a PDF buffer using headless Chrome, at a fixed
 * pixel size — this is what makes the ticket "pixel-perfect every time"
 * regardless of who's viewing it: unlike an in-app responsive view, this
 * render path always uses the exact same viewport (see TICKET_WIDTH /
 * TICKET_HEIGHT below, matching lib/pdf/ticket-html.ts's <body> size).
 *
 * Two runtimes:
 *  - Production (Vercel/serverless): `puppeteer-core` + `@sparticuz/chromium`.
 *    Vercel's function containers ship a *minimal* Linux with none of the
 *    shared libraries (libnss3.so etc.) Chromium needs — @sparticuz/chromium
 *    bundles those libraries alongside the Chromium binary, but three things
 *    are required together for it to actually find them at runtime:
 *      1. `LD_LIBRARY_PATH` pointed at the extracted binary's own directory
 *         (this is the part most guides skip, and exactly what threw
 *         "libnss3.so: cannot open shared object file" here).
 *      2. `chromium.setGraphicsMode(false)` — serverless has no GPU; leaving
 *         graphics mode on causes launch failures/freezes on some regions.
 *      3. `serverExternalPackages` in next.config.ts (see that file) so
 *         Next.js doesn't try to bundle these two native packages.
 *  - Local dev: falls back to the full `puppeteer` package (bundles its own
 *    Chromium + all system libraries already present on a dev machine).
 */
import path from "path";

export const TICKET_WIDTH = 1120;
export const TICKET_HEIGHT = 640;

async function getBrowser() {
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = await import("puppeteer-core");

    // No GPU in serverless — avoids the "freezes after Creating new page"
    // failure mode some regions hit with graphics mode left on.
    if (typeof chromium.setGraphicsMode === "function") {
      chromium.setGraphicsMode(false);
    }

    const executablePath = await chromium.executablePath();

    // THE FIX: point the dynamic linker at the directory @sparticuz/chromium
    // extracted the Chromium binary + its .so files into. Without this,
    // Chromium is on disk but can't find libnss3.so/libnspr4.so next to it.
    process.env.LD_LIBRARY_PATH = process.env.LD_LIBRARY_PATH
      ? `${path.dirname(executablePath)}:${process.env.LD_LIBRARY_PATH}`
      : path.dirname(executablePath);

    return puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: true,
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
