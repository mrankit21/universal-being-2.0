import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Mail, MapPin, Instagram } from "lucide-react";

import { aboutContent, contactContent } from "@/data/shared/real-content";
import { SectionHeading } from "@/components/primitives/section-heading";
import { ValuePropsSection } from "@/components/home/value-props-section";
import { Rating } from "@/components/primitives/rating";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About | Universal Being",
  description: aboutContent.body.split("\n\n")[0],
};

/** Real traveller quotes from the trip flyer's testimonials page — kept
 * short and attributed by first name + initial, matching how they were
 * originally shared (Google review style). */
const travellerQuotes = [
  { name: "Ritika N.", quote: "Joined the 19th June batch and honestly can't express how amazing the experience was.", rating: 5 },
  { name: "Rohit", quote: "Had an amazing Manali trip — everything was well planned and professionally managed from start to finish.", rating: 5 },
  { name: "Sanjana S.", quote: "As a solo traveller I always felt safe and well taken care of throughout the journey.", rating: 5 },
  { name: "Nikhil S.", quote: "Booked our Jibhi Tirthan package and the team provides very good service. The trip was totally worth it.", rating: 5 },
  { name: "Ankit R.", quote: "Great management, friendly team, comfortable stays, and a well-planned itinerary — seamless and enjoyable.", rating: 5 },
  { name: "Ankita S.", quote: "Thank you for the amazing service and great hospitality. Everything was well managed.", rating: 5 },
];

const bodyParagraphs = aboutContent.body.split("\n\n");

/**
 * About page — was only ever a scaffolded nav link (`/about` 404'd).
 * Content below is Universal Being's real copy, already sourced into
 * `data/shared/real-content.ts` for Step 6 (footer/legal pages) but never
 * given a page of its own until now. Testimonials use the real traveller
 * quotes from the printed trip flyer rather than the placeholder
 * `data/home/testimonials.ts` set, since those are fictional filler.
 */
export default function AboutPage() {
  return (
    <div>
      <section className="ub-section-light mx-auto max-w-4xl px-6 py-section-sm text-center sm:py-section-md">
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-ub-brass-500">{aboutContent.tagline}</p>
        <h1 className="font-display text-3xl font-medium text-foreground sm:text-4xl">About Universal Being</h1>
        <div className="mx-auto mt-6 flex max-w-2xl flex-col gap-4 text-left text-muted-foreground sm:text-center">
          {bodyParagraphs.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/trips">Browse trips</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={contactContent.instagram} target="_blank" rel="noopener noreferrer">
              Follow us on Instagram
            </a>
          </Button>
        </div>
      </section>

      <ValuePropsSection />

      <section className="mx-auto max-w-6xl px-6 py-section-sm sm:py-section-md">
        <SectionHeading eyebrow="From our travellers" title="What people say after the trip" align="center" className="mx-auto mb-10 max-w-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {travellerQuotes.map((t) => (
            <Card key={t.name}>
              <CardContent className="flex flex-col gap-3 pt-5">
                <Rating value={t.rating} size="sm" showValue={false} />
                <p className="text-sm text-muted-foreground">&ldquo;{t.quote}&rdquo;</p>
                <p className="text-sm font-medium text-foreground">{t.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="ub-section-light">
        <div className="mx-auto max-w-4xl px-6 py-section-sm text-center sm:py-section-md">
          <SectionHeading eyebrow="Get in touch" title="Plan your next trip with us" align="center" className="mx-auto mb-8 max-w-2xl" />
          <div className="grid gap-6 sm:grid-cols-2">
            <a href={`tel:${contactContent.phone.replace(/\s/g, "")}`} className="flex flex-col items-center gap-2 rounded-lg border border-border p-6">
              <Phone className="size-5 text-ub-brass-500" aria-hidden="true" />
              <span className="font-medium text-foreground">{contactContent.phone}</span>
              <span className="text-sm text-muted-foreground">{contactContent.alternateContact}</span>
            </a>
            <a href={`mailto:${contactContent.email}`} className="flex flex-col items-center gap-2 rounded-lg border border-border p-6">
              <Mail className="size-5 text-ub-brass-500" aria-hidden="true" />
              <span className="font-medium text-foreground">{contactContent.email}</span>
            </a>
            <a href={contactContent.instagram} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 rounded-lg border border-border p-6">
              <Instagram className="size-5 text-ub-brass-500" aria-hidden="true" />
              <span className="font-medium text-foreground">universalbeing_07</span>
            </a>
            <div className="flex flex-col items-center gap-2 rounded-lg border border-border p-6">
              <MapPin className="size-5 text-ub-brass-500" aria-hidden="true" />
              <span className="text-sm text-muted-foreground">{contactContent.officeAddress}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
