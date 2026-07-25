import type { Metadata } from "next";

import { privacyPolicyContent, contactContent } from "@/data/shared/real-content";
import { LegalPage } from "@/components/primitives/legal-page";

export const metadata: Metadata = {
  title: "Privacy policy | Universal Being",
  description: "How Universal Being collects, uses and protects your information.",
};

/**
 * Privacy policy (`/legal/privacy`) — footer-linked, previously 404'd.
 * Body text is the real `privacyPolicyContent` from
 * `data/shared/real-content.ts`; only the closing contact line is new
 * copy, added so the page tells a visitor where to actually ask a privacy
 * question instead of ending mid-topic.
 */
export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro={[
        privacyPolicyContent,
        `Questions about your data can be sent to ${contactContent.email} or via WhatsApp at ${contactContent.whatsapp}.`,
      ]}
    />
  );
}
