'use client';

import { useState } from 'react';

import { GRID, SERIES_COLORS, labelStride, niceTicks, useWidth } from '@/components/admin/charts/core';
import { formatValue } from '@/lib/admin/analytics/format';
import type { ValueFormat } from '@/lib/admin/analytics/types';

export type TrendSeries = { name: string; values: number[] };

/**
 * Change over time for one or two series: line, area, or grouped columns.
 *
 * Marks follow the dataviz spec — 2px lines with ringed end-dots, a 10% area
 * wash, columns ≤ 24px with a 4px rounded data-end and a 2px gap between
 * group members, hairline grid, clean ticks. The hover layer is a crosshair
 * that snaps to the nearest bucket and lists every series (also reachable by
 * keyboard: focus the chart, then ← →).
 */
export function TrendChart({
  labels,
  tooltipLabels,
  series,
  format,
  mode = 'line',
  height = 260,
  ariaLabel,
  partial = false,
}: {
  labels: string[];
  tooltipLabels?: string[];
  series: TrendSeries[];
  format: ValueFormat;
  mode?: 'line' | 'area' | 'columns';
  height?: number;
  ariaLabel: string;
  /** The last point is a period still in progress: drawn dashed / lighter, and said so. */
  partial?: boolean;
}) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  const n = labels.length;
  const max = Math.max(0, ...series.flatMap((s) => s.values));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1] || 1;
  const tickText = ticks.map((t) => formatValue(t, format, true));

  const showEndLabels = mode !== 'columns' && n > 1;
  const left = Math.max(...tickText.map((t) => t.length)) * 7 + 14;
  const right = showEndLabels ? 64 : 12;
  const topPad = 12;
  const bottom = 28;
  const plotW = Math.max(40, width - left - right);
  const plotH = Math.max(40, height - topPad - bottom);
  const baseY = topPad + plotH;
  const y = (v: number) => baseY - (v / top) * plotH;

  // x geometry
  const band = plotW / Math.max(1, n);
  const step = n > 1 ? plotW / (n - 1) : 0;
  const xPoint = (i: number) => (n > 1 ? left + i * step : left + plotW / 2);
  const k = series.length;
  const barW = Math.max(3, Math.min(24, (band * 0.72 - 2 * (k - 1)) / k));
  const groupW = barW * k + 2 * (k - 1);
  const xBand = (i: number) => left + i * band + (band - groupW) / 2;
  const xCenter = (i: number) => (mode === 'columns' ? left + i * band + band / 2 : xPoint(i));

  const stride = labelStride(n, plotW);
  const isPartial = partial && n > 1;
  const empty = max === 0;

  const indexAt = (px: number) => {
    if (n === 0) return null;
    const i = mode === 'columns' ? Math.floor((px - left) / band) : Math.round((px - left) / (step || 1));
    return Math.min(n - 1, Math.max(0, i));
  };

  // End labels only when they will not collide.
  const endYs = series.map((s) => y(s.values[n - 1] ?? 0));
  const endLabelsFit = showEndLabels && (endYs.length < 2 || Math.abs(endYs[0] - endYs[1]) >= 16);

  const tipX = active !== null ? xCenter(active) : 0;
  const tipOnLeft = tipX > width - 200;

  return (
    <div className="chart-root relative select-none" ref={ref}>
      {(k > 1 || isPartial) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-5 gap-y-1">
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-[var(--ink)]" aria-hidden="true">
          {series.map((s, i) => (
            <li key={s.name} className="flex items-center gap-2">
              {mode === 'columns' ? (
                <span className="inline-block size-2.5 rounded-[2px]" style={{ background: SERIES_COLORS[i] }} />
              ) : (
                <span className="inline-block h-0.5 w-4 rounded-full" style={{ background: SERIES_COLORS[i] }} />
              )}
              {s.name}
            </li>
          ))}
        </ul>
        {isPartial && (
          <p className="flex items-center gap-2 text-[12px] text-[var(--muted)]">
            {mode === 'columns' ? (
              <span className="inline-block size-2.5 rounded-[2px] bg-[var(--muted)] opacity-40" aria-hidden="true" />
            ) : (
              <span className="inline-block w-4 border-t-2 border-dashed border-[var(--muted)]" aria-hidden="true" />
            )}
            Latest period still in progress
          </p>
        )}
        </div>
      )}

      <div
        tabIndex={0}
        role="group"
        aria-label={`${ariaLabel}. Use the left and right arrow keys to read values.`}
        className="relative rounded-md outline-offset-4"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') setActive((a) => Math.min(n - 1, (a ?? -1) + 1));
          else if (e.key === 'ArrowLeft') setActive((a) => Math.max(0, (a ?? n) - 1));
          else if (e.key === 'Escape') setActive(null);
          else return;
          e.preventDefault();
        }}
        onBlur={() => setActive(null)}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={height}
          role="img"
          aria-label={ariaLabel}
          className="block overflow-visible"
          onPointerMove={(e) => {
            const box = e.currentTarget.getBoundingClientRect();
            setActive(indexAt(((e.clientX - box.left) / box.width) * width));
          }}
          onPointerLeave={() => setActive(null)}
        >
          {/* Grid + y ticks */}
          {ticks.map((t, i) => (
            <g key={t}>
              <line x1={left} x2={left + plotW} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} shapeRendering="crispEdges" />
              <text x={left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="chart-tick">
                {tickText[i]}
              </text>
            </g>
          ))}

          {/* X labels */}
          {labels.map((l, i) => {
            // Every `stride`-th label, plus the last one when it has room to itself.
            const regular = i % stride === 0;
            const spacing = mode === 'columns' ? band : step;
            const last = i === n - 1 && !regular && ((n - 1) % stride) * spacing >= 56;
            return regular || last ? (
              <text key={i} x={xCenter(i)} y={baseY + 18} textAnchor="middle" className="chart-tick">
                {l}
              </text>
            ) : null;
          })}

          {/* Marks */}
          {mode === 'columns'
            ? labels.map((_, i) => (
                <g
                  key={i}
                  opacity={(active === null || active === i ? 1 : 0.45) * (isPartial && i === n - 1 ? 0.45 : 1)}
                  style={{ transition: 'opacity 120ms' }}
                >
                  {series.map((s, si) => {
                    const v = s.values[i] ?? 0;
                    const x = xBand(i) + si * (barW + 2);
                    const h = baseY - y(v);
                    if (h <= 0) return null;
                    const r = Math.min(4, h, barW / 2);
                    const yt = baseY - h;
                    return (
                      <path
                        key={s.name}
                        fill={SERIES_COLORS[si]}
                        d={`M${x},${baseY}V${yt + r}Q${x},${yt} ${x + r},${yt}H${x + barW - r}Q${x + barW},${yt} ${x + barW},${yt + r}V${baseY}Z`}
                      />
                    );
                  })}
                </g>
              ))
            : series.map((s, si) => {
                const pts = s.values.map((v, i) => `${xPoint(i)},${y(v)}`);
                return (
                  <g key={s.name}>
                    {mode === 'area' && n > 1 && (
                      <path
                        d={`M${xPoint(0)},${baseY}L${pts.join('L')}L${xPoint(n - 1)},${baseY}Z`}
                        fill={SERIES_COLORS[si]}
                        fillOpacity={0.1}
                      />
                    )}
                    <polyline
                      points={(isPartial ? pts.slice(0, -1) : pts).join(' ')}
                      fill="none"
                      stroke={SERIES_COLORS[si]}
                      strokeWidth={2}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {isPartial && (
                      <polyline
                        points={pts.slice(-2).join(' ')}
                        fill="none"
                        stroke={SERIES_COLORS[si]}
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        strokeLinecap="round"
                      />
                    )}
                  </g>
                );
              })}

          {/* Baseline over the marks' square ends */}
          <line x1={left} x2={left + plotW} y1={baseY} y2={baseY} stroke="var(--rule-strong)" strokeWidth={1} shapeRendering="crispEdges" />

          {/* Crosshair */}
          {active !== null && mode !== 'columns' && (
            <line x1={tipX} x2={tipX} y1={topPad} y2={baseY} stroke="var(--muted)" strokeOpacity={0.5} strokeWidth={1} />
          )}

          {/* Dots: every series at the active x, else the end-dots */}
          {mode !== 'columns' &&
            series.map((s, si) => {
              const i = active ?? n - 1;
              if (n === 0) return null;
              return (
                <circle
                  key={s.name}
                  cx={xPoint(i)}
                  cy={y(s.values[i] ?? 0)}
                  r={4}
                  fill={SERIES_COLORS[si]}
                  stroke="var(--paper)"
                  strokeWidth={2}
                />
              );
            })}

          {/* End labels — text tokens, never the series colour */}
          {endLabelsFit &&
            active === null &&
            series.map((s) => (
              <text key={s.name} x={xPoint(n - 1) + 9} y={y(s.values[n - 1] ?? 0)} dy="0.32em" className="chart-end">
                {formatValue(s.values[n - 1] ?? 0, format, true)}
              </text>
            ))}

          {empty && (
            <text x={left + plotW / 2} y={topPad + plotH / 2} textAnchor="middle" className="chart-empty">
              No activity in this period
            </text>
          )}
        </svg>

        {/* Tooltip: value leads, series name follows; line keys, not boxes */}
        {active !== null && (
          <div
            className="chart-tip pointer-events-none absolute top-2 z-10 min-w-[160px] border border-[var(--rule-strong)] bg-[var(--paper)] px-3 py-2.5"
            style={tipOnLeft ? { right: width - tipX + 12 } : { left: tipX + 12 }}
            role="status"
          >
            <p className="label !text-[10px]">{(tooltipLabels ?? labels)[active]}</p>
            <ul className="mt-1.5 space-y-1">
              {series.map((s, si) => (
                <li key={s.name} className="flex items-center gap-2 text-[13px]">
                  <span
                    className={mode === 'columns' ? 'inline-block size-2 rounded-[2px]' : 'inline-block h-0.5 w-3 rounded-full'}
                    style={{ background: SERIES_COLORS[si] }}
                  />
                  <span className="figure font-semibold text-[var(--ink)]">{formatValue(s.values[active] ?? 0, format)}</span>
                  <span className="text-[var(--muted)]">{s.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
