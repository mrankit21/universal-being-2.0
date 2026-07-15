/**
 * Global Layout — config contracts (Phase 4).
 *
 * Mirrors the Theme Architecture's own rule (types/theme.ts): components
 * never hardcode nav items, footer copy, or announcement content — they
 * read a config object that satisfies one of these shapes. Adding a nav
 * item, footer link, or social channel means editing data/layout/*.ts only;
 * zero component changes.
 */

/** Registry key resolved against the static icon map in nav-link.tsx /
 * bottom-nav.tsx — same pattern as ThemeMotifConfig's `asset` key. */
export type NavIconKey =
  | "home"
  | "compass"
  | "map-pin"
  | "heart"
  | "user"
  | "info"
  | "phone"
  | "message-circle"
  | "shield"
  | "file-text"
  | "mail";

export interface NavItem {
  label: string;
  href: string;
  icon?: NavIconKey;
  /** Shown only in the mobile bottom nav (max 5 recommended for thumb reach). */
  showInBottomNav?: boolean;
}

export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "youtube"
  | "twitter"
  | "linkedin"
  | "whatsapp";

export interface SocialLink {
  platform: SocialPlatform;
  href: string;
  label: string;
}

export type AnnouncementKind = "trip" | "offer" | "coupon" | "limited-seats" | "festival";

export interface AnnouncementConfig {
  id: string;
  kind: AnnouncementKind;
  message: string;
  href?: string;
  linkLabel?: string;
  /** Whether the visitor can dismiss it for the session. */
  dismissible: boolean;
}

export type StickyCtaActionType = "book" | "whatsapp" | "call" | "share";

export interface StickyCtaAction {
  type: StickyCtaActionType;
  label: string;
  /** tel:, https://wa.me/, or an internal booking href — caller decides. */
  href?: string;
  /** For "share" — if omitted, ShareTriggerButton falls back to Web Share API with current URL. */
  onClick?: () => void;
}

export interface SiteConfig {
  brandName: string;
  tagline: string;
  brandStory: string;
  primaryNav: NavItem[];
  footerColumns: FooterColumn[];
  socialLinks: SocialLink[];
  contact: {
    whatsappHref: string;
    phoneHref: string;
    email: string;
  };
  copyrightHolder: string;
}
