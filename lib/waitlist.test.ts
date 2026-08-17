/**
 * Run with:  node --experimental-strip-types lib/waitlist.test.ts
 * No test runner on purpose — this is the only pure logic on the site, and the
 * form's correctness rests on it.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { toRow, validate, type WaitlistFields } from '@/lib/waitlist';

const base: WaitlistFields = {
  role: 'user',
  name: 'Chidi Okafor',
  email: 'chidi@example.com',
  phone: '',
  city: 'Lagos',
  category: 'plumbing',
  years: '',
  referral: '',
};

const f = (over: Partial<WaitlistFields> = {}): WaitlistFields => ({ ...base, ...over });

test('accepts a minimal valid customer', () => {
  assert.deepEqual(validate(f()), {});
});

test('rejects a short name and an over-long one', () => {
  assert.ok(validate(f({ name: 'X' })).name);
  assert.ok(validate(f({ name: 'a'.repeat(81) })).name);
  assert.equal(validate(f({ name: 'Ada' })).name, undefined);
});

test('email rules', () => {
  for (const bad of ['', 'nope', 'a@b', 'a@@b.com', 'a b@c.com', 'a@b.', '@b.com']) {
    assert.ok(validate(f({ email: bad })).email, `should reject ${JSON.stringify(bad)}`);
  }
  for (const good of ['a@b.com', 'first.last+tag@sub.domain.ng', 'x@y.co.uk']) {
    assert.equal(validate(f({ email: good })).email, undefined, `should accept ${good}`);
  }
});

test('phone is optional but validated when present', () => {
  assert.equal(validate(f({ phone: '' })).phone, undefined);
  for (const good of ['08031234567', '+234 803 123 4567', '0803 123-4567', '(0803) 1234567']) {
    assert.equal(validate(f({ phone: good })).phone, undefined, `should accept ${good}`);
  }
  for (const bad of ['abc', '123', 'call me', '(((((((', '1'.repeat(16)]) {
    assert.ok(validate(f({ phone: bad })).phone, `should reject ${bad}`);
  }
});

test('city is required', () => {
  assert.ok(validate(f({ city: '   ' })).city);
});

test('category must be a real category id', () => {
  assert.ok(validate(f({ category: '' })).category);
  assert.ok(validate(f({ category: 'not-a-category' })).category);
  assert.equal(validate(f({ category: 'ac' })).category, undefined);
});

test('category error wording differs by role', () => {
  assert.match(validate(f({ role: 'user', category: '' })).category!, /need help with/);
  assert.match(validate(f({ role: 'provider', category: '' })).category!, /main trade/);
});

test('years only applies to providers, and is bounded', () => {
  // ignored for customers even if nonsense
  assert.equal(validate(f({ role: 'user', years: 'banana' })).years, undefined);
  assert.equal(validate(f({ role: 'provider', years: '' })).years, undefined);
  assert.equal(validate(f({ role: 'provider', years: '0' })).years, undefined);
  assert.equal(validate(f({ role: 'provider', years: '60' })).years, undefined);
  for (const bad of ['-1', '61', '4.5', 'banana']) {
    assert.ok(validate(f({ role: 'provider', years: bad })).years, `should reject ${bad}`);
  }
});

test('toRow trims, lowercases email, and nulls empty optionals', () => {
  const row = toRow(
    f({ name: '  Ada Eze ', email: '  ADA@Example.COM ', phone: '  ', city: ' Abuja ', referral: '' }),
  );
  assert.equal(row.name, 'Ada Eze');
  assert.equal(row.email, 'ada@example.com');
  assert.equal(row.phone, null);
  assert.equal(row.city, 'Abuja');
  assert.equal(row.referral, null);
  assert.equal(row.years_experience, null);
});

test('toRow keeps provider years and drops them for customers', () => {
  assert.equal(toRow(f({ role: 'provider', years: '7' })).years_experience, 7);
  assert.equal(toRow(f({ role: 'user', years: '7' })).years_experience, null);
});
