"use client";

import { Chip } from "@/components/primitives/chip";
import { cn } from "@/lib/utils";

export interface FilterChipOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface FilterChipsProps extends React.HTMLAttributes<HTMLDivElement> {
  options: FilterChipOption[];
  /** Selected option values. */
  value: string[];
  onValueChange: (next: string[]) => void;
  /** aria-label for the group, e.g. "Filter trips by category". */
  label: string;
}

/**
 * FilterChips — multi-select chip group driving trip listing filters
 * (category, duration, budget band). Entirely config-driven via `options`;
 * the listing page owns the actual filtering logic, this only tracks
 * selection state and renders it accessibly as a group of checkboxes.
 */
export function FilterChips({ options, value, onValueChange, label, className, ...props }: FilterChipsProps) {
  function toggle(optionValue: string) {
    if (value.includes(optionValue)) {
      onValueChange(value.filter((v) => v !== optionValue));
    } else {
      onValueChange([...value, optionValue]);
    }
  }

  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap gap-2", className)} {...props}>
      {options.map((option) => (
        <Chip
          key={option.value}
          selected={value.includes(option.value)}
          icon={option.icon}
          onClick={() => toggle(option.value)}
        >
          {option.label}
        </Chip>
      ))}
    </div>
  );
}
