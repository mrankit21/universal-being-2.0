/**
 * Asset helpers for the HTML-based ticket PDF (lib/pdf/ticket-html.ts +
 * lib/pdf/ticket-pdf.ts).
 *
 * Headless Chrome renders the ticket HTML in an isolated page with no
 * guarantee that remote image URLs (ImageKit/Cloudinary trip photos) will
 * resolve in time, or at all, inside a serverless function — so every
 * image the template uses (brand logo, trip hero photo, QR code) is
 * inlined as a base64 data: URI before the HTML is handed to the renderer.
 * This keeps PDF generation fully self-contained and deterministic.
 */
import { readFile } from "fs/promises";
import path from "path";

/** Reads a file from /public and returns it as a data: URI. Used for the
 * fixed Universal Being logo, which is a brand asset — never per-trip. */
export async function localImageToDataUri(publicPath: string, mime = "image/png"): Promise<string> {
  const abs = path.join(process.cwd(), "public", publicPath);
  const bytes = await readFile(abs);
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

/** Fetches a remote trip/destination photo (ImageKit, Cloudinary, or any
 * external URL admins pasted in) and returns it as a data: URI. Falls back
 * to `null` on any failure so the caller can substitute a graceful
 * placeholder instead of failing ticket generation over a broken image. */
export async function remoteImageToDataUri(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}
