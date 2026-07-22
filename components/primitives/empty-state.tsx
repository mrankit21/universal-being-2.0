import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  /** Primary action, e.g. a "Clear filters" or "Create trip" button. */
  action?: React.ReactNode;
}

/**
 * EmptyState — zero-result / zero-data screens (no trips match filters, no
 * bookings yet, empty admin table). Voice is direction, not apology: state
 * what's true and what to do next.
 */
export function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-16 text-center",
        className
      )}
      {...props}
    >
      {icon && <div className="text-muted-foreground [&_svg]:size-10">{icon}</div>}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
