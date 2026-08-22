/**
 * The routes that exist AND deserve to be in the index.
 *
 * `app/sitemap.ts` is generated from this list, and the page files are
 * generated from the same underlying data (CATEGORIES, cities, guides), so the
 * sitemap cannot drift away from what the site actually serves. Never add a URL
 * here by hand that no route renders.
 *
 * A route belongs here only if it is genuinely indexable. Anything rendering
 * `noindex` — a city x trade page still waiting on real local content, for
 * example — must be left out.
 */

import type { MetadataRoute } from 'next';

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

export type SiteRoute = {
  /** Rooted path, matching the route segment on disk. */
  path: string;
  changeFrequency: ChangeFrequency;
  /** 1 for the homepage, descending by distance from it. */
  priority: number;
  /** Content date where one exists (guides). Falls back to build time. */
  lastModified?: Date;
};

export function siteRoutes(): SiteRoute[] {
  return [{ path: '/', changeFrequency: 'weekly', priority: 1 }];
}
