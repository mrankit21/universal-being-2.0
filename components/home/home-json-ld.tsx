import { siteConfig } from "@/data/layout/site-config";
import { contactContent } from "@/data/shared/real-content";
import { absoluteUrl } from "@/lib/seo/site-url";

/**
 * HomeJsonLd — Step 5.2, the homepage half of the Destination/Homepage
 * JSON-LD gap (Trip pages already have `TripJsonLd`). There's no single
 * "item" the homepage represents the way a Trip or Destination page does,
 * so this emits the two standard site-level nodes instead: `Organization`
 * (who Universal Being is, for knowledge-panel-style results) and
 * `WebSite` (enables sitelinks searchbox eligibility). Built entirely from
 * `siteConfig`/`data/shared/real-content.ts` — no admin-editable fields
 * needed, same as the rest of the Global Layout content those files back.
 */
export function HomeJsonLd() {
  const siteUrl = absoluteUrl("/");

  const organization = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: siteConfig.brandName,
    url: siteUrl,
    logo: absoluteUrl("/brand/logo.png"),
    description: siteConfig.brandStory,
    email: contactContent.email,
    telephone: contactContent.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: contactContent.officeAddress,
      addressCountry: "IN",
    },
    sameAs: [contactContent.instagram],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.brandName,
    url: siteUrl,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  );
}
