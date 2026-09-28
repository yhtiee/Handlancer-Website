'use client';

import { SERIES_COLORS } from '@/components/admin/charts/core';
import { formatValue } from '@/lib/admin/analytics/format';
import type { Ranked, ValueFormat } from '@/lib/admin/analytics/types';

/**
 * Ranked horizontal bars (categories, places, outcomes). Magnitude on one hue;
 * the bar grows from a square baseline to a 4px rounded data-end. Every value
 * is printed at the row, so there is nothing a tooltip would add.
 */
export function RankedBars({
  items,
  format,
  secondaryFormat,
  secondaryLabel,
  emptyText = 'Nothing recorded in this period',
}: {
  items: Ranked[];
  format: ValueFormat;
  secondaryFormat?: ValueFormat;
  /** Names the secondary figure, e.g. "funded". */
  secondaryLabel?: string;
  emptyText?: string;
}) {
  const max = Math.max(0, ...items.map((i) => i.value));
  if (items.length === 0 || max === 0) {
    return <p className="chart-empty-block">{emptyText}</p>;
  }

  return (
    <ul className="chart-root space-y-3.5">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13.5px]">
            <span className="truncate text-[var(--ink)]">{item.label}</span>
            <span className="shrink-0 whitespace-nowrap">
              <span className="figure font-semibold text-[var(--ink)]">{formatValue(item.value, format)}</span>
              {secondaryFormat && item.secondary !== undefined && (
                <span className="figure ml-2 text-[12.5px] text-[var(--muted)]">
                  {formatValue(item.secondary, secondaryFormat, true)}
                  {secondaryLabel ? ` ${secondaryLabel}` : ''}
                </span>
              )}
            </span>
          </div>
          <div className="h-2.5">
            <div
              className="h-full rounded-r-[4px] transition-[width] duration-500 ease-out"
              style={{
                width: `${item.value === 0 ? 0 : Math.max(1.5, (item.value / max) * 100)}%`,
                background: SERIES_COLORS[0],
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * The hire funnel: each step as a bar from a shared baseline, with its share
 * of the first step and the conversion from the step before it.
 */
export function Funnel({ steps }: { steps: { label: string; value: number; definition: string }[] }) {
  const first = steps[0]?.value ?? 0;
  if (first === 0) return <p className="chart-empty-block">No jobs were posted in this period</p>;

  return (
    <ol className="chart-root space-y-4">
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].value : null;
        const share = s.value / first;
        return (
          <li key={s.label} title={s.definition}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13.5px]">
              <span className="text-[var(--ink)]">
                <span className="figure mr-2 text-[var(--muted)]">{String(i + 1).padStart(2, '0')}</span>
                {s.label}
              </span>
              <span className="shrink-0 whitespace-nowrap">
                <span className="figure font-semibold text-[var(--ink)]">{formatValue(s.value, 'count')}</span>
                <span className="figure ml-2 text-[12.5px] text-[var(--muted)]">{formatValue(share, 'percent')}</span>
              </span>
            </div>
            <div className="h-3.5">
              <div
                className="h-full rounded-r-[4px] transition-[width] duration-500 ease-out"
                style={{ width: `${s.value === 0 ? 0 : Math.max(1.5, share * 100)}%`, background: SERIES_COLORS[0] }}
              />
            </div>
            {prev !== null && prev > 0 && (
              <p className="figure mt-1 text-[11.5px] text-[var(--muted)]">
                {formatValue(s.value / prev, 'percent')} of the step before
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Tiny trend for a KPI tile: de-emphasis line, the latest point in the accent. */
export function Sparkline({ values, width = 96, height = 28 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (width - 6) + 3, height - 3 - ((v - min) / span) * (height - 6)]);
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="block">
      <polyline
        points={pts.map((p) => p.join(',')).join(' ')}
        fill="none"
        stroke="#9aa6b1"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lx} cy={ly} r={3} fill={SERIES_COLORS[0]} stroke="var(--paper)" strokeWidth={1.5} />
    </svg>
  );
}
