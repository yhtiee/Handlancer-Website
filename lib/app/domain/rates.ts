/**
 * What a provider's starting price is charged per. `profiles.hourly_rate` holds
 * the amount whatever the unit; `profiles.rate_unit` says what it buys. The
 * values are checked in the database (supabase/provider_rate_unit.sql).
 */

export const RATE_UNITS = [
  { value: 'hour', label: 'per hour' },
  { value: 'day', label: 'per day' },
  { value: '24_hours', label: 'per 24 hours' },
  { value: 'week', label: 'per week' },
  { value: 'job', label: 'per job' },
] as const;

export type RateUnit = (typeof RATE_UNITS)[number]['value'];

/** Rows from before the unit existed were all entered as hourly. */
export const DEFAULT_RATE_UNIT: RateUnit = 'hour';

export function rateUnitLabel(unit?: string | null): string {
  return RATE_UNITS.find((u) => u.value === unit)?.label ?? 'per hour';
}

/** A stored amount as the rate field shows it: 20000 → "20,000". */
export function formatRateInput(amount?: number | null): string {
  return amount ? amount.toLocaleString('en-NG') : '';
}

/** What the rate field holds, for saving. Blank or zero means "by quote". */
export function parseRateInput(value: string): number | null {
  const amount = Number(value.replace(/\D/g, ''));
  return amount > 0 ? amount : null;
}
