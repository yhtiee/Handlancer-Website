import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mainServiceLabel, withoutOther } from '@/lib/app/domain/trades';

test('a service filed under Other is listed as that service', () => {
  assert.equal(mainServiceLabel(['other', 'Interior design']), 'Interior design');
  assert.equal(mainServiceLabel(['other', 'Baking & pastries', 'Hairdressing & braiding']), 'Baking & pastries');
});

test('a real trade is shown as the trade', () => {
  assert.equal(mainServiceLabel(['plumbing', 'Borehole drilling']), 'Plumbing');
});

test('Other first does not hide a real trade picked later', () => {
  assert.equal(mainServiceLabel(['other', 'plumbing', 'Interior design']), 'Plumbing');
});

test('older profiles with free-text Other are handled too', () => {
  assert.equal(mainServiceLabel(['Other', 'Tiling']), 'Tiling');
});

test('never answers Other, even when it is all there is', () => {
  assert.equal(mainServiceLabel(['other']), undefined);
  assert.equal(mainServiceLabel([]), undefined);
  assert.equal(mainServiceLabel(null), undefined);
});

test('withoutOther keeps everything else, in order', () => {
  assert.deepEqual(withoutOther(['other', 'Interior design', 'plumbing']), ['Interior design', 'plumbing']);
});
