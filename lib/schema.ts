/**
 * JSON-LD builders.
 *
 * Ground rule: **every node here must describe something a human can see on the
 * page that emits it.** Schema that describes content the page does not show is
 * what structured-data manual actions are for.
 *
 * Split of responsibility:
 *   app/layout.tsx  Organization + WebSite — true on every route.
 *   app/page.tsx    FAQPage + ItemList — the visible accordion and card grid.
 *   trade pages     Service + BreadcrumbList.
 *
 * Nodes are cross-referenced by `@id` rather than repeated, so the Organization
 * is described once and pointed at from everywhere else.
 */

import { SITE, SITE_URL, SOCIALS, CATEGORIES, type Category, type Faq } from '@/lib/site';
import { canonicalUrl } from '@/lib/seo';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** One node in the graph. Values are JSON-serialisable by construction. */
export type SchemaNode = { '@type': string } & Record<string, unknown>;

export type JsonLdGraph = {
  '@context': 'https://schema.org';
  '@graph': SchemaNode[];
};

/** A crumb in the trail. `path` is a rooted route path, not a URL. */
export type Crumb = { name: string; path: string };

/* ------------------------------------------------------------------ */
/* Stable @ids                                                         */
/* ------------------------------------------------------------------ */

export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * Public profiles for the Organization's `sameAs`.
 *
 * Derived from SOCIALS in lib/site.ts, which is also what the footer renders —
 * so every profile claimed here is one a crawler can find linked on the page,
 * which is the whole basis on which `sameAs` gets believed. Add accounts there,
 * not here. Left empty the property is omitted entirely rather than emitted as
 * `[]`, because an empty array is a claim of "no profiles".
 */
export const SOCIAL_PROFILES: readonly string[] = SOCIALS.map((s) => s.url);

/* ------------------------------------------------------------------ */
/* Site-wide nodes                                                     */
/* ------------------------------------------------------------------ */

export function organizationSchema(): SchemaNode {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE_URL,
    description: SITE.description,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/brand/logo.png`,
      width: 512,
      height: 512,
    },
    email: SITE.email,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: SITE.email,
      areaServed: 'NG',
      availableLanguage: ['en'],
    },
    areaServed: { '@type': 'Country', name: SITE.country },
    knowsAbout: CATEGORIES.map((c) => c.label),
    ...(SOCIAL_PROFILES.length > 0 ? { sameAs: [...SOCIAL_PROFILES] } : {}),
  };
}

export function websiteSchema(): SchemaNode {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: SITE.name,
    description: SITE.description,
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-NG',
  };
}

/* ------------------------------------------------------------------ */
/* Page-level nodes                                                    */
/* ------------------------------------------------------------------ */

/**
 * Built from the same `Faq[]` the accordion renders. The accordion collapses
 * with a grid-row transition and never unmounts its answers, so the text here
 * is byte-identical to the text on the page.
 */
export function faqPageSchema(faqs: Faq[], path: string): SchemaNode {
  return {
    '@type': 'FAQPage',
    '@id': `${canonicalUrl(path)}#faq`,
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/**
 * The 12 visible category cards on the landing page.
 *
 * `areaServed` is the country, not a city list: the page claims nationwide
 * coverage in prose, and enumerating twelve cities per service would be twelve
 * area claims the homepage does not actually make. Per-city claims belong on
 * the city pages that carry real local content.
 */
export function serviceListSchema(path: string): SchemaNode {
  return {
    '@type': 'ItemList',
    '@id': `${canonicalUrl(path)}#services`,
    name: 'Home services available on HandLancer',
    itemListElement: CATEGORIES.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Service',
        name: c.label,
        description: c.blurb,
        serviceType: c.label,
        url: canonicalUrl(`/services/${c.slug}`),
        provider: { '@id': ORG_ID },
        areaServed: { '@type': 'Country', name: SITE.country },
      },
    })),
  };
}

/**
 * A single trade page's Service node.
 *
 * `cities` must be the cities the page actually names in its copy — pass the
 * ones it lists, not every city in the database.
 */
export function serviceSchema({
  category,
  path,
  cities,
}: {
  category: Category;
  path: string;
  cities: readonly string[];
}): SchemaNode {
  return {
    '@type': 'Service',
    '@id': `${canonicalUrl(path)}#service`,
    name: category.label,
    serviceType: category.label,
    description: category.blurb,
    url: canonicalUrl(path),
    provider: { '@id': ORG_ID },
    areaServed:
      cities.length > 0
        ? cities.map((city) => ({ '@type': 'City', name: city }))
        : { '@type': 'Country', name: SITE.country },
  };
}

/**
 * Breadcrumbs for a non-home page. Always pass the full trail including Home,
 * e.g. [{ name: 'Home', path: '/' }, { name: 'Plumbing', path: '/services/plumbing' }].
 */
export function breadcrumbSchema(trail: Crumb[]): SchemaNode {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${canonicalUrl(trail[trail.length - 1].path)}#breadcrumb`,
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: canonicalUrl(crumb.path),
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Graph assembly                                                      */
/* ------------------------------------------------------------------ */

export function jsonLdGraph(...nodes: SchemaNode[]): JsonLdGraph {
  return { '@context': 'https://schema.org', '@graph': nodes };
}
