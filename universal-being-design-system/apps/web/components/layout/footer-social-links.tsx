import type { LucideIcon } from "lucide-react";
import { Globe } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  InstagramMark,
  FacebookMark,
  YoutubeMark,
  XMark,
  LinkedinMark,
  WhatsappMark,
} from "@/components/layout/social-icons";
import type { SocialLink } from "@/types/layout";

/**
 * lucide-react dropped brand/logo glyphs from its icon set (Instagram,
 * Facebook, Youtube, Twitter, Linkedin no longer exist there — confirmed
 * against the installed package). All six brand marks (including WhatsApp,
 * which was previously a generic MessageCircle bubble) now come from the
 * local social-icons file instead, so the "Follow us" row always shows the
 * real WhatsApp glyph rather than a plain chat bubble.
 *
 * `platform` is free text in the Admin Panel (see types/layout.ts), so this
 * is a best-effort match against the known brands — anything else (or a
 * typo/different casing) falls back to a generic globe icon rather than
 * crashing the footer.
 */
const PLATFORM_ICON: Partial<Record<string, LucideIcon>> = {
  instagram: InstagramMark,
  facebook: FacebookMark,
  youtube: YoutubeMark,
  twitter: XMark,
  x: XMark,
  linkedin: LinkedinMark,
  whatsapp: WhatsappMark,
};

export interface FooterSocialLinksProps {
  links: SocialLink[];
  className?: string;
}

export function FooterSocialLinks({ links, className }: FooterSocialLinksProps) {
  if (links.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap items-center gap-3", className)}>
      {links.map((social, i) => {
        const Icon = PLATFORM_ICON[social.platform.trim().toLowerCase()] ?? Globe;
        return (
          <li key={`${social.platform}-${i}`}>
            <a
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              className={cn(
                "inline-flex size-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white shadow-lg backdrop-blur-md transition-colors",
                "hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
