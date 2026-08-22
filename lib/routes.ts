/**
 * The routes that exist AND deserve to be in the index.
 *
 * `app/sitemap.ts` is generated from this list, and every page is generated
 * from the same underlying data (CATEGORIES, CITY_PAGES, GUIDES), so the
 * sitemap cannot drift away from what the site actually serves. Never add a URL
 * here by hand.
 *
 * A route belongs here only if it is genuinely indexable. City × trade pages
 * that have not cleared `isIndexable()` render `noindex` and are excluded, which
 * is why this reads `indexableCityTradePairs()` rather than every generated
 * page.
 */

import type { MetadataRoute } from 'next';
import { CATEGORIES } from '@/lib/site';
import { CITY_PAGES, indexableCityTradePairs } from '@/lib/cities';
import { allPagedServices } from '@/lib/services';
import { GUIDES, guidesLastUpdated } from '@/lib/guides';

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
  return [
    { path: '/', changeFrequency: 'weekly', priority: 1 },

    /* Hubs */
    { path: '/services', changeFrequency: 'monthly', priority: 0.9 },
    { path: '/for-artisans', changeFrequency: 'monthly', priority: 0.9 },
    { path: '/guides', changeFrequency: 'weekly', priority: 0.8, lastModified: guidesLastUpdated() },

    /* Trade pages */
    ...CATEGORIES.map(
      (c): SiteRoute => ({
        path: `/services/${c.slug}`,
        changeFrequency: 'monthly',
        priority: 0.8,
      }),
    ),

    /* Individual services — only those that cleared hasOwnPage() */
    ...allPagedServices().map((s): SiteRoute => {
      const category = CATEGORIES.find((c) => c.id === s.category);
      return {
        path: `/services/${category?.slug ?? ''}/${s.slug}`,
        changeFrequency: 'monthly',
        priority: 0.7,
      };
    }),

    /* City hubs */
    ...CITY_PAGES.map(
      (city): SiteRoute => ({
        path: `/${city.slug}`,
        changeFrequency: 'monthly',
        priority: 0.8,
      }),
    ),

    /* City × trade — only the pairs that cleared the content gate */
    ...indexableCityTradePairs().map(
      ({ city, content }): SiteRoute => ({
        path: `/${city.slug}/${content.trade}`,
        changeFrequency: 'monthly',
        priority: 0.7,
      }),
    ),

    /* Guides */
    ...GUIDES.map(
      (g): SiteRoute => ({
        path: `/guides/${g.meta.slug}`,
        changeFrequency: 'yearly',
        priority: 0.6,
        lastModified: new Date(g.meta.updated),
      }),
    ),

    /* Company */
    { path: '/about', changeFrequency: 'yearly', priority: 0.5 },
    { path: '/contact', changeFrequency: 'yearly', priority: 0.5 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  ];
}
