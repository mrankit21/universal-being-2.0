import { getSiteSettings } from "@/lib/api/site-settings";
import { Logo } from "@/components/layout/logo";
import { FooterNav } from "@/components/layout/footer-nav";
import { FooterSocialLinks } from "@/components/layout/footer-social-links";
import { NewsletterForm } from "@/components/layout/newsletter-form";

/**
 * SiteFooter — server component; nothing here needs client interactivity
 * except NewsletterForm, which is its own isolated client leaf. Content
 * (brand story, social links, footer columns, copyright line) now comes
 * from `getSiteSettings()` — MongoDB first, `data/layout/site-config.ts` +
 * `data/shared/real-content.ts` as fallback when the database isn't
 * configured/seeded yet — so editing these in the Admin Panel reaches the
 * live footer instead of only its own preview.
 *
 * `theme.footer.style` (\"minimal\" | \"rich\" | \"illustrated\") is read by
 * whichever page wraps this in a themed `<ThemeBackground area=\"section\">`
 * (Phase 3 pattern) — SiteFooter itself stays layout-only, matching the
 * Architecture rule that theme presentation lives in the theme/ layer.
 */
export async function SiteFooter() {
  const settings = await getSiteSettings();

  return (
    <footer className="ub-footer-purple relative border-t border-border pb-24 pt-16 md:pb-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-6">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="flex max-w-sm flex-col gap-4">
            <Logo variant="full" />
            <p className="text-sm text-muted-foreground">{settings.brandStory}</p>
            <FooterSocialLinks links={settings.socialLinks} />
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:flex md:gap-16">
            <FooterNav columns={settings.footerColumns} />
          </div>
        </div>

        <div className="flex flex-col gap-6 border-t border-border pt-8 md:flex-row md:items-end md:justify-between">
          <NewsletterForm />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {settings.copyrightHolder}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}