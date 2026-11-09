import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildMetadata } from '@/lib/seo';

test('every page built here carries a share image for both card types', () => {
  const meta = buildMetadata({ path: '/services', title: 'Services', description: 'All of them.' });
  const og = meta.openGraph?.images as { url: string; width: number; height: number }[];
  assert.equal(og[0].url, '/opengraph-image.png');
  assert.equal(og[0].width, 1200);
  assert.equal(og[0].height, 630);
  assert.ok(meta.twitter?.images);
});

test('a page with its own card uses it for both', () => {
  const shareImage = { url: '/artisans/x/opengraph-image', alt: 'Hire Ada' };
  const meta = buildMetadata({ path: '/artisans/x', title: 'Ada', description: 'Hire Ada.', shareImage });
  const og = meta.openGraph?.images as { url: string; alt: string }[];
  const twitter = meta.twitter?.images as { url: string }[];
  assert.equal(og[0].url, shareImage.url);
  assert.equal(og[0].alt, 'Hire Ada');
  assert.equal(twitter[0].url, shareImage.url);
});
