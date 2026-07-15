import type { SiteConfig } from "@/types/layout";
import { contactContent, socialLinksContent } from "@/data/shared/real-content";

/**
 * Site config — the ONLY place Global Layout content lives. Every header,
 * footer, and nav component below reads from this file; none of them ever
 * contain literal link labels/hrefs. Swap a link, add a destination, or
 * rename the brand here and every surface that inherits the Global Layout
 * (Phase 4 rule: "future pages must automatically inherit this layout")
 * picks it up with zero component edits.
 *
 * Contact/social values below are REAL, sourced from `data/shared/real-content.ts`
 * (Step 6) — the placeholder numbers this file used to carry have been replaced.
 */
export const siteConfig: SiteConfig = {
  brandName: "Universal Being",
  tagline: "Curated group trips, themed to the destination.",
  brandStory:
    "We run small, curated group trips across India for people who'd rather travel with new friends than a checklist. Every trip is themed to its destination — the mood changes, the care behind it doesn't.",

  primaryNav: [
    { label: "Home", href: "/", icon: "home", showInBottomNav: true },
    { label: "Destinations", href: "/destinations", icon: "compass", showInBottomNav: true },
    { label: "Trips", href: "/trips", icon: "map-pin", showInBottomNav: true },
    { label: "Saved", href: "/saved", icon: "heart", showInBottomNav: true },
    { label: "About", href: "/about", icon: "info" },
  ],

  footerColumns: [
    {
      title: "Explore",
      links: [
        { label: "All trips", href: "/trips" },
        { label: "Destinations", href: "/destinations" },
        { label: "Offers", href: "/offers" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Contact us", href: "/contact" },
        { label: "FAQs", href: "/faqs" },
        { label: "Trip cancellations", href: "/support/cancellations" },
      ],
    },
    {
      title: "Policies",
      links: [
        { label: "Terms of service", href: "/legal/terms" },
        { label: "Privacy policy", href: "/legal/privacy" },
        { label: "Refund policy", href: "/legal/refunds" },
      ],
    },
  ],

  socialLinks: [
    { platform: "instagram", href: socialLinksContent.instagram, label: "Instagram" },
    { platform: "whatsapp", href: "https://wa.me/919354085668", label: "WhatsApp" },
  ],

  contact: {
    whatsappHref: "https://wa.me/919354085668",
    phoneHref: "tel:+919354085668",
    email: contactContent.email,
  },

  copyrightHolder: "Universal Being",
};
