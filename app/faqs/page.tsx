import type { Metadata } from "next";
import Link from "next/link";

import { contactContent, cancellationPolicyContent } from "@/data/shared/real-content";
import { SectionHeading } from "@/components/primitives/section-heading";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "FAQs | Universal Being",
  description: "Answers to common questions about booking, payment, cancellations and what's included on a Universal Being trip.",
};

const faqs = [
  {
    question: "How do I book a seat on a trip?",
    answer:
      "Pick a trip from All Trips, choose your sharing option, and pay the booking amount to confirm your seat. The balance is collected before boarding.",
  },
  {
    question: "How much do I need to pay to confirm my booking?",
    answer:
      "A booking amount of ₹2,500 per person (or 30% of the package cost, whichever applies to your trip) confirms your seat. The rest is collected on the day of boarding.",
  },
  {
    question: "What is your cancellation and refund policy?",
    answer: cancellationPolicyContent,
  },
  {
    question: "What's included in the trip price?",
    answer:
      "Accommodation, the meals listed on the trip page, AC transportation, a trip captain throughout, and all required permits. Anything not explicitly listed as included — personal expenses, entry/camera fees, lunches not mentioned, or extra costs from delays — is excluded.",
  },
  {
    question: "Do I need to carry an ID?",
    answer: "Yes — every traveller must carry a valid government-issued ID for the full trip.",
  },
  {
    question: "Can I join solo?",
    answer:
      "Yes, solo travellers are welcome on every batch. Choose Double or Triple sharing and you'll be paired with other travellers of the same gender.",
  },
  {
    question: "What if the itinerary changes due to weather or road conditions?",
    answer:
      "Safety comes first — the itinerary may be adjusted for weather, road conditions or other unforeseen circumstances, and we're not liable for delays caused by natural events or traffic.",
  },
  {
    question: "How do I contact the team during the trip?",
    answer: `Your trip captain is with you throughout. You can also reach us anytime on WhatsApp at ${contactContent.whatsapp}.`,
  },
];

/**
 * FAQs page (`/faqs`) — footer-linked, previously 404'd. Answers are drawn
 * from the same real policy copy already sourced in
 * `data/shared/real-content.ts` and the printed trip flyer's
 * inclusion/exclusion + payment sections, so this doesn't introduce new,
 * undocumented claims about how bookings work.
 */
export default function FAQsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-section-sm sm:py-section-md">
      <SectionHeading
        eyebrow="Support"
        title="Frequently asked questions"
        align="center"
        className="mx-auto mb-10"
      />

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-10 flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">Didn&apos;t find your answer?</p>
        <Button asChild>
          <Link href="/contact">Contact us</Link>
        </Button>
      </div>
    </div>
  );
}
