"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export interface HotelTierV2 {
  stars: number;
  label: string;
  description: string;
}

const DEFAULT_TIERS: HotelTierV2[] = [
  { stars: 3, label: "3 Star", description: "Comfortable, budget-friendly stays" },
  { stars: 4, label: "4 Star", description: "Elevated comfort & service" },
  { stars: 5, label: "5 Star", description: "Luxury properties, top locations" },
];

/**
 * Trip 2.0 UI — hotel category tier cards, matching the reference
 * screenshot. Static content only for now; once approved this maps from
 * `Trip.hotelCategories`.
 */
export function HotelTiersV2({ tiers = DEFAULT_TIERS }: { tiers?: HotelTierV2[] }) {
  return (
    <section id="hotel-tiers" className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-4">
        {tiers.map((tier, i) => (
          <motion.div
            key={tier.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-8 text-center"
          >
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star
                  key={j}
                  className={cn("size-5", j < tier.stars ? "fill-primary text-primary" : "text-muted-foreground/30")}
                />
              ))}
            </div>
            <span className="font-display text-xl font-semibold text-foreground">{tier.label}</span>
            <span className="text-sm text-muted-foreground">{tier.description}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
