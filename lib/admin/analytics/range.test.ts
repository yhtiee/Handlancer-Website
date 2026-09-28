import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatDelta, formatValue } from '@/lib/admin/analytics/format';
import { bucketStart, bucketStarts, parseRangeParams, rangeToSearch, resolveRange } from '@/lib/admin/analytics/range';

// 28 Sept 2026, 10:00 in Lagos (09:00 UTC).
const NOW = new Date('2026-09-28T09:00:00Z');
const DAY = 86_400_000;

test('30-day range ends at the start of tomorrow (Lagos) and spans exactly 30 days', () => {
  const r = resolveRange({ range: '30d' }, NOW);
  assert.equal(r.to, '2026-09-28T23:00:00.000Z'); // 29 Sept 00:00 Lagos
  assert.equal(new Date(r.to).getTime() - new Date(r.from).getTime(), 30 * DAY);
  assert.equal(r.interval, 'day');
});

test('the comparison period is equally long and ends where the range starts', () => {
  const r = resolveRange({ range: '90d' }, NOW);
  assert.equal(r.prevTo, r.from);
  assert.equal(new Date(r.prevTo).getTime() - new Date(r.prevFrom).getTime(), 90 * DAY);
  assert.equal(r.interval, 'week');
});

test('year to date starts on 1 Jan, Lagos midnight', () => {
  const r = resolveRange({ range: 'ytd' }, NOW);
  assert.equal(r.from, '2025-12-31T23:00:00.000Z');
  assert.equal(r.interval, 'month');
});

test('custom range includes both end dates and is clipped to today', () => {
  const r = resolveRange({ range: 'custom', from: '2026-09-01', to: '2026-09-07' }, NOW);
  assert.equal(r.from, '2026-08-31T23:00:00.000Z');
  assert.equal(r.to, '2026-09-07T23:00:00.000Z');
  const future = resolveRange({ range: 'custom', from: '2026-09-20', to: '2026-12-31' }, NOW);
  assert.equal(future.to, '2026-09-28T23:00:00.000Z');
});

test('daily buckets are refused for spans that would be noise', () => {
  assert.equal(resolveRange({ range: '12m', interval: 'day' }, NOW).interval, 'week');
  assert.equal(resolveRange({ range: '7d', interval: 'month' }, NOW).interval, 'month');
});

test('weeks start on Monday and months on the 1st, in Lagos time', () => {
  // Sunday 27 Sept 23:30 Lagos is still in the week of Monday 21 Sept.
  const lateSunday = new Date('2026-09-27T22:30:00Z');
  assert.equal(bucketStart(lateSunday, 'week').toISOString(), '2026-09-20T23:00:00.000Z');
  // 00:30 on 1 Oct Lagos is 23:30 on 30 Sept UTC — but it belongs to October.
  const earlyOctober = new Date('2026-09-30T23:30:00Z');
  assert.equal(bucketStart(earlyOctober, 'month').toISOString(), '2026-09-30T23:00:00.000Z');
});

test('bucket list covers the range with no gaps', () => {
  const r = resolveRange({ range: '7d' }, NOW);
  const starts = bucketStarts(r.from, r.to, 'day');
  assert.equal(starts.length, 7);
  assert.equal(starts[0], r.from);
  for (let i = 1; i < starts.length; i++) assert.equal(new Date(starts[i]).getTime() - new Date(starts[i - 1]).getTime(), DAY);
});

test('malformed URL params fall back to 30 days; valid ones round-trip', () => {
  assert.deepEqual(parseRangeParams({ range: 'nonsense' }), { range: '30d' });
  assert.deepEqual(parseRangeParams({ range: 'custom', from: '2026-09-10', to: '2026-09-01' }), { range: '30d' });
  const p = parseRangeParams({ range: 'custom', from: '2026-09-01', to: '2026-09-10', interval: 'week' });
  assert.equal(rangeToSearch(p), '?range=custom&from=2026-09-01&to=2026-09-10&interval=week');
  assert.deepEqual(parseRangeParams(new URLSearchParams(rangeToSearch(p).slice(1))), p);
});

test('deltas: rates move in points, others in percent, "down is good" flips the verdict', () => {
  assert.deepEqual(formatDelta(0.12, 0.1, 'percent', 'up'), { text: '+2.0 pts', direction: 'up', good: true });
  assert.deepEqual(formatDelta(0.12, 0.1, 'percent', 'down'), { text: '+2.0 pts', direction: 'up', good: false });
  assert.equal(formatDelta(150, 100, 'naira', 'up')?.text, '+50%');
  assert.equal(formatDelta(5, 0, 'count', 'up')?.text, 'New');
  assert.equal(formatDelta(null, 3, 'count', 'up'), null);
});

test('values: compact naira only when large, durations pick a sensible unit', () => {
  assert.equal(formatValue(2_500_000, 'naira', true).replace(/\s/g, ''), '₦2.5M');
  assert.equal(formatValue(0.5, 'hours'), '30 min');
  assert.equal(formatValue(5, 'hours'), '5.0 h');
  assert.equal(formatValue(72, 'hours'), '3.0 d');
  assert.equal(formatValue(null, 'count'), '—');
});
