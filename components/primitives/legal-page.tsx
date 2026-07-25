import { SectionHeading } from "@/components/primitives/section-heading";

export interface LegalPageProps {
  title: string;
  updated?: string;
  /** Plain paragraphs, rendered above `items` if both are given. */
  intro?: string[];
  /** Rendered as a numbered policy list — matches how the flyer presents Terms & Conditions. */
  items?: string[];
}

/**
 * Shared shell for the three `/legal/*` pages (Terms, Privacy, Refunds) so
 * they read as one consistent policy set instead of three differently laid
 * out one-offs.
 */
export function LegalPage({ title, updated, intro, items }: LegalPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-section-sm sm:py-section-md">
      <SectionHeading eyebrow="Policies" title={title} align="center" className="mx-auto mb-2" />
      {updated && <p className="mb-8 text-center text-xs text-muted-foreground">Last updated {updated}</p>}

      {intro && (
        <div className="flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground">
          {intro.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      )}

      {items && (
        <ol className="mt-6 flex flex-col gap-3">
          {items.map((item, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
              <span className="shrink-0 font-medium text-ub-brass-600">{i + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
