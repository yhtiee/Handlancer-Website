/** Display helpers shared by admin pages. Pure — safe on server and client. */

const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

const nairaCompact = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const count = new Intl.NumberFormat('en-NG');
const countCompact = new Intl.NumberFormat('en-NG', { notation: 'compact', maximumFractionDigits: 1 });

/** ₦125,000. Amounts come back from PostgREST as numbers or numeric strings. */
export function formatNaira(value: number | string | null | undefined): string {
  return naira.format(Number(value ?? 0));
}

/** ₦1.2M — stat tiles only; tables show the exact figure. */
export function formatNairaCompact(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return Math.abs(n) < 100_000 ? naira.format(n) : nairaCompact.format(n);
}

export function formatCount(value: number, compact = false): string {
  return compact && Math.abs(value) >= 10_000 ? countCompact.format(value) : count.format(value);
}

const dateFmt = new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('en-NG', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});

export function formatDate(iso: string | null | undefined): string {
  return iso ? dateFmt.format(new Date(iso)) : '—';
}

export function formatDateTime(iso: string | null | undefined): string {
  return iso ? dateTimeFmt.format(new Date(iso)) : '—';
}

/** "in_progress" → "In progress". */
export function humanize(value: string | null | undefined): string {
  if (!value) return '—';
  const s = value.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** First 8 chars of a uuid, for compact id columns. */
export function shortId(id: string): string {
  return id.slice(0, 8);
}
