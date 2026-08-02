"use client";

import * as React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface FaqV2 {
  id: string;
  question: string;
  answer: string;
}

const DEFAULT_FAQS: FaqV2[] = [
  { id: "1", question: "What is the best time to visit?", answer: "Late May to early October, when the high passes are open and roads are clear." },
  { id: "2", question: "How fit do I need to be?", answer: "A moderate fitness level is enough — most days involve short walks at altitude rather than technical trekking." },
  { id: "3", question: "Is altitude sickness a concern?", answer: "Yes, we build in acclimatisation days and our crew carries oxygen and basic medical supplies as a precaution." },
];

/**
 * Trip 2.0 UI — Frequently Asked Questions accordion, matching the
 * reference screenshot. Static content only for now; once approved this
 * maps from `Trip.faqs` (`Faq[]`).
 */
export function FaqAccordionV2({ faqs = DEFAULT_FAQS }: { faqs?: FaqV2[] }) {
  return (
    <section id="faqs" className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <h2 className="mb-6 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq) => (
          <AccordionItem key={faq.id} value={faq.id}>
            <AccordionTrigger className="text-base">{faq.question}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
