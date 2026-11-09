import assert from 'node:assert/strict';
import { test } from 'node:test';

import { pinProblem } from '@/lib/app/domain/pin-rules';

test('accepts an ordinary PIN', () => {
  for (const pin of ['2580', '1379', '0852', '7890', '1123']) assert.equal(pinProblem(pin), null, pin);
});

test('says when the PIN is the wrong length or not digits', () => {
  for (const pin of ['', '123', '12345', '12a4']) assert.match(pinProblem(pin)!, /exactly 4 digits/, pin);
});

test('refuses every repeated digit, and says so', () => {
  for (let d = 0; d <= 9; d++) assert.match(pinProblem(String(d).repeat(4))!, /repeated/);
});

test('refuses runs in both directions, and says so', () => {
  for (const pin of ['0123', '1234', '2345', '3456', '4567', '5678', '6789', '9876', '8765', '7654', '6543', '5432', '4321', '3210']) {
    assert.match(pinProblem(pin)!, /in order/, pin);
  }
});
