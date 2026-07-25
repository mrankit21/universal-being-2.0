/**
 * Renders an HTML string to a PDF buffer using headless Chrome, at a fixed
 * pixel size — this is what makes the ticket "pixel-perfect every time"
 * regardless of who's viewing it: unlike an in-app responsive view, this
 * render path always uses the exact same viewport (see TICKET_WIDTH /
 * TICKET_HEIGHT below, matching lib/pdf/ticket-html.ts's <body> size).
 *
 * Two runtimes:
 *  - Production (Vercel/serverless): `puppeteer-core` + `@sparticuz/chromium`,
 *    the standard combo for running headless Chrome inside a serverless
 *    function without shipping a full Chromium binary in the deployment.
 *  - Local dev: falls back to the full `puppeteer` package (bundles its
 *    own Chromium), so `npm run dev` works without extra setup.
 *
 * Run once after pulling this change:
 *   npm install puppeteer-core @sparticuz/chromium
 *   npm install -D puppeteer   (dev-only fallback)
 */

export const TICKET_WIDTH = 1120;
export const TICKET_HEIGHT = 640;

async function getBrowser() {
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = await import("puppeteer-core");
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
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
