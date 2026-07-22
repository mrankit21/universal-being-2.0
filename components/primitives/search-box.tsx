"use client";

import * as React from "react";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export interface SearchBoxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  containerClassName?: string;
}

/**
 * SearchBox — the single reusable search input (trip listing search, admin
 * trip/booking search). Controlled component; the caller owns debouncing
 * and result-fetching, this only handles the input UI + clear affordance.
 */
export const SearchBox = React.forwardRef<HTMLInputElement, SearchBoxProps>(
  ({ value, onChange, onClear, placeholder = "Search destinations, trips…", containerClassName, className, ...props }, ref) => (
    <div className={cn("relative", containerClassName)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        ref={ref}
        type="search"
        role="searchbox"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn("pl-9", value && "pr-9", className)}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => (onClear ? onClear() : onChange(""))}
          aria-label="Clear search"
          className={cn(
            "absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground",
            "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
);
SearchBox.displayName = "SearchBox";
