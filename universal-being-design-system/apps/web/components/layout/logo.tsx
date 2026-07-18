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
 * uploaded logo image now come from `useBrand()` (DB-first, via
 * `BrandProvider` in app/layout.tsx) instead of the static site-config
 * import, so Admin → Settings → Brand Assets actually reaches the live
 * site. When no real logo has been uploaded yet (`logo` is null —
 * placeholder/empty), only the text wordmark renders, same as before.
 */
export function Logo({ className, variant = "mark" }: LogoProps) {
  const { brandName, tagline, logo } = useBrand();
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
          className="shrink-0 object-contain"
          style={{ height: logoSize, width: "auto" }}
          priority
        />
      )}
      <span className="inline-flex flex-col leading-none">
        <span
          className={
            variant === "footer"
              ? "font-display text-5xl font-semibold tracking-tight text-foreground sm:text-6xl"
              : variant === "full"
                ? "font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
                : "font-display text-xl font-semibold tracking-tight text-foreground"
          }
        >
          {brandName}
        </span>
        {variant === "full" && <span className="mt-2 text-sm font-normal text-muted-foreground">{tagline}</span>}
      </span>
    </Link>
  );
}
