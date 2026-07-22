import { cache } from "react";

import { isDatabaseConfigured, connectToDatabase } from "@/lib/db/mongoose";
import { SiteSettingsModel, type SiteSettingsDocument } from "@/lib/db/models";
import { siteConfig as staticSiteConfig } from "@/data/layout/site-config";
import type { ImageAsset } from "@/types/trip";

/**
 * lib/api/site-brand.ts — same DB-first / static-fallback swap point as
 * `lib/api/announcements.ts`, applied to the header/footer Logo. Previously
 * `components/layout/logo.tsx` imported `data/layout/site-config.ts`
 * directly, so uploading a Logo in Admin → Settings → Brand Assets never
 * reached the live site (it only ever showed inside the admin form's own
 * preview). This file is now the ONLY place that decides "database or seed
 * data" for brand assets; `app/layout.tsx` calls it once and passes the
 * result down via `BrandProvider`.
 */

export interface SiteBrand {
  brandName: string;
  tagline: string;
  logo: ImageAsset | null;
  logoDark: ImageAsset | null;
  /** Browser tab icon — Step 8 fix: was in SiteSettingsModel/the admin form
   * but never reached `app/layout.tsx`'s `metadata.icons`. */
  favicon: ImageAsset | null;
  /** iOS "Add to Home Screen" icon — same gap as `favicon`. */
  appleTouchIcon: ImageAsset | null;
  /** WhatsApp/Facebook/Twitter link-preview image — same gap, feeds
   * `metadata.openGraph.images`. */
  ogImage: ImageAsset | null;
}

const emptyBrand: SiteBrand = {
  brandName: staticSiteConfig.brandName,
  tagline: staticSiteConfig.tagline,
  logo: null,
  logoDark: null,
  favicon: null,
  appleTouchIcon: null,
  ogImage: null,
};

function isRealAsset(asset: unknown): asset is ImageAsset {
  if (!asset || typeof asset !== "object") return false;
  const a = asset as Partial<ImageAsset>;
  return Boolean(a.url) && !a.isPlaceholder;
}

/**
 * Resolves the brand identity (name, tagline, logo) the Global Layout
 * should render. Falls back to the static seed config only when the
 * database isn't configured, or no Site Settings document exists yet —
 * an admin clearing the logo field should result in the text wordmark,
 * not the static logo reappearing.
 */
export const getSiteBrand = cache(async function getSiteBrand(): Promise<SiteBrand> {
  if (!isDatabaseConfigured()) return emptyBrand;

  try {
    await connectToDatabase();
    const doc = (await SiteSettingsModel.findOne().lean()) as (SiteSettingsDocument & { _id: unknown }) | null;

    if (!doc) return emptyBrand;

    return {
      brandName: doc.brandName || staticSiteConfig.brandName,
      tagline: doc.tagline || staticSiteConfig.tagline,
      logo: isRealAsset(doc.logo) ? (doc.logo as ImageAsset) : null,
      logoDark: isRealAsset(doc.logoDark) ? (doc.logoDark as ImageAsset) : null,
      favicon: isRealAsset(doc.favicon) ? (doc.favicon as ImageAsset) : null,
      appleTouchIcon: isRealAsset(doc.appleTouchIcon) ? (doc.appleTouchIcon as ImageAsset) : null,
      ogImage: isRealAsset(doc.ogImage) ? (doc.ogImage as ImageAsset) : null,
    };
  } catch (err) {
    // A configured-but-unreachable MONGODB_URI (bad credentials, placeholder
    // left unedited, cluster down, etc.) must never take down every page on
    // the site — this runs inside the root layout on every request.
    console.error("[getSiteBrand] MongoDB unreachable, falling back to static brand:", err);
    return emptyBrand;
  }
});
