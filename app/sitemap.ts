import type { MetadataRoute } from "next";

import { getTripSlugs } from "@/lib/api/trips";
import { getDestinationSlugs } from "@/lib/api/destinations";
import { getSiteUrl } from "@/lib/seo/site-url";

/**
 * Native Next.js 15 sitemap (app/sitemap.ts -> MetadataRoute.Sitemap).
 * Static routes plus every published trip/destination, sourced from the
 * same `lib/api/*` slug helpers the route files themselves use for
 * `generateStaticParams`, so this stays in sync with whatever's actually
 * published (MongoDB when configured, the static seed registry otherwise).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  const [tripSlugs, destinationSlugs] = await Promise.all([
    getTripSlugs(),
    getDestinationSlugs(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/trips`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/destinations`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const tripRoutes: MetadataRoute.Sitemap = tripSlugs.map((slug) => ({
    url: `${baseUrl}/trips/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const destinationRoutes: MetadataRoute.Sitemap = destinationSlugs.map((slug) => ({
    url: `${baseUrl}/destinations/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...tripRoutes, ...destinationRoutes];
}
