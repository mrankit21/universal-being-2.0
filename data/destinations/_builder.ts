import type { Destination } from "@/types/destination";
import type { ImageAsset } from "@/types/trip";
import type { ThemeKey } from "@/types/theme";
import { placeholderImage } from "@/lib/image/resolve-image";

function buildGallery(name: string, count = 6): ImageAsset[] {
  return Array.from({ length: count }, (_, i) => placeholderImage(`${name} — photo ${i + 1}`));
}

/**
 * buildDestination — same role as `data/trips/_builder.ts`, one level up:
 * keeps every destination document structurally identical for the eventual
 * Admin Panel Destination editor.
 */
export interface DestinationSeedInput {
  slug: string;
  name: string;
  region: string;
  state: string;
  themeKey: ThemeKey;
  tagline: string;
  shortDescription: string;
  longDescription: string;
  bestSeason: string[];
  altitude?: string;
  highlights: string[];
}

export function buildDestination(input: DestinationSeedInput): Destination {
  const now = "2026-07-11T00:00:00.000Z";
  return {
    id: input.slug,
    slug: input.slug,
    name: input.name,
    region: input.region,
    state: input.state,
    themeKey: input.themeKey,
    tagline: input.tagline,
    shortDescription: input.shortDescription,
    longDescription: input.longDescription,
    heroImage: placeholderImage(`${input.name} hero photo`, 1920, 1080),
    coverImage: placeholderImage(`${input.name} cover photo`, 1200, 900),
    thumbnail: placeholderImage(`${input.name} thumbnail`, 800, 800),
    gallery: buildGallery(input.name),
    bestSeason: input.bestSeason,
    altitude: input.altitude,
    highlights: input.highlights,
    pointsOfInterest: [],
    featured: false,
    homepageVisible: true,
    tripAssignments: [],
    status: "published",
    seo: {
      title: `${input.name} Trips | Universal Being`,
      description: input.shortDescription,
    },
    isPlaceholderContent: true,
    createdAt: now,
    updatedAt: now,
  };
}
