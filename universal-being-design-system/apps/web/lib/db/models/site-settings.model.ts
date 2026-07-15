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
  contact: {
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
  };
  socialLinks: { platform: string; href: string; label: string }[];
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
    },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

export const SiteSettingsModel: Model<SiteSettingsDocument> =
  models.SiteSettings || model<SiteSettingsDocument>("SiteSettings", SiteSettingsSchema);
