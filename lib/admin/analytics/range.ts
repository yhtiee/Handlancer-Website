/**
 * Analytics date ranges and time buckets.
 *
 * Pure and shared by the server (aggregation), the API route (parsing) and the
 * browser (controls, labels), so all three agree on exactly which instants a
 * range covers and where each bucket starts.
 *
 * Everything is in Lagos time. Africa/Lagos is UTC+1 all year (no DST), so
 * "shift by one hour, then use UTC date maths" is exact rather than an
 * approximation.
 */

export type RangePreset = '7d' | '30d' | '90d' | '12m' | 'ytd' | 'custom';
export type Interval = 'day' | 'week' | 'month';

export const PRESETS: { value: RangePreset; label: string; long: string }[] = [
  { value: '7d', label: '7D', long: 'Last 7 days' },
  { value: '30d', label: '30D', long: 'Last 30 days' },
  { value: '90d', label: '90D', long: 'Last 90 days' },
  { value: '12m', label: '12M', long: 'Last 12 months' },
  { value: 'ytd', label: 'YTD', long: 'Year to date' },
];

export const INTERVALS: { value: Interval; label: string }[] = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

/** What the URL carries. `from`/`to` are inclusive Lagos dates (YYYY-MM-DD), custom only. */
export type RangeParams = {
  range: RangePreset;
  interval?: Interval;
  from?: string;
  to?: string;
};

/** A resolved range: instants (ISO, UTC), half-open [from, to). */
export type ResolvedRange = {
  preset: RangePreset;
  interval: Interval;
  from: string;
  to: string;
  /** The equally long period immediately before, for comparisons. */
  prevFrom: string;
  prevTo: string;
  /** "Last 30 days", "1 Jan – 28 Sept 2026". */
  label: string;
  /** "1 Aug – 30 Aug 2026" — what the comparison period was. */
  prevLabel: string;
};

const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** A UTC instant → the same wall-clock moment in Lagos, as a Date whose UTC fields read as Lagos time. */
const toLagos = (d: Date) => new Date(d.getTime() + LAGOS_OFFSET_MS);
/** The inverse of toLagos. */
const fromLagos = (d: Date) => new Date(d.getTime() - LAGOS_OFFSET_MS);

/** Midnight (Lagos) at the start of the Lagos day containing `d`, as a UTC instant. */
function lagosDayStart(d: Date): Date {
  const l = toLagos(d);
  return fromLagos(new Date(Date.UTC(l.getUTCFullYear(), l.getUTCMonth(), l.getUTCDate())));
}

/** "2026-09-28" (a Lagos calendar date) → the UTC instant of its Lagos midnight. */
function lagosDateToInstant(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return fromLagos(new Date(Date.UTC(y, m - 1, d)));
}

/** A UTC instant → its Lagos calendar date, "2026-09-28". */
export function lagosDateString(d: Date): string {
  return toLagos(d).toISOString().slice(0, 10);
}

/** Buckets start on Monday (weeks) and the 1st (months), Lagos time. */
export function bucketStart(d: Date, interval: Interval): Date {
  const l = toLagos(d);
  const y = l.getUTCFullYear();
  const m = l.getUTCMonth();
  if (interval === 'month') return fromLagos(new Date(Date.UTC(y, m, 1)));
  const day = new Date(Date.UTC(y, m, l.getUTCDate()));
  if (interval === 'week') {
    const dow = (day.getUTCDay() + 6) % 7; // Monday = 0
    day.setUTCDate(day.getUTCDate() - dow);
  }
  return fromLagos(day);
}

export function nextBucket(start: Date, interval: Interval): Date {
  const l = toLagos(start);
  if (interval === 'month') return fromLagos(new Date(Date.UTC(l.getUTCFullYear(), l.getUTCMonth() + 1, 1)));
  return new Date(start.getTime() + (interval === 'week' ? 7 : 1) * DAY_MS);
}

/** Every bucket start overlapping [from, to), in order. */
export function bucketStarts(from: string, to: string, interval: Interval): string[] {
  const end = new Date(to).getTime();
  const out: string[] = [];
  for (let b = bucketStart(new Date(from), interval); b.getTime() < end; b = nextBucket(b, interval)) {
    out.push(b.toISOString());
    if (out.length > 500) break; // a guard, not a feature: resolveRange caps well below this
  }
  return out;
}

/** The sensible default granularity for a span. */
function autoInterval(days: number): Interval {
  if (days <= 45) return 'day';
  if (days <= 200) return 'week';
  return 'month';
}

/** Daily buckets over a year would be 365 points of noise; cap what each span allows. */
function allowedInterval(days: number, wanted: Interval | undefined): Interval {
  if (!wanted) return autoInterval(days);
  if (wanted === 'day' && days > 120) return 'week';
  if (wanted === 'week' && days > 730) return 'month';
  return wanted;
}

const dayFmt = new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', timeZone: 'Africa/Lagos' });
const dayYearFmt = new Intl.DateTimeFormat('en-NG', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Africa/Lagos',
});
const monthFmt = new Intl.DateTimeFormat('en-NG', { month: 'short', year: 'numeric', timeZone: 'Africa/Lagos' });

function spanLabel(from: Date, toExclusive: Date): string {
  const last = new Date(toExclusive.getTime() - 1);
  return `${dayFmt.format(from)} – ${dayYearFmt.format(last)}`;
}

/** Axis / table label for a bucket. */
export function bucketLabel(startIso: string, interval: Interval): string {
  const d = new Date(startIso);
  if (interval === 'month') return monthFmt.format(d);
  return dayFmt.format(d);
}

/** Tooltip label for a bucket: the full span it covers. */
export function bucketLongLabel(startIso: string, interval: Interval): string {
  const d = new Date(startIso);
  if (interval === 'day') return dayYearFmt.format(d);
  if (interval === 'month') return monthFmt.format(d);
  return `Week of ${dayYearFmt.format(d)}`;
}

/** URL search params → validated range params. Anything malformed falls back to 30 days. */
export function parseRangeParams(source: URLSearchParams | Record<string, string | string[] | undefined>): RangeParams {
  const get = (k: string) => {
    const v = source instanceof URLSearchParams ? source.get(k) : source[k];
    return (Array.isArray(v) ? v[0] : v) || undefined;
  };
  const range = get('range') as RangePreset | undefined;
  const interval = get('interval') as Interval | undefined;
  const from = get('from');
  const to = get('to');

  const params: RangeParams = { range: 'custom' };
  if (range === 'custom' && from && to && DATE_RE.test(from) && DATE_RE.test(to) && from <= to) {
    params.from = from;
    params.to = to;
  } else {
    params.range = range && PRESETS.some((p) => p.value === range) ? range : '30d';
  }
  if (interval && INTERVALS.some((i) => i.value === interval)) params.interval = interval;
  return params;
}

export function rangeToSearch(p: RangeParams): string {
  const qs = new URLSearchParams();
  if (p.range !== '30d') qs.set('range', p.range);
  if (p.range === 'custom' && p.from && p.to) {
    qs.set('from', p.from);
    qs.set('to', p.to);
  }
  if (p.interval) qs.set('interval', p.interval);
  const s = qs.toString();
  return s ? `?${s}` : '';
}

/** Params → concrete instants. `now` is injectable so the server and tests agree. */
export function resolveRange(p: RangeParams, now: Date = new Date()): ResolvedRange {
  const tomorrow = new Date(lagosDayStart(now).getTime() + DAY_MS);
  let from: Date;
  let to = tomorrow;

  switch (p.range) {
    case '7d':
      from = new Date(tomorrow.getTime() - 7 * DAY_MS);
      break;
    case '90d':
      from = new Date(tomorrow.getTime() - 90 * DAY_MS);
      break;
    case '12m':
      from = new Date(tomorrow.getTime() - 365 * DAY_MS);
      break;
    case 'ytd': {
      const year = toLagos(now).getUTCFullYear();
      from = fromLagos(new Date(Date.UTC(year, 0, 1)));
      break;
    }
    case 'custom':
      from = lagosDateToInstant(p.from!);
      to = new Date(Math.min(lagosDateToInstant(p.to!).getTime() + DAY_MS, tomorrow.getTime()));
      if (to <= from) from = new Date(to.getTime() - DAY_MS);
      break;
    default:
      from = new Date(tomorrow.getTime() - 30 * DAY_MS);
  }

  const span = to.getTime() - from.getTime();
  const days = Math.round(span / DAY_MS);
  const prevTo = from;
  const prevFrom = new Date(from.getTime() - span);
  const preset = PRESETS.find((x) => x.value === p.range);

  return {
    preset: p.range,
    interval: allowedInterval(days, p.interval),
    from: from.toISOString(),
    to: to.toISOString(),
    prevFrom: prevFrom.toISOString(),
    prevTo: prevTo.toISOString(),
    label: preset ? `${preset.long} · ${spanLabel(from, to)}` : spanLabel(from, to),
    prevLabel: spanLabel(prevFrom, prevTo),
  };
}

/** For file names: "2026-08-30_to_2026-09-28". */
export function rangeSlug(r: ResolvedRange): string {
  return `${lagosDateString(new Date(r.from))}_to_${lagosDateString(new Date(new Date(r.to).getTime() - 1))}`;
}
