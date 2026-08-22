import type { MetadataRoute } from 'next';
import { canonicalUrl } from '@/lib/seo';
import { siteRoutes } from '@/lib/routes';

/*
 * Generated from lib/routes.ts, which is generated from the same data the pages
 * are. The previous version listed seven `#fragment` URLs; search engines drop
 * the fragment, so it declared the homepage eight times over.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const builtAt = new Date();

  return siteRoutes().map((route) => ({
    url: canonicalUrl(route.path),
    lastModified: route.lastModified ?? builtAt,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
