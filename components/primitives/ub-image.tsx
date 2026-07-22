"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";

import { cn } from "@/lib/utils";

export type UbImageVariant = "hero" | "cover" | "thumbnail" | "gallery" | "og";

const variantAspect: Record<UbImageVariant, string> = {
  hero: "aspect-[16/9]",
  cover: "aspect-[4/3]",
  thumbnail: "aspect-square",
  gallery: "aspect-[4/3]",
  og: "aspect-[1200/630]",
};

export interface UbImageProps extends Omit<ImageProps, "src" | "alt"> {
  /**
   * Accepts a plain URL today. Once `lib/image/resolve-image.ts` builds real
   * ImageKit transform URLs (Content/Image data-layer phase), callers pass
   * `resolveImage(asset, variant)` output here instead — this component's
   * contract (src + optional blurDataURL) does not need to change either
   * way, which is the whole point of keeping image resolution out of the
   * component layer.
   */
  src: string;
  alt: string;
  variant?: UbImageVariant;
  /** Rounds the image container — use design-token radii only. */
  rounded?: "none" | "md" | "lg" | "xl" | "full";
  containerClassName?: string;
}

const roundedMap = {
  none: "rounded-none",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
} as const;

/**
 * UbImage — the ONLY way an image renders anywhere in the app. Wraps
 * next/image with a design-system-consistent aspect ratio per variant, a
 * skeleton-style loading state, and graceful fallback on error. Every trip
 * image (hero/cover/thumbnail/gallery/og) goes through this component so
 * that changing loading behavior or swapping providers happens in one place.
 */
export function UbImage({
  src,
  alt,
  variant = "cover",
  rounded = "md",
  fill = true,
  className,
  containerClassName,
  placeholder,
  blurDataURL,
  ...props
}: UbImageProps) {
  const [errored, setErrored] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted",
        variantAspect[variant],
        roundedMap[rounded],
        containerClassName
      )}
    >
      {!errored ? (
        <Image
          src={src}
          alt={alt}
          fill={fill}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          placeholder={blurDataURL ? "blur" : placeholder}
          blurDataURL={blurDataURL}
          className={cn(
            "object-cover transition-opacity duration-ub-slow",
            loaded ? "opacity-100" : "opacity-0",
            className
          )}
          {...props}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
          Image unavailable
        </div>
      )}
      {!loaded && !errored && <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden="true" />}
    </div>
  );
}
