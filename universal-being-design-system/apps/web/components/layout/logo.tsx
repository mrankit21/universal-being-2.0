"use client";

import Link from "next/link";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { useBrand } from "@/components/layout/brand-provider";

export interface LogoProps {
  className?: string;
  /** "mark" is the compact header version. "full" shows the tagline
   * beneath a medium wordmark. "footer" is a much larger, standalone
   * wordmark (no tagline) for a prominent footer brand moment. */
  variant?: "mark" | "full" | "footer";
}

/**
 * Logo — brand mark + wordmark. Brand name/tagline and the (optional)
 * uploaded logo image(s) now come from `useBrand()` (DB-first, via
 * `BrandProvider` in app/layout.tsx) instead of the static site-config
 * import, so Admin → Settings → Brand Assets actually reaches the live
 * site. When no real logo has been uploaded yet (`logo` is null —
 * placeholder/empty), only the text wordmark renders, same as before.
 *
 * Step 8 fix: `logoDark` was already resolved by `getSiteBrand()` and sat
 * in the `useBrand()` context, but this component never read it — dark
 * mode (the `.dark` class ThemeModeToggle puts on `<html>`) kept showing
 * the light logo regardless. Both images are now rendered together and
 * Tailwind's `dark:` class variant (`darkMode: "class"` in
 * tailwind.config.ts) picks the right one, so there's no client-side
 * flicker and no hydration mismatch. If only one variant has been
 * uploaded, that one shows in both modes.
 */
export function Logo({ className, variant = "mark" }: LogoProps) {
  const { brandName, tagline, logo, logoDark } = useBrand();
  const logoSize = variant === "mark" ? 32 : variant === "full" ? 56 : 104;

  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-3 leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm",
        className
      )}
    >
      {logo && (
        <Image
          src={logo.url}
          alt={logo.alt || brandName}
          width={logo.width || logoSize}
          height={logo.height || logoSize}
          className={cn("shrink-0 object-contain", logoDark && "dark:hidden")}
          style={{ height: logoSize, width: "auto" }}
          priority
        />
      )}
      {logoDark && (
        <Image
          src={logoDark.url}
          alt={logoDark.alt || brandName}
          width={logoDark.width || logoSize}
          height={logoDark.height || logoSize}
          className={cn("shrink-0 object-contain", logo && "hidden dark:block")}
          style={{ height: logoSize, width: "auto" }}
          priority
        />
      )}
      <span className="inline-flex flex-col leading-none">
        <span
          className={
            variant === "footer"
              ? "font-display text-5xl font-bold tracking-tight text-foreground sm:text-6xl"
              : variant === "full"
                ? "font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
                : "font-display text-xl font-bold tracking-tight text-foreground"
          }
        >
          {brandName}
        </span>
        {variant === "full" && <span className="mt-2 text-sm font-normal text-muted-foreground">{tagline}</span>}
      </span>
    </Link>
  );
}
