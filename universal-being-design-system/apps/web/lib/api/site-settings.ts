import { isDatabaseConfigured, connectToDatabase } from "@/lib/db/mongoose";
import { SiteSettingsModel, type SiteSettingsDocument } from "@/lib/db/models";
import { siteConfig as staticSiteConfig } from "@/data/layout/site-config";
import { contactContent } from "@/data/shared/real-content";

/**
 * lib/api/site-settings.ts — same DB-first / static-fallback swap point as
 * `lib/api/home.ts`, `lib/api/announcements.ts`, and `lib/api/site-brand.ts`
 * (which this file complements — `site-brand.ts` covers only
 * brandName/tagline/logo for the header; this covers everything else the
 * Admin Panel's Site Settings form edits: contact details, social links,
 * footer columns, and SEO defaults).
 *
 * Rule enforced here: MongoDB is read first; `data/layout/site-config.ts` +
 * `data/shared/real-content.ts` are used only when the database isn't
 * configured, or no Site Settings document exists yet.
 */

export interface ResolvedSiteSettings {
  brandStory: string;
  contact: { whatsappHref: string; phoneHref: string; email: string; address: string };
  socialLinks: { platform: string; href: string; label: string }[];
  footerColumns: { title: string; links: { label: string; href: string }[] }[];
  copyrightHolder: string;
  footerBackground: {
    image?: { url: string; alt: string; isPlaceholder: boolean };
    /** Optional dedicated crop for narrow viewports — falls back to
     * `image` when not set. See `ResolvedCtaSection.backgroundImageMobile`
     * in `lib/api/home.ts` for the same fallback rule. */
    imageMobile?: { url: string; alt: string; isPlaceholder: boolean };
    overlayOpacity: number;
  };
  seoDefaults: { title: string; description: string; ogImageUrl?: string };
  /** True when this response came from MongoDB rather than the static
   * fallback — surfaced for admin/debug use only. */
  source: "database" | "static";
}

function staticSiteSettings(): ResolvedSiteSettings {
  return {
    brandStory: staticSiteConfig.brandStory,
    contact: { ...staticSiteConfig.contact, address: contactContent.officeAddress },
    socialLinks: staticSiteConfig.socialLinks,
    footerColumns: staticSiteConfig.footerColumns,
    copyrightHolder: staticSiteConfig.copyrightHolder,
    footerBackground: { overlayOpacity: 0.7 },
    seoDefaults: { title: staticSiteConfig.brandName, description: staticSiteConfig.tagline },
    source: "static",
  };
}

/** phone/whatsapp are stored as plain numbers in SiteSettingsModel (the
 * Admin form's contact fields); the site's contact buttons need the
 * tel:/wa.me href form, same conversion `data/layout/site-config.ts` used
 * to do by hand for the static numbers. */
function toWhatsappHref(whatsapp: string): string {
  const digits = whatsapp.replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : staticSiteConfig.contact.whatsappHref;
}

function toPhoneHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : staticSiteConfig.contact.phoneHref;
}

export async function getSiteSettings(): Promise<ResolvedSiteSettings> {
  if (!isDatabaseConfigured()) return staticSiteSettings();

  try {
    await connectToDatabase();
    const doc = (await SiteSettingsModel.findOne().lean()) as (SiteSettingsDocument & { _id: unknown }) | null;

    if (!doc) return staticSiteSettings();

    const footerImg = doc.footer?.backgroundImage as { url?: string; alt?: string; isPlaceholder?: boolean } | undefined;
    const footerImgMobile = doc.footer?.backgroundImageMobile as
      | { url?: string; alt?: string; isPlaceholder?: boolean }
      | undefined;

    return {
      brandStory: doc.brandStory || staticSiteConfig.brandStory,
      contact: {
        whatsappHref: doc.contact?.whatsapp ? toWhatsappHref(doc.contact.whatsapp) : staticSiteConfig.contact.whatsappHref,
        phoneHref: doc.contact?.phone ? toPhoneHref(doc.contact.phone) : staticSiteConfig.contact.phoneHref,
        email: doc.contact?.email || staticSiteConfig.contact.email,
        address: doc.contact?.address || contactContent.officeAddress,
      },
      socialLinks: doc.socialLinks?.length ? doc.socialLinks : staticSiteConfig.socialLinks,
      footerColumns: doc.footer?.columns?.length ? doc.footer.columns : staticSiteConfig.footerColumns,
      copyrightHolder: doc.footer?.copyrightHolder || staticSiteConfig.copyrightHolder,
      footerBackground: {
        image: footerImg?.url && !footerImg.isPlaceholder ? { url: footerImg.url, alt: footerImg.alt ?? "", isPlaceholder: false } : undefined,
        imageMobile:
          footerImgMobile?.url && !footerImgMobile.isPlaceholder
            ? { url: footerImgMobile.url, alt: footerImgMobile.alt ?? "", isPlaceholder: false }
            : undefined,
        overlayOpacity: doc.footer?.overlayOpacity ?? 0.7,
      },
      seoDefaults: {
        title: doc.seoDefaults?.title || staticSiteConfig.brandName,
        description: doc.seoDefaults?.description || staticSiteConfig.tagline,
        ogImageUrl: doc.seoDefaults?.ogImageUrl,
      },
      source: "database",
    };
  } catch (err) {
    // A configured-but-unreachable MONGODB_URI must never take down every
    // page on the site — this runs inside the root layout / footer.
    console.error("[getSiteSettings] MongoDB unreachable, falling back to static site settings:", err);
    return staticSiteSettings();
  }
}