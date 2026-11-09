import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MIN_WITHDRAWAL, topUpCharge, transferFee } from '@/lib/app/domain/fees';

test('a top-up charges enough that the fee is covered', () => {
  assert.equal(topUpCharge(5000), 5110);
  for (const credit of [100, 999, 12345, 1000000]) {
    const charge = topUpCharge(credit);
    assert.ok(charge * (1 - 0.0215) >= credit, String(credit));
  }
});

test('transfer fees follow the published bands, with VAT', () => {
  assert.equal(transferFee(5000), 10.75);
  assert.equal(transferFee(5001), 26.88);
  assert.equal(transferFee(50000), 26.88);
  assert.equal(transferFee(50001), 53.75);
});

test('the smallest withdrawal still clears the minimum transfer', () => {
  assert.ok(MIN_WITHDRAWAL - transferFee(MIN_WITHDRAWAL) >= 100);
});
