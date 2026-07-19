"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

export interface PremiumAccordionItem {
  question: string;
  answer: string;
}

export interface PremiumAccordionProps {
  items: PremiumAccordionItem[];
  /** Index open by default; pass `null` to start fully collapsed. */
  defaultOpenIndex?: number | null;
  className?: string;
}

/**
 * PremiumAccordion — reusable single-open FAQ accordion (Home "Why Travel
 * With Us" section reference). Deliberately not built on the existing
 * Radix-based `components/ui/accordion.tsx` (used by TripFAQ elsewhere)
 * so that its chevron styling stays untouched; this variant needs its own
 * Plus/Minus trigger, brand-colored icon, and framer-motion height
 * animation. Only one item is open at a time — opening one closes any
 * other.
 */
export function PremiumAccordion({ items, defaultOpenIndex = 0, className }: PremiumAccordionProps) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(defaultOpenIndex);

  return (
    <div className={cn("overflow-hidden rounded-[28px] bg-[#F8F8F8] sm:rounded-[32px]", className)}>
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        const panelId = `why-travel-panel-${i}`;
        const triggerId = `why-travel-trigger-${i}`;

        return (
          <div key={item.question} className={cn(i !== 0 && "border-t border-black/10")}>
            <button
              type="button"
              id={triggerId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className={cn(
                "flex w-full items-center justify-between gap-4 px-6 py-5 text-left sm:px-8 sm:py-6",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
            >
              <span className="font-display text-base font-semibold text-[#1c1c1c] sm:text-lg">
                {item.question}
              </span>
              <span className="flex size-6 shrink-0 items-center justify-center text-ub-brass-600">
                {isOpen ? (
                  <Minus className="size-5" aria-hidden="true" />
                ) : (
                  <Plus className="size-5" aria-hidden="true" />
                )}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-6 text-sm text-[#5b5b5b] sm:px-8 sm:text-base">{item.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
