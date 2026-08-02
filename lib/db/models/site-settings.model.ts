/**
 * SiteSettings Mongoose model — single-document collection backing
 * requirement #8 and mirroring `types/layout.ts`'s `SiteConfig`, extended
 * with contact/SEO/footer fields the admin needs to fully own (requirement
 * #14: "Nothing should remain hardcoded").
 */
import { Schema, model, models, type Model, type Document } from "mongoose";
import { ImageAssetSchema } from "./shared.schemas";

export interface SiteSettingsDocument extends Document {
  brandName: string;
  tagline: string;
  brandStory: string;
  /** Homepage Version toggle (Homepage 2.0): which homepage layout is
   * live at `/`. "v1" = original sections (Hero + Package Includes Strip +
   * Featured Trips grid). "v2" = Homepage 2.0 (Hero Parallax + Floating
   * Quick Links + Featured Trips Stack), fully admin-controlled via the
   * "Homepage 2.0" panel. Switching this never deletes either version's
   * content — it only changes which one `app/page.tsx` renders. */
  activeHomepageVersion: "v1" | "v2";
  /** Trips Version toggle (Trip 2.0), same idea as `activeHomepageVersion`
   * but for `/trips/[slug]`. "v1" (default) leaves each Trip's own
   * "Page Version" field (Trip Editor) in control — unchanged from
   * before this toggle existed. "v2" forces every trip over to its
   * Trip 2.0 design wherever a matching published Trip 2.0 page exists,
   * regardless of that trip's individual "Page Version" field — a single
   * site-wide switch, same spirit as Homepage Version. */
  activeTripsVersion: "v1" | "v2";
  contact: {
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
  };
  socialLinks: { platform: string; href: string; label: string; icon?: unknown }[];
  seoDefaults: { title: string; description: string; ogImageUrl?: string };
  /** Brand assets — Step 7.6B §7, all chosen from the Media Library. */
  logo?: unknown;
  logoDark?: unknown;
  favicon?: unknown;
  ogImage?: unknown;
  appleTouchIcon?: unknown;
  googleMapsEmbedUrl?: string;
  footer: {
    columns: { title: string; links: { label: string; href: string }[] }[];
    copyrightHolder: string;
    /** Optional background image behind the footer + adjustable darkening
     * overlay opacity, same pattern as the homepage CTA section. */
    backgroundImage?: unknown;
    /** Optional dedicated crop for narrow viewports — see
     * `lib/api/home.ts` `ResolvedCtaSection.backgroundImageMobile` for the
     * fallback rule. */
    backgroundImageMobile?: unknown;
    overlayOpacity: number;
  };
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

const SiteSettingsSchema = new Schema<SiteSettingsDocument>(
  {
    brandName: { type: String, required: true, default: "Universal Being" },
    tagline: { type: String, default: "" },
    brandStory: { type: String, default: "" },
    activeHomepageVersion: { type: String, enum: ["v1", "v2"], default: "v1" },
    activeTripsVersion: { type: String, enum: ["v1", "v2"], default: "v1" },
    contact: {
      phone: { type: String, default: "" },
      whatsapp: { type: String, default: "" },
      email: { type: String, default: "" },
      address: { type: String, default: "" },
    },
    socialLinks: {
      type: [
        {
          platform: { type: String },
          href: { type: String },
          label: { type: String },
          icon: { type: ImageAssetSchema },
        },
      ],
      default: [],
    },
    seoDefaults: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      ogImageUrl: { type: String },
    },
    logo: { type: ImageAssetSchema },
    logoDark: { type: ImageAssetSchema },
    favicon: { type: ImageAssetSchema },
    ogImage: { type: ImageAssetSchema },
    appleTouchIcon: { type: ImageAssetSchema },
    googleMapsEmbedUrl: { type: String },
    footer: {
      columns: {
        type: [
          {
            title: { type: String },
            links: { type: [{ label: String, href: String }], default: [] },
          },
        ],
        default: [],
      },
      copyrightHolder: { type: String, default: "" },
      backgroundImage: { type: ImageAssetSchema },
      backgroundImageMobile: { type: ImageAssetSchema },
      overlayOpacity: { type: Number, default: 0.7, min: 0, max: 1 },
    },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

export const SiteSettingsModel: Model<SiteSettingsDocument> =
  models.SiteSettings || model<SiteSettingsDocument>("SiteSettings", SiteSettingsSchema);
