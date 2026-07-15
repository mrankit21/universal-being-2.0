import { MessageCircle, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { InstagramMark, FacebookMark, YoutubeMark, XMark, LinkedinMark } from "@/components/layout/social-icons";
import type { SocialLink, SocialPlatform } from "@/types/layout";

/**
 * lucide-react dropped brand/logo glyphs from its icon set (Instagram,
 * Facebook, Youtube, Twitter, Linkedin no longer exist there — confirmed
 * against the installed package). Those five now come from a small local
 * icon file instead; MessageCircle (whatsapp) is a real lucide icon and is
 * unaffected.
 */
const PLATFORM_ICON: Record<SocialPlatform, LucideIcon> = {
  instagram: InstagramMark,
  facebook: FacebookMark,
  youtube: YoutubeMark,
  twitter: XMark,
  linkedin: LinkedinMark,
  whatsapp: MessageCircle,
};

export interface FooterSocialLinksProps {
  links: SocialLink[];
  className?: string;
}

export function FooterSocialLinks({ links, className }: FooterSocialLinksProps) {
  if (links.length === 0) return null;

  return (
    <ul className={cn("flex items-center gap-2", className)}>
      {links.map((social) => {
        const Icon = PLATFORM_ICON[social.platform];
        return (
          <li key={social.platform}>
            <a
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors",
                "hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
