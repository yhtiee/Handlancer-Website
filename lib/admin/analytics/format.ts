import type { ValueFormat } from '@/lib/admin/analytics/types';

/** Display formats for analytics values. Pure; used by charts, tiles and every export. */

const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });
const nairaCompact = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const count = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 });
const countCompact = new Intl.NumberFormat('en-NG', { notation: 'compact', maximumFractionDigits: 1 });
const pct = new Intl.NumberFormat('en-NG', { style: 'percent', maximumFractionDigits: 1 });

export function formatValue(v: number | null | undefined, format: ValueFormat, compact = false): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  switch (format) {
    case 'naira':
      return compact && Math.abs(v) >= 10_000 ? nairaCompact.format(v) : naira.format(v);
    case 'count':
      return compact && Math.abs(v) >= 10_000 ? countCompact.format(v) : count.format(v);
    case 'percent':
      return pct.format(v);
    case 'hours':
      if (v < 1) return `${Math.round(v * 60)} min`;
      if (v < 48) return `${v.toFixed(v < 10 ? 1 : 0)} h`;
      return `${(v / 24).toFixed(1)} d`;
  }
}

export type Delta = {
  /** "+12.4%", "−3 pts", "New". */
  text: string;
  direction: 'up' | 'down' | 'flat';
  /** Whether this movement is good news, given the metric. */
  good: boolean | null;
};

/**
 * Change vs the previous period. Rates compare in percentage points (a move
 * from 10% to 12% is "+2 pts", not "+20%"); everything else in percent.
 */
export function formatDelta(
  value: number | null,
  previous: number | null,
  format: ValueFormat,
  goodWhen: 'up' | 'down',
): Delta | null {
  if (value === null || previous === null) return null;
  const diff = value - previous;
  const direction = Math.abs(diff) < 1e-9 ? 'flat' : diff > 0 ? 'up' : 'down';
  const good = direction === 'flat' ? null : (direction === 'up') === (goodWhen === 'up');
  const sign = diff > 0 ? '+' : diff < 0 ? '−' : '±';

  if (format === 'percent') {
    return { text: `${sign}${Math.abs(diff * 100).toFixed(1)} pts`, direction, good };
  }
  if (previous === 0) {
    return value === 0 ? { text: '±0%', direction: 'flat', good: null } : { text: 'New', direction: 'up', good };
  }
  const rel = diff / Math.abs(previous);
  return { text: `${sign}${Math.abs(rel * 100).toFixed(Math.abs(rel) < 0.1 ? 1 : 0)}%`, direction, good };
}
