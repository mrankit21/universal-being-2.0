import { cn } from "@/lib/utils";

export interface SectionHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Small label above the title, e.g. "Featured", "Why travel with us". */
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  /** Optional slot for a CTA/link, right-aligned on desktop next to the title. */
  action?: React.ReactNode;
}

/**
 * SectionHeading — the recurring title block used to open every homepage
 * and listing section. Keeps display typography (font-display) consistent
 * across the entire site instead of each section hand-rolling its own h2.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  action,
  className,
  ...props
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className
      )}
      {...props}
    >
      <div className={cn("flex flex-col gap-2", align === "center" && "items-center")}>
        {eyebrow && (
          <span className="text-sm font-medium uppercase tracking-wide text-ub-brass-600">{eyebrow}</span>
        )}
        <h2 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          {title}
        </h2>
        {description && <p className="max-w-2xl text-base text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
