import { Bus, Building2, Sparkles, Binoculars, Car, UtensilsCrossed, IndianRupee, type LucideIcon } from "lucide-react";

interface IncludeItem {
  label: string;
  icon: LucideIcon;
}

const includes: IncludeItem[] = [
  { label: "Luxury Traveller", icon: Bus },
  { label: "Hotels", icon: Building2 },
  { label: "Luxury Hotel", icon: Sparkles },
  { label: "Sightseeing", icon: Binoculars },
  { label: "Transfers", icon: Car },
  { label: "Meals", icon: UtensilsCrossed },
  { label: "Taxes", icon: IndianRupee },
];

/**
 * PackageIncludesStrip — thin band directly under the homepage hero,
 * mirroring the "Package Includes" icon row from the reference
 * screenshot (Flights/Hotels/Sightseeing/Transfers/Meals/Taxes). Adapted
 * for Universal Being's road-trip packages: "Flights" swapped for
 * "Luxury Traveller" (the AC coach every trip actually runs on), with a
 * "Luxury Hotel" entry added alongside the base "Hotels" one. Static —
 * not tied to Homepage CMS section ordering, since every trip's
 * inclusions already vary per-trip on the trip detail page; this is
 * purely a homepage trust strip.
 */
export function PackageIncludesStrip() {
  return (
    <div className="border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <p className="mb-1 font-display text-sm font-medium text-foreground sm:text-base">Package Includes</p>
        <div className="mb-3 h-0.5 w-10 rounded-full bg-ub-brass-500" aria-hidden="true" />

        <div className="-mx-6 flex gap-6 overflow-x-auto px-6 sm:mx-0 sm:justify-between sm:gap-2 sm:overflow-visible sm:px-0">
          {includes.map(({ label, icon: Icon }) => (
            <div key={label} className="flex shrink-0 flex-col items-center gap-1.5 text-center">
              <Icon className="size-5 text-ub-brass-500" aria-hidden="true" />
              <span className="whitespace-nowrap text-xs text-muted-foreground sm:text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
