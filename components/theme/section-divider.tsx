import { cn } from "@/lib/utils";
import type { DividerShapeKey } from "@/types/theme";

export interface SectionDividerProps {
  shape: DividerShapeKey;
  /** "top" flips the shape so it reads correctly whichever edge of the
   * section it sits on (e.g. mountains pointing "into" the section above vs.
   * the section below). */
  position?: "top" | "bottom";
  className?: string;
}

/**
 * SectionDivider — Step 7.5D: "Remove plain section transitions ... create
 * premium landscape dividers." Same static-registry pattern as every other
 * theme/ component (DecorativeMotif, DecorativePattern): the SVG shape is
 * resolved from `theme.divider.shape`, so a page never branches on which
 * destination it's rendering — it just renders `<SectionDivider shape={theme.divider.shape} />`
 * between stacked sections. Colored via `currentColor` + `text-[var(--ub-theme-surface)]`
 * so it always blends into the section it's transitioning toward.
 */
const DIVIDER_ASSET: Record<Exclude<DividerShapeKey, "none">, string> = {
  mountains: "/illustrations/dividers/mountains.svg",
  desert: "/illustrations/dividers/desert.svg",
  ocean: "/illustrations/dividers/ocean.svg",
  forest: "/illustrations/dividers/forest.svg",
  fog: "/illustrations/dividers/fog.svg",
  palace: "/illustrations/dividers/palace.svg",
};

export function SectionDivider({ shape, position = "bottom", className }: SectionDividerProps) {
  if (shape === "none") return null;
  const src = DIVIDER_ASSET[shape];
  if (!src) return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none relative h-12 w-full overflow-hidden sm:h-20 lg:h-28",
        position === "top" && "rotate-180",
        className
      )}
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "100% 100%",
        maskSize: "100% 100%",
        backgroundColor: "var(--ub-theme-surface)",
      }}
    />
  );
}
