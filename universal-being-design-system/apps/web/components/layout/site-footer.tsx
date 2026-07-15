import { siteConfig } from "@/data/layout/site-config";
import { Logo } from "@/components/layout/logo";
import { FooterNav } from "@/components/layout/footer-nav";
import { FooterSocialLinks } from "@/components/layout/footer-social-links";
import { NewsletterForm } from "@/components/layout/newsletter-form";

/**
 * SiteFooter — server component; nothing here needs client interactivity
 * except NewsletterForm, which is its own isolated client leaf. Adding a
 * footer section, link, or social channel means editing
 * data/layout/site-config.ts only — this file never changes.
 *
 * `theme.footer.style` ("minimal" | "rich" | "illustrated") is read by
 * whichever page wraps this in a themed `<ThemeBackground area="section">`
 * (Phase 3 pattern) — SiteFooter itself stays layout-only, matching the
 * Architecture rule that theme presentation lives in the theme/ layer.
 */
export function SiteFooter() {
  return (
    <footer className="ub-footer-purple relative border-t border-border pb-24 pt-16 md:pb-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-6">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="flex max-w-sm flex-col gap-4">
            <Logo variant="full" />
            <p className="text-sm text-muted-foreground">{siteConfig.brandStory}</p>
            <FooterSocialLinks links={siteConfig.socialLinks} />
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:flex md:gap-16">
            <FooterNav columns={siteConfig.footerColumns} />
          </div>
        </div>

        <div className="flex flex-col gap-6 border-t border-border pt-8 md:flex-row md:items-end md:justify-between">
          <NewsletterForm />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {siteConfig.copyrightHolder}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
