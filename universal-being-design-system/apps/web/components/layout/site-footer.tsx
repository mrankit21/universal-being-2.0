import Image from "next/image";

import { getSiteSettings } from "@/lib/api/site-settings";
import { Logo } from "@/components/layout/logo";
import { FooterNav } from "@/components/layout/footer-nav";
import { FooterSocialLinks } from "@/components/layout/footer-social-links";
import { NewsletterForm } from "@/components/layout/newsletter-form";

/**
 * SiteFooter — server component; nothing here needs client interactivity
 * except NewsletterForm/BackToTopButton, which are their own isolated
 * client leaves. Content (brand story, social links, footer columns,
 * copyright line) comes from `getSiteSettings()` — MongoDB first,
 * `data/layout/site-config.ts` + `data/shared/real-content.ts` as
 * fallback when the database isn't configured/seeded yet — so editing
 * these in the Admin Panel reaches the live footer instead of only its
 * own preview.
 *
 * Layout: a large standalone wordmark (`Logo variant="footer"`) followed
 * by three stacked rounded "cards" — Newsletter, Nav links, Follow us —
 * then a bottom bar with copyright + Back to top. Mirrors the brand
 * reference the design was matched against: a prominent, hard-to-miss
 * brand name up top instead of a small inline logo lost among the columns.
 *
 * `theme.footer.style` ("minimal" | "rich" | "illustrated") is read by
 * whichever page wraps this in a themed `<ThemeBackground area="section">`
 * (Phase 3 pattern) — SiteFooter itself stays layout-only, matching the
 * Architecture rule that theme presentation lives in the theme/ layer.
 */
export async function SiteFooter() {
  const settings = await getSiteSettings();

  const bgImage = settings.footerBackground.image;
  const bgImageMobile = settings.footerBackground.imageMobile ?? bgImage;

  return (
    <footer className="ub-footer-purple relative isolate overflow-hidden border-t border-border pb-24 pt-14 md:pb-16">
      {bgImage ? (
        <>
          <Image
            src={bgImageMobile!.url}
            alt={bgImageMobile!.alt}
            fill
            sizes="100vw"
            className="absolute inset-0 -z-10 object-cover md:hidden"
            unoptimized
          />
          <Image
            src={bgImage.url}
            alt={bgImage.alt}
            fill
            sizes="100vw"
            className="absolute inset-0 -z-10 hidden object-cover md:block"
            unoptimized
          />
          <div
            className="absolute inset-0 -z-10 bg-black"
            style={{ opacity: settings.footerBackground.overlayOpacity }}
            aria-hidden="true"
          />
        </>
      ) : null}

      <div className="relative mx-auto flex max-w-5xl flex-col gap-6 px-6">
        {/* Big, unmissable brand moment — the main ask: the brand name
            should read instantly, not blend into the columns below. */}
        <div className="flex flex-col gap-3">
          <Logo variant="footer" />
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">{settings.brandStory}</p>
        </div>

        <div className="rounded-3xl bg-card p-8 sm:p-10">
          <h3 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
            Subscribe to the Newsletter
          </h3>
          <div className="mt-6 max-w-sm">
            <NewsletterForm />
          </div>
        </div>

        <div className="rounded-3xl bg-card p-8 sm:p-10">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <FooterNav columns={settings.footerColumns} />
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-3xl bg-card p-8 sm:p-10">
          <h3 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">Follow us</h3>
          <FooterSocialLinks links={settings.socialLinks} />
        </div>

        <div className="flex flex-col items-center gap-6 border-t border-border pt-8 sm:flex-row sm:justify-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {settings.copyrightHolder}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
