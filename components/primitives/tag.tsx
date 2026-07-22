import { cn } from "@/lib/utils";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Visual tone — kept semantic, never an arbitrary color prop. */
  tone?: "neutral" | "brass" | "teal";
}

/**
 * Tag — static descriptive metadata (e.g. trip category, difficulty level,
 * "Group Trip"). Not interactive. For an interactive/toggleable version see
 * `Chip`; for a status pill see `Badge`.
 */
export function Tag({ tone = "neutral", className, ...props }: TagProps) {
  const toneClasses = {
    neutral: "bg-muted text-muted-foreground",
    brass: "bg-ub-brass-500/10 text-ub-brass-600",
    teal: "bg-ub-teal-500/10 text-ub-teal-600",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
