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
  /** A 1200×630 PNG of this page's own, in place of the site's card. */
  shareImage?: { url: string; alt: string };
};

/*
 * The site's share card. Needed explicitly: app/opengraph-image.png applies only
 * to the root segment, so a page that sets its own `openGraph` would otherwise
 * be posted with no image at all.
 */
const SHARE_IMAGE_ALT = 'HandLancer — hire trusted artisans in Nigeria and hold the money in escrow until the work is done.';
const SHARE_IMAGE_SIZE = { width: 1200, height: 630, type: 'image/png' };

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
  shareImage,
}: PageSeo): Metadata {
  // What the social card shows: the template only applies to <title>.
  const socialTitle = absoluteTitle ? title : `${title} | ${SITE.name}`;
  const ogImage = { ...SHARE_IMAGE_SIZE, ...(shareImage ?? { url: '/opengraph-image.png', alt: SHARE_IMAGE_ALT }) };
  const twitterImage = { ...SHARE_IMAGE_SIZE, ...(shareImage ?? { url: '/twitter-image.png', alt: SHARE_IMAGE_ALT }) };

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
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [twitterImage],
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
