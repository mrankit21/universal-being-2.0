import type { ReactNode } from "react";
import { ImageOff } from "lucide-react";

import type { ImageAsset } from "@/types/trip";
import type { ThemeConfig } from "@/types/theme";
import type { UbImageVariant } from "@/components/primitives/ub-image";
import { UbImage } from "@/components/primitives/ub-image";
import { ThemeBackground } from "@/components/theme/theme-background";
import { resolveImage } from "@/lib/image/resolve-image";
import { cn } from "@/lib/utils";

export interface TripImageProps {
  asset: ImageAsset;
  /** Optional dedicated crop for narrow viewports — falls back to `asset`
   * when not set/placeholder. See `Trip.heroImageMobile` for the rationale. */
  mobileAsset?: ImageAsset;
  theme: ThemeConfig;
  variant?: UbImageVariant;
  className?: string;
  containerClassName?: string;
  /** Sizes attribute passed to next/image; required whenever `fill` renders
   * at less than full viewport width. */
  sizes?: string;
  priority?: boolean;
  /** Absolutely-positioned overlay content (badges/tags) — works whether the
   * asset renders as a real photo or a themed placeholder. */
  children?: ReactNode;
}

const variantAspect: Record<UbImageVariant, string> = {
  hero: "aspect-[16/9]",
  cover: "aspect-[4/3]",
  thumbnail: "aspect-square",
  gallery: "aspect-[4/3]",
  og: "aspect-[1200/630]",
};

/**
 * TripImage — the ONLY way trip/destination imagery renders anywhere in the
 * Trip Management System (mirrors `UbImage`'s "only way an image renders"
 * contract, scoped to the Trip/Destination domain). Real assets go through
 * `UbImage`; placeholder assets (no real photography uploaded yet) render a
 * themed gradient panel via `ThemeBackground` instead of a fake stock photo —
 * same pattern `data/home/featured-trips.ts` already established. Swapping a
 * trip's `isPlaceholder` flag to false via the Admin Panel is the only thing
 * that ever needs to change to show a real photo; this component doesn't.
 */
export function TripImage({
  asset,
  mobileAsset,
  theme,
  variant = "cover",
  className,
  containerClassName,
  sizes,
  priority,
  children,
}: TripImageProps) {
  const resolved = resolveImage(asset, variant);
  const resolvedMobile = mobileAsset ? resolveImage(mobileAsset, variant) : undefined;

  if (resolved.isPlaceholder) {
    return (
      <div className="relative">
        <ThemeBackground
          theme={theme}
          area={variant === "hero" ? "hero" : "section"}
          className={cn(variantAspect[variant], "rounded-md", containerClassName)}
        >
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center">
            <ImageOff className="size-6 text-foreground/40" aria-hidden="true" />
            <span className="rounded-full bg-background/70 px-3 py-1 text-xs font-medium text-foreground/70 backdrop-blur-sm">
              Photo coming soon
            </span>
          </div>
        </ThemeBackground>
        {children}
      </div>
    );
  }

  if (resolvedMobile && !resolvedMobile.isPlaceholder) {
    return (
      <div className="relative">
        <UbImage
          src={resolvedMobile.src}
          alt={resolvedMobile.alt}
          variant={variant}
          className={className}
          containerClassName={cn(containerClassName, "md:hidden")}
          sizes={sizes}
          priority={priority}
        />
        <UbImage
          src={resolved.src}
          alt={resolved.alt}
          variant={variant}
          className={className}
          containerClassName={cn(containerClassName, "hidden md:block")}
          sizes={sizes}
          priority={priority}
        />
        {children}
      </div>
    );
  }

  return (
    <div className="relative">
      <UbImage
        src={resolved.src}
        alt={resolved.alt}
        variant={variant}
        className={className}
        containerClassName={containerClassName}
        sizes={sizes}
        priority={priority}
      />
      {children}
    </div>
  );
}
