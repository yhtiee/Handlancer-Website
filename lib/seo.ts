/**
 * Per-page metadata builder.
 *
 * Next merges metadata from layouts and pages **shallowly** — a nested object
 * like `openGraph` defined in the root layout is *replaced* wholesale by any
 * segment that redefines it, not merged into. So a page that sets only
 * `openGraph.url` would silently drop siteName, locale and type.
 *
 * Every route therefore goes through this one builder, which emits a complete
 * block. The root layout deliberately does NOT set `alternates`: an inherited
 * `canonical: '/'` would point every sub-page at the homepage, which is the
 * fastest way to get a whole new section dropped from the index.
 *
 * Paths stay relative on purpose. `metadataBase` (app/layout.tsx) resolves them,
 * so the production host is configured in exactly one place.
 */

import type { Metadata } from 'next';
import { SITE, SITE_URL } from '@/lib/site';

export type PageSeo = {
  /** Route path with a leading slash. '/' for the homepage. */
  path: string;
  title: string;
  description: string;
  /** Skip the '%s | HandLancer' title template (the homepage sets its own). */
  absoluteTitle?: boolean;
  /** Keep the page out of the index until it has genuinely unique content. */
  noindex?: boolean;
};

/** Absolute URL for a route path — for sitemaps and JSON-LD, which cannot use
 *  metadataBase resolution. */
export function canonicalUrl(path: string): string {
  if (!path.startsWith('/')) throw new Error(`canonicalUrl needs a rooted path, got "${path}"`);
  return path === '/' ? SITE_URL : `${SITE_URL}${path.replace(/\/$/, '')}`;
}

export function buildMetadata({
  path,
  title,
  description,
  absoluteTitle,
  noindex,
}: PageSeo): Metadata {
  // What the social card shows: the template only applies to <title>.
  const socialTitle = absoluteTitle ? title : `${title} | ${SITE.name}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'en_NG',
      siteName: SITE.name,
      url: path,
      title: socialTitle,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
    },
    robots: noindex
      ? { index: false, follow: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
  };
}
