import { cn } from "@/lib/utils";

export interface PriceProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Final price to display, in the smallest sensible unit for the currency (e.g. rupees, not paise). */
  amount: number;
  /** Original pre-discount price. When provided and greater than `amount`, renders struck through. */
  originalAmount?: number;
  currency?: string;
  /** e.g. "/ person", "/ night" */
  suffix?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { amount: "text-base", original: "text-xs", suffix: "text-xs" },
  md: { amount: "text-xl", original: "text-sm", suffix: "text-sm" },
  lg: { amount: "text-3xl", original: "text-base", suffix: "text-base" },
} as const;

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Price — the only component allowed to render a trip/booking price. Always
 * fed from `Trip.price` / `DepartureDate.priceOverride`; never a literal
 * number typed into a page. Centralizing formatting here means currency
 * rules (locale, rounding, discount display) change in exactly one place.
 */
export function Price({
  amount,
  originalAmount,
  currency = "INR",
  suffix,
  size = "md",
  className,
  ...props
}: PriceProps) {
  const hasDiscount = typeof originalAmount === "number" && originalAmount > amount;
  const sizes = sizeMap[size];

  return (
    <div className={cn("flex flex-wrap items-baseline gap-1.5", className)} {...props}>
      {hasDiscount && (
        <span className={cn("text-muted-foreground line-through", sizes.original)}>
          {formatAmount(originalAmount!, currency)}
        </span>
      )}
      <span className={cn("font-semibold tracking-tight text-foreground", sizes.amount)}>
        {formatAmount(amount, currency)}
      </span>
      {suffix && <span className={cn("text-muted-foreground", sizes.suffix)}>{suffix}</span>}
    </div>
  );
}
