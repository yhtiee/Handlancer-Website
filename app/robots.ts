import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/*
 * `host` is deliberately absent: it is a non-standard directive that only
 * Yandex ever honoured, and the canonical tag already declares the www host.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Server actions and any future route handlers have nothing to crawl.
        disallow: '/api/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
