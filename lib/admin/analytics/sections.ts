import { bucketLongLabel } from '@/lib/admin/analytics/range';
import { formatDelta, formatValue } from '@/lib/admin/analytics/format';
import type { AnalyticsReport, Kpi, Ranked, ValueFormat } from '@/lib/admin/analytics/types';

/**
 * The analytics page as data. Every section is defined once here — title,
 * one-line takeaway, a chart spec and its table — and rendered by the page,
 * presentation mode, and each export (PowerPoint builds native charts from the
 * same spec; Excel and CSV write the same table). So a number can never differ
 * between the screen and the deck.
 */

export type ColumnFormat = ValueFormat | 'text';
export type TableSpec = {
  columns: { key: string; label: string; format: ColumnFormat }[];
  rows: Record<string, string | number | null>[];
};

export type ChartSpec =
  | {
      kind: 'trend';
      mode: 'line' | 'area' | 'columns';
      labels: string[];
      tooltipLabels: string[];
      series: { name: string; values: number[] }[];
      format: ValueFormat;
      /** The last point is a period still in progress. */
      partial: boolean;
    }
  | { kind: 'bars'; items: Ranked[]; format: ValueFormat; secondaryFormat?: ValueFormat; secondaryLabel?: string }
  | { kind: 'funnel'; steps: { label: string; value: number; definition: string }[] };

export type Section = {
  id: string;
  title: string;
  subtitle: string;
  /** One plain sentence a presenter can say out loud. */
  takeaway: string;
  chart: ChartSpec;
  table: TableSpec;
  /** A row of supporting figures shown above the chart. */
  stats?: { label: string; value: string }[];
};

const kpi = (r: AnalyticsReport, key: string) => r.kpis.find((k) => k.key === key)!;

/** "₦4.2M, up 12% on the previous period" */
function said(k: Kpi): string {
  const v = formatValue(k.value, k.format, true);
  const d = formatDelta(k.value, k.previous, k.format, k.goodWhen);
  if (!d || d.direction === 'flat') return `${v}, level with the previous period`;
  if (d.text === 'New') return `${v}, up from nothing in the previous period`;
  return `${v}, ${d.direction === 'up' ? 'up' : 'down'} ${d.text.replace(/^[+−]/, '')} on the previous period`;
}

function trendTable(r: AnalyticsReport, cols: { key: keyof AnalyticsReport['timeline'][number]; label: string }[], format: ValueFormat): TableSpec {
  return {
    columns: [{ key: 'period', label: 'Period', format: 'text' }, ...cols.map((c) => ({ key: c.key, label: c.label, format }))],
    rows: r.timeline.map((p, i) => ({
      period: bucketLongLabel(p.start, r.interval) + (r.partialLast && i === r.timeline.length - 1 ? ' (to date)' : ''),
      ...Object.fromEntries(cols.map((c) => [c.key, p[c.key] as number])),
    })),
  };
}

function rankedTable(items: Ranked[], label: string, valueLabel: string, format: ValueFormat, secondary?: { label: string; format: ValueFormat }): TableSpec {
  return {
    columns: [
      { key: 'label', label, format: 'text' },
      { key: 'value', label: valueLabel, format },
      ...(secondary ? [{ key: 'secondary', label: secondary.label, format: secondary.format }] : []),
    ],
    rows: items.map((i) => ({ label: i.label, value: i.value, secondary: i.secondary ?? null })),
  };
}

export function buildSections(r: AnalyticsReport): Section[] {
  const labels = r.timeline.map((p) => p.label);
  const tooltipLabels = r.timeline.map(
    (p, i) => bucketLongLabel(p.start, r.interval) + (r.partialLast && i === r.timeline.length - 1 ? ' · to date' : ''),
  );
  const trend = (
    mode: 'line' | 'area' | 'columns',
    format: ValueFormat,
    series: { name: string; key: keyof AnalyticsReport['timeline'][number] }[],
  ): ChartSpec => ({
    kind: 'trend',
    mode,
    labels,
    tooltipLabels,
    format,
    partial: r.partialLast,
    series: series.map((s) => ({ name: s.name, values: r.timeline.map((p) => p[s.key] as number) })),
  });

  const funded = kpi(r, 'escrowFunded');
  const paid = kpi(r, 'paidOut');
  const posted = kpi(r, 'jobsPosted');
  const completed = kpi(r, 'jobsCompleted');
  const signups = kpi(r, 'newUsers');
  const hireRate = kpi(r, 'hireRate');
  const topUps = r.timeline.reduce((s, p) => s + p.topUps, 0);
  const withdrawals = r.timeline.reduce((s, p) => s + p.withdrawals, 0);
  const clients = r.timeline.reduce((s, p) => s + p.newClients, 0);
  const providers = r.timeline.reduce((s, p) => s + p.newProviders, 0);
  const topCategory = r.categories[0];
  const topPlace = r.locations.find((l) => l.label !== 'Not given');
  const d = r.disputes;

  return [
    {
      id: 'money',
      title: 'Money through escrow',
      subtitle: 'Funded into escrow by clients vs paid out to providers',
      takeaway: `Escrow funded: ${said(funded)}. Paid to providers: ${formatValue(paid.value, 'naira', true)}.`,
      chart: trend('area', 'naira', [
        { name: 'Escrow funded', key: 'escrowFunded' },
        { name: 'Paid to providers', key: 'paidOut' },
      ]),
      table: trendTable(
        r,
        [
          { key: 'escrowFunded', label: 'Escrow funded (₦)' },
          { key: 'paidOut', label: 'Paid to providers (₦)' },
          { key: 'refunds', label: 'Dispute refunds (₦)' },
        ],
        'naira',
      ),
    },
    {
      id: 'jobs',
      title: 'Jobs posted and completed',
      subtitle: 'Completion is counted when the final payout is released',
      takeaway: `${formatValue(posted.value, 'count')} jobs posted (${said(posted).split(', ').slice(1).join(', ')}); ${formatValue(completed.value, 'count')} completed.`,
      chart: trend('columns', 'count', [
        { name: 'Posted', key: 'jobsPosted' },
        { name: 'Completed', key: 'jobsCompleted' },
      ]),
      table: trendTable(
        r,
        [
          { key: 'jobsPosted', label: 'Jobs posted' },
          { key: 'jobsCompleted', label: 'Jobs completed' },
          { key: 'disputesOpened', label: 'Disputes opened' },
        ],
        'count',
      ),
    },
    {
      id: 'funnel',
      title: 'Hire funnel',
      subtitle: 'Jobs posted in this period, followed to where they are today',
      takeaway: `Hire rate: ${said(hireRate)}.`,
      chart: { kind: 'funnel', steps: r.funnel },
      table: {
        columns: [
          { key: 'step', label: 'Step', format: 'text' },
          { key: 'jobs', label: 'Jobs', format: 'count' },
          { key: 'share', label: 'Share of posted', format: 'percent' },
          { key: 'definition', label: 'Definition', format: 'text' },
        ],
        rows: r.funnel.map((s) => ({
          step: s.label,
          jobs: s.value,
          share: r.funnel[0].value ? s.value / r.funnel[0].value : null,
          definition: s.definition,
        })),
      },
    },
    {
      id: 'growth',
      title: 'New sign-ups',
      subtitle: `${formatValue(r.users.clientsToDate, 'count')} clients and ${formatValue(r.users.providersToDate, 'count')} providers in total by the end of the period`,
      takeaway: `${formatValue(signups.value, 'count')} people joined: ${formatValue(clients, 'count')} clients and ${formatValue(providers, 'count')} providers.`,
      chart: trend('columns', 'count', [
        { name: 'Clients', key: 'newClients' },
        { name: 'Providers', key: 'newProviders' },
      ]),
      table: trendTable(
        r,
        [
          { key: 'newClients', label: 'New clients' },
          { key: 'newProviders', label: 'New providers' },
          { key: 'waitlistSignups', label: 'Waitlist sign-ups' },
        ],
        'count',
      ),
    },
    {
      id: 'categories',
      title: 'Demand by trade',
      subtitle: 'Jobs posted per category, with the escrow they funded',
      takeaway: topCategory
        ? `${topCategory.label} leads with ${formatValue(topCategory.value, 'count')} jobs posted.`
        : 'No jobs were posted in this period.',
      chart: { kind: 'bars', items: r.categories, format: 'count', secondaryFormat: 'naira', secondaryLabel: 'funded' },
      table: rankedTable(r.categories, 'Trade', 'Jobs posted', 'count', { label: 'Escrow funded (₦)', format: 'naira' }),
    },
    {
      id: 'locations',
      title: 'Where the jobs are',
      subtitle: 'Jobs posted by the first part of their location',
      takeaway: topPlace
        ? `${topPlace.label} is the busiest area, with ${formatValue(topPlace.value, 'count')} jobs posted.`
        : 'No job locations recorded in this period.',
      chart: { kind: 'bars', items: r.locations, format: 'count' },
      table: rankedTable(r.locations, 'Area', 'Jobs posted', 'count'),
    },
    {
      id: 'wallets',
      title: 'Wallet flows',
      subtitle: 'Money topped up into wallets vs withdrawals requested',
      takeaway: `${formatValue(topUps, 'naira', true)} topped up and ${formatValue(withdrawals, 'naira', true)} withdrawn: net ${formatValue(topUps - withdrawals, 'naira', true)}.`,
      chart: trend('line', 'naira', [
        { name: 'Top-ups', key: 'topUps' },
        { name: 'Withdrawals', key: 'withdrawals' },
      ]),
      table: trendTable(
        r,
        [
          { key: 'topUps', label: 'Top-ups (₦)' },
          { key: 'withdrawals', label: 'Withdrawals (₦)' },
        ],
        'naira',
      ),
    },
    {
      id: 'disputes',
      title: 'Disputes',
      subtitle: 'How disputes settled in the period were decided',
      stats: [
        { label: 'Opened', value: formatValue(d.opened, 'count') },
        { label: 'Settled', value: formatValue(d.resolved, 'count') },
        { label: 'Open now', value: formatValue(d.stillOpen, 'count') },
        { label: 'Median to settle', value: formatValue(d.medianHoursToResolve, 'hours') },
        { label: 'Refunded', value: formatValue(d.refunded, 'naira', true) },
        { label: 'Released', value: formatValue(d.released, 'naira', true) },
      ],
      takeaway: `Dispute rate: ${said(kpi(r, 'disputeRate'))}. ${formatValue(d.refunded, 'naira', true)} refunded, ${formatValue(d.released, 'naira', true)} released.`,
      chart: { kind: 'bars', items: d.outcomes, format: 'count' },
      table: rankedTable(d.outcomes, 'Outcome', 'Disputes settled', 'count'),
    },
    {
      id: 'providers',
      title: 'Top providers',
      subtitle: 'By money received in the period (materials releases and final payouts)',
      takeaway: r.topProviders[0]
        ? `${r.topProviders[0].name} earned the most: ${formatValue(r.topProviders[0].earned, 'naira', true)} across ${r.topProviders[0].completed} completed jobs.`
        : 'No provider payouts in this period.',
      chart: {
        kind: 'bars',
        items: r.topProviders.map((p) => ({ label: p.name, value: p.earned, secondary: p.completed })),
        format: 'naira',
        secondaryFormat: 'count',
        secondaryLabel: 'jobs',
      },
      table: {
        columns: [
          { key: 'name', label: 'Provider', format: 'text' },
          { key: 'earned', label: 'Received (₦)', format: 'naira' },
          { key: 'completed', label: 'Jobs completed', format: 'count' },
          { key: 'rating', label: 'Rating', format: 'text' },
        ],
        rows: r.topProviders.map((p) => ({
          name: p.name,
          earned: p.earned,
          completed: p.completed,
          rating: p.rating ? p.rating.toFixed(1) : '—',
        })),
      },
    },
  ];
}

/** KPIs as a table — the Excel "Summary" sheet and the deck's KPI slide notes. */
export function kpiTable(r: AnalyticsReport): TableSpec {
  return {
    columns: [
      { key: 'metric', label: 'Metric', format: 'text' },
      { key: 'value', label: 'This period', format: 'text' },
      { key: 'previous', label: 'Previous period', format: 'text' },
      { key: 'change', label: 'Change', format: 'text' },
      { key: 'definition', label: 'Definition', format: 'text' },
    ],
    rows: r.kpis.map((k) => ({
      metric: k.label,
      value: formatValue(k.value, k.format),
      previous: formatValue(k.previous, k.format),
      change: formatDelta(k.value, k.previous, k.format, k.goodWhen)?.text ?? '—',
      definition: k.definition,
    })),
  };
}
