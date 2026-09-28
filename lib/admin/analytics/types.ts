import type { Interval, ResolvedRange } from '@/lib/admin/analytics/range';

/**
 * The analytics report. One plain JSON object, computed on the server and
 * consumed as-is by the page, presentation mode and every export.
 */

export type ValueFormat = 'naira' | 'count' | 'percent' | 'hours';

export type Kpi = {
  key: string;
  label: string;
  value: number | null;
  /** Same metric over the previous, equally long period. */
  previous: number | null;
  format: ValueFormat;
  /** Whether a rise is good news — colours the delta. */
  goodWhen: 'up' | 'down';
  /** Per-bucket values for the sparkline (additive metrics only). */
  spark?: number[];
  /** Plain-English definition, shown on hover and in exports. */
  definition: string;
};

export type TimelinePoint = {
  /** Bucket start, ISO. */
  start: string;
  label: string;
  escrowFunded: number;
  paidOut: number;
  topUps: number;
  withdrawals: number;
  refunds: number;
  jobsPosted: number;
  jobsCompleted: number;
  newClients: number;
  newProviders: number;
  disputesOpened: number;
  waitlistSignups: number;
};

export type Ranked = { label: string; value: number; secondary?: number };

export type AnalyticsReport = {
  range: ResolvedRange;
  interval: Interval;
  generatedAt: string;
  kpis: Kpi[];
  timeline: TimelinePoint[];
  /** Jobs posted in the period, followed to where they are now. */
  funnel: { label: string; value: number; definition: string }[];
  /** value = jobs posted, secondary = escrow funded (₦). */
  categories: Ranked[];
  /** value = jobs posted. */
  locations: Ranked[];
  disputes: {
    opened: number;
    resolved: number;
    stillOpen: number;
    refunded: number;
    released: number;
    medianHoursToResolve: number | null;
    outcomes: Ranked[];
    byCategory: Ranked[];
  };
  topProviders: { id: string; name: string; completed: number; earned: number; rating: number | null }[];
  users: { clientsToDate: number; providersToDate: number };
  /** The last bucket is still running (e.g. this week so far) — draw and label it as such. */
  partialLast: boolean;
  /** True if any source table hit the row cap — numbers are then a lower bound. */
  truncated: boolean;
};
