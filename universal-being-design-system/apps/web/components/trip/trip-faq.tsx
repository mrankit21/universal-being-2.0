import type { Trip } from "@/types/trip";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { SectionHeading } from "@/components/primitives/section-heading";

export interface TripFAQProps {
  trip: Trip;
}

/** TripFAQ — Architecture §2's `TripFAQ`; renders `faqs[]`. */
export function TripFAQ({ trip }: TripFAQProps) {
  if (trip.faqs.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <SectionHeading title="Frequently asked questions" className="mb-5" />
      <Accordion type="single" collapsible className="rounded-lg border border-border bg-card px-5">
        {trip.faqs.map((faq) => (
          <AccordionItem key={faq.id} value={faq.id}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
