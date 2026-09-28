'use client';

import { Sparkline } from '@/components/admin/charts/bars';
import { formatDelta, formatValue } from '@/lib/admin/analytics/format';
import type { Kpi } from '@/lib/admin/analytics/types';

/**
 * The headline numbers, on the site's ruled grid. Each tile: label · figure ·
 * change vs the previous period (coloured by whether the move is good news,
 * with an arrow so colour is never the only signal) · sparkline.
 */
export function KpiGrid({ kpis, prevLabel, large = false }: { kpis: Kpi[]; prevLabel: string; large?: boolean }) {
  return (
    <div className="ruled-grid enter grid-cols-2 lg:grid-cols-4">
      {kpis.map((k) => {
        const d = formatDelta(k.value, k.previous, k.format, k.goodWhen);
        const tone = d?.good === true ? 'text-[var(--ok-ink)]' : d?.good === false ? 'text-[var(--bad)]' : 'text-[var(--muted)]';
        const arrow = d?.direction === 'up' ? '▲' : d?.direction === 'down' ? '▼' : '■';
        return (
          <div key={k.key} className={large ? 'p-6' : 'p-4 md:p-5'} title={k.definition}>
            <p className="label">{k.label}</p>
            <div className="mt-3 flex items-end justify-between gap-2">
              <p className={`figure font-medium leading-none text-[var(--ink)] ${large ? 'text-[40px]' : 'text-[26px]'}`}>
                {formatValue(k.value, k.format, true)}
              </p>
              {k.spark && <Sparkline values={k.spark} width={large ? 120 : 80} height={large ? 34 : 26} />}
            </div>
            <p className="mt-3 flex flex-wrap items-center gap-x-1.5 text-[12.5px]">
              {d ? (
                <>
                  <span className={`figure font-semibold ${tone}`}>
                    <span aria-hidden="true" className="mr-0.5 text-[9px]">
                      {arrow}
                    </span>
                    {d.text}
                  </span>
                  <span className="text-[var(--muted)]">vs {formatValue(k.previous, k.format, true)}</span>
                </>
              ) : (
                <span className="text-[var(--muted)]">No comparison</span>
              )}
            </p>
            <span className="sr-only">
              Compared with {prevLabel}. {k.definition}
            </span>
          </div>
        );
      })}
    </div>
  );
}
