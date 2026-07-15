import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export interface RatingProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0–5, supports halves (e.g. 4.5). */
  value: number;
  /** Number of reviews backing this rating — shown next to the stars when provided. */
  count?: number;
  size?: "sm" | "md";
  showValue?: boolean;
}

const starSize = { sm: "size-3.5", md: "size-4" } as const;

/** Rating — read-only star display driven by `Trip.reviews`/aggregate score. Never hand-typed per trip. */
export function Rating({ value, count, size = "sm", showValue = true, className, ...props }: RatingProps) {
  const clamped = Math.max(0, Math.min(5, value));

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role="img"
      aria-label={`Rated ${clamped.toFixed(1)} out of 5${count ? ` from ${count} reviews` : ""}`}
      {...props}
    >
      <div className="flex" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => {
          const fillPercent = Math.max(0, Math.min(1, clamped - i)) * 100;
          return (
            <span key={i} className="relative">
              <Star className={cn(starSize[size], "text-muted-foreground/40")} strokeWidth={1.5} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
                <Star className={cn(starSize[size], "fill-ub-brass-500 text-ub-brass-500")} strokeWidth={1.5} />
              </span>
            </span>
          );
        })}
      </div>
      {showValue && <span className="text-sm font-medium text-foreground">{clamped.toFixed(1)}</span>}
      {typeof count === "number" && (
        <span className="text-sm text-muted-foreground">({count.toLocaleString("en-IN")})</span>
      )}
    </div>
  );
}
