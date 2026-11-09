import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatRateInput, parseRateInput, rateUnitLabel } from '@/lib/app/domain/rates';

test('a 24-hour rate says so', () => {
  assert.equal(rateUnitLabel('24_hours'), 'per 24 hours');
});

test('anything saved before units existed reads as hourly', () => {
  assert.equal(rateUnitLabel(null), 'per hour');
  assert.equal(rateUnitLabel(undefined), 'per hour');
  assert.equal(rateUnitLabel('nonsense'), 'per hour');
});

test('the amount survives a trip through the field', () => {
  assert.equal(formatRateInput(20000), '20,000');
  assert.equal(parseRateInput('20,000'), 20000);
});

test('blank or zero means priced by quote', () => {
  assert.equal(formatRateInput(null), '');
  assert.equal(parseRateInput(''), null);
  assert.equal(parseRateInput('0'), null);
});
