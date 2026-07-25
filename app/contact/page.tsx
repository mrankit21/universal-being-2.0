import type { Metadata } from "next";
import { Phone, Mail, MapPin, Instagram, MessageCircle } from "lucide-react";

import { contactContent } from "@/data/shared/real-content";
import { SectionHeading } from "@/components/primitives/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contact us | Universal Being",
  description: "Reach Universal Being by phone, WhatsApp, email or Instagram — or visit our Rohini, Delhi office.",
};

/**
 * Contact page (`/contact`) — the footer's "Contact us" link had no route.
 * Reuses the real `contactContent` from `data/shared/real-content.ts`
 * (same source the About page's contact block already pulls from) rather
 * than re-typing the phone numbers and address a second time.
 */
export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-section-sm sm:py-section-md">
      <SectionHeading
        eyebrow="Get in touch"
        title="Contact us"
        description="Questions about a trip, a booking, or planning something custom? Reach us any of these ways."
        align="center"
        className="mx-auto mb-10"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <a href={`https://wa.me/${contactContent.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
              <MessageCircle className="size-5 text-ub-brass-500" aria-hidden="true" />
              <span className="font-medium text-foreground">WhatsApp</span>
              <span className="text-sm text-muted-foreground">{contactContent.whatsapp}</span>
            </CardContent>
          </Card>
        </a>

        <a href={`tel:${contactContent.phone.replace(/\s/g, "")}`}>
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
              <Phone className="size-5 text-ub-brass-500" aria-hidden="true" />
              <span className="font-medium text-foreground">{contactContent.phone}</span>
              <span className="text-sm text-muted-foreground">Alt: {contactContent.alternateContact}</span>
            </CardContent>
          </Card>
        </a>

        <a href={`mailto:${contactContent.email}`}>
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
              <Mail className="size-5 text-ub-brass-500" aria-hidden="true" />
              <span className="font-medium text-foreground">{contactContent.email}</span>
            </CardContent>
          </Card>
        </a>

        <a href={contactContent.instagram} target="_blank" rel="noopener noreferrer">
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
              <Instagram className="size-5 text-ub-brass-500" aria-hidden="true" />
              <span className="font-medium text-foreground">universalbeing_07</span>
            </CardContent>
          </Card>
        </a>
      </div>

      <Card className="mt-4">
        <CardContent className="flex flex-col items-center gap-2 py-8 text-center sm:flex-row sm:justify-center sm:gap-4 sm:text-left">
          <MapPin className="size-5 shrink-0 text-ub-brass-500" aria-hidden="true" />
          <span className="text-sm text-muted-foreground">{contactContent.officeAddress}</span>
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-center">
        <Button asChild size="lg">
          <a href={`https://wa.me/${contactContent.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
            Message us on WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );
}
