/**
 * Best-effort client IP extraction for rate limiting.
 *
 * `NextRequest` doesn't expose `.ip` in the App Router — on Vercel the
 * real client IP arrives via the `x-forwarded-for` header (set by
 * Vercel's edge network; the first entry is the original client, later
 * entries are proxies it passed through). `x-real-ip` is a fallback for
 * other hosts/proxies. If neither is present (e.g. plain `next dev` with
 * no proxy in front), we fall back to a constant — which means local dev
 * effectively rate-limits "all local traffic" as one bucket, which is
 * fine for testing the limiter but isn't meant to be relied on in prod.
 */
import { NextRequest } from "next/server";

export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}
