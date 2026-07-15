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
}

const emptyBrand: SiteBrand = {
  brandName: staticSiteConfig.brandName,
  tagline: staticSiteConfig.tagline,
  logo: null,
  logoDark: null,
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
export async function getSiteBrand(): Promise<SiteBrand> {
  if (!isDatabaseConfigured()) return emptyBrand;

  await connectToDatabase();
  const doc = (await SiteSettingsModel.findOne().lean()) as (SiteSettingsDocument & { _id: unknown }) | null;

  if (!doc) return emptyBrand;

  return {
    brandName: doc.brandName || staticSiteConfig.brandName,
    tagline: doc.tagline || staticSiteConfig.tagline,
    logo: isRealAsset(doc.logo) ? (doc.logo as ImageAsset) : null,
    logoDark: isRealAsset(doc.logoDark) ? (doc.logoDark as ImageAsset) : null,
  };
}
