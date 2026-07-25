import type { Metadata } from "next";

import { termsAndConditionsContent } from "@/data/shared/real-content";
import { LegalPage } from "@/components/primitives/legal-page";

export const metadata: Metadata = {
  title: "Terms of service | Universal Being",
  description: "Terms and conditions for travelling with Universal Being.",
};

/**
 * Terms of service (`/legal/terms`) — footer-linked, previously 404'd.
 * Renders the same `termsAndConditionsContent` list every trip's
 * `termsAndConditions` field defaults to, so the standalone policy page
 * and each trip's terms can't say different things.
 */
export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      intro={[
        "These terms apply to every trip booked with Universal Being. By booking a seat, you agree to the following:",
      ]}
      items={termsAndConditionsContent}
    />
  );
}
