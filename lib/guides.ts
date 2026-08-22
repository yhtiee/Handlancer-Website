/**
 * Guides — the written-content pipeline.
 *
 * No MDX, and therefore no new dependency: the repo ships with three runtime
 * dependencies (next, react, react-dom) and this keeps it that way. A guide is
 * one typed module exporting `meta` and `body`, which gives us what MDX
 * frontmatter would have given us plus compile-time checking of every field.
 *
 * ---------------------------------------------------------------------------
 * TO SHIP AN ARTICLE
 * ---------------------------------------------------------------------------
 *   1. Add content/guides/<slug>.ts, default-exporting a Guide.
 *   2. Add one import line to GUIDES below.
 * That is the whole process. Routing, metadata, the index page, breadcrumbs,
 * the sitemap and internal linking all read from here.
 *
 * (A filesystem scan would remove step 2, but it would also mean reading the
 * disk at build time from a route that is otherwise fully static. One import
 * line is the cheaper trade.)
 */

import type { ReactNode } from 'react';

export type GuideMeta = {
  slug: string;
  title: string;
  description: string;
  /** ISO date, e.g. '2026-08-22'. */
  published: string;
  /** ISO date. Set equal to `published` until the piece is revised. */
  updated: string;
  author: string;
  /** The one phrase this guide is written to answer. */
  targetKeyword: string;
  /** Category.slug this guide belongs to — drives the link back to the trade page. */
  trade?: string;
  /** City slug, when the guide is local. */
  city?: string;
};

/** An optional costed table. Rendered as a real table, and only when present. */
export type CostTable = {
  caption: string;
  /** Column headers. First column is the row label. */
  columns: string[];
  rows: string[][];
  /** Shown under the table — use it to say what the figures do and do not include. */
  note?: string;
};

export type GuideBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: ReactNode }
  | { kind: 'list'; items: ReactNode[] }
  | { kind: 'callout'; title: string; text: ReactNode }
  | { kind: 'costTable'; table: CostTable };

export type Guide = {
  meta: GuideMeta;
  /** Standfirst, set in the serif lede style. */
  lede: string;
  body: GuideBlock[];
};

/* ------------------------------------------------------------------ */
/* Registry                                                            */
/* ------------------------------------------------------------------ */

import escrowGuide from '@/content/guides/how-escrow-protects-you';
import plumberCostGuide from '@/content/guides/plumber-cost-uyo';
import quoteGuide from '@/content/guides/how-to-read-an-itemised-quote';

/** Newest first — the index page renders them in this order. */
export const GUIDES: Guide[] = [escrowGuide, plumberCostGuide, quoteGuide];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.meta.slug === slug);
}

/** Guides that link back to a given trade, for the trade page's related list. */
export function guidesForTrade(tradeSlug: string): Guide[] {
  return GUIDES.filter((g) => g.meta.trade === tradeSlug);
}

export function guidesForCity(citySlug: string): Guide[] {
  return GUIDES.filter((g) => g.meta.city === citySlug);
}

/** Most recent `updated` date across all guides — used for the index's lastModified. */
export function guidesLastUpdated(): Date {
  const times = GUIDES.map((g) => new Date(g.meta.updated).getTime());
  return new Date(Math.max(...times));
}
