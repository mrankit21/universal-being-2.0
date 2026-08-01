/**
 * Step 7.6E Part 9 "SEO Improvements" needs absolute URLs for canonical
 * links, Open Graph, and JSON-LD — none of which existed as a single
 * source before. Reads `NEXT_PUBLIC_SITE_URL` (added to `.env.example`)
 * with a safe production fallback so nothing breaks in environments where
 * it isn't set yet.
 */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return "https://universalbeing.in";
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
