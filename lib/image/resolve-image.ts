import type { ImageAsset } from "@/types/trip";
import type { UbImageVariant } from "@/components/primitives/ub-image";

/**
 * resolveImage — Architecture §13's "single resolver, single render path"
 * rule. Today this just passes the asset through; when ImageKit transform
 * URLs are wired up, THIS function's internals change to build them and
 * every caller (TripHero, TripCard, TripGallery, admin previews) keeps
 * working unchanged.
 */
export interface ResolvedImage {
  src: string;
  alt: string;
  isPlaceholder: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function resolveImage(asset: ImageAsset, _variant: UbImageVariant): ResolvedImage {
  return {
    src: asset.url,
    alt: asset.alt,
    isPlaceholder: asset.isPlaceholder || !asset.url,
  };
}

/** Convenience constructor for seed/placeholder data — keeps every trip/destination
 * data file from repeating the same five-field object literal by hand. */
export function placeholderImage(alt: string, width = 1600, height = 1200): ImageAsset {
  return {
    provider: "placeholder",
    url: "",
    alt,
    width,
    height,
    isPlaceholder: true,
  };
}
