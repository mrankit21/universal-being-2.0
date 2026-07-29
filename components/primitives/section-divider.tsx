interface SectionDividerProps {
  headline: string;
  subtitle?: string;
}

/**
 * SectionDivider — decorative script-font divider used to close out a
 * section (e.g. "End Of Trip" after the itinerary). Renders the headline
 * in the cursive `font-script` face flanked by two hairlines, with an
 * optional smaller subtitle line beneath. Colors are theme tokens
 * (`ub-brass-*`) so it always matches the active theme's background.
 */
export function SectionDivider({ headline, subtitle }: SectionDividerProps) {
  return (
    <div className="my-8 flex flex-col items-center gap-2 px-6">
      <div className="flex w-full max-w-2xl items-center gap-4">
        <span className="h-px flex-1 bg-ub-brass-500/40" aria-hidden="true" />
        <span className="font-script text-4xl leading-none text-ub-brass-500 sm:text-5xl">
          {headline}
        </span>
        <span className="h-px flex-1 bg-ub-brass-500/40" aria-hidden="true" />
      </div>
      {subtitle ? (
        <p className="font-display text-sm font-medium text-ub-brass-600 sm:text-base">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
