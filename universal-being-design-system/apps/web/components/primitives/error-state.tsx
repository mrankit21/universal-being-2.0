import { AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * ErrorState — failed fetch / payment failure / server error surfaces.
 * States what went wrong and offers a concrete next step; never vague,
 * never apologetic in tone.
 */
export function ErrorState({
  title = "Something went wrong",
  description = "This page couldn't load. Try again, or come back in a moment.",
  onRetry,
  retryLabel = "Try again",
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-6 py-16 text-center",
        className
      )}
      {...props}
    >
      <AlertTriangle className="size-10 text-destructive" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-2">
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
