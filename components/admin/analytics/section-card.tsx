'use client';

import { useRef, useState } from 'react';

import { ChartView } from '@/components/admin/analytics/chart-view';
import { IconDownload, IconImage, IconPresent, IconTable, IconChart } from '@/components/admin/icons';
import { PanelTitle } from '@/components/admin/ui';
import { downloadCsv, downloadPng } from '@/lib/admin/analytics/export';
import { formatValue } from '@/lib/admin/analytics/format';
import type { Section, TableSpec } from '@/lib/admin/analytics/sections';

/** A section's numbers as a plain table — the chart's accessible twin, and what CSV exports. */
export function DataTableView({ table }: { table: TableSpec }) {
  return (
    <div className="table-wrap max-h-[340px] overflow-y-auto">
      <table className="data">
        <thead className="sticky top-0 bg-[var(--paper)]">
          <tr>
            {table.columns.map((c) => (
              <th key={c.key} scope="col" className={c.format === 'text' ? '' : 'text-right'}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i}>
              {table.columns.map((c) => {
                const v = row[c.key];
                return (
                  <td key={c.key} className={c.format === 'text' ? 'text-[var(--ink)]' : 'figure whitespace-nowrap text-right text-[13px]'}>
                    {typeof v === 'number' && c.format !== 'text' ? formatValue(v, c.format) : (v ?? '—')}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Supporting figures above a chart, on the site's ruled grid. */
export function StatRow({ stats, large = false }: { stats: { label: string; value: string }[]; large?: boolean }) {
  return (
    <dl className={`ruled-grid mb-5 grid-cols-2 sm:grid-cols-3 ${large ? 'lg:grid-cols-6' : ''}`}>
      {stats.map((s) => (
        <div key={s.label} className={large ? 'px-5 py-4' : 'px-3.5 py-3'}>
          <dt className="label !text-[10px]">{s.label}</dt>
          <dd className={`figure mt-1.5 font-medium text-[var(--ink)] ${large ? 'text-[28px]' : 'text-[18px]'}`}>{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Action({ label, onClick, children, pressed }: { label: string; onClick: () => void; children: React.ReactNode; pressed?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={`grid size-8 place-items-center rounded-md transition-colors duration-200 ${
        pressed ? 'bg-[var(--teal-wash)] text-[var(--navy)]' : 'text-[var(--muted)] hover:bg-[var(--band)] hover:text-[var(--ink)]'
      }`}
    >
      {children}
    </button>
  );
}

export function SectionCard({
  section,
  fileBase,
  onPresent,
  className = '',
  chartHeight = 260,
}: {
  section: Section;
  fileBase: string;
  onPresent: () => void;
  className?: string;
  chartHeight?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [asTable, setAsTable] = useState(false);
  const [busy, setBusy] = useState(false);

  const png = async () => {
    if (!ref.current || busy) return;
    setBusy(true);
    try {
      await downloadPng(ref.current, `${fileBase}_${section.id}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section ref={ref} className={`analytics-card card enter flex flex-col overflow-hidden ${className}`} aria-labelledby={`sec-${section.id}`}>
      <header className="flex items-start justify-between gap-3 border-b border-[var(--rule)] px-4 py-3 md:px-5">
        <div className="min-w-0">
          <div id={`sec-${section.id}`}>
            <PanelTitle>{section.title}</PanelTitle>
          </div>
          <p className="mt-1 text-[13px] text-[var(--muted)]">{section.subtitle}</p>
        </div>
        <div className="-mr-1.5 flex shrink-0 items-center" data-export-ignore="">
          <Action label={asTable ? 'Show chart' : 'Show data table'} onClick={() => setAsTable((v) => !v)} pressed={asTable}>
            {asTable ? <IconChart width={16} height={16} /> : <IconTable width={16} height={16} />}
          </Action>
          <Action label="Download CSV" onClick={() => downloadCsv(section.table, `${fileBase}_${section.id}`)}>
            <IconDownload width={16} height={16} />
          </Action>
          <Action label={busy ? 'Preparing image…' : 'Download PNG'} onClick={png}>
            <IconImage width={16} height={16} />
          </Action>
          <Action label="Present from this slide" onClick={onPresent}>
            <IconPresent width={16} height={16} />
          </Action>
        </div>
      </header>

      <div className="flex-1 p-4 md:p-5">
        {section.stats && <StatRow stats={section.stats} />}
        {asTable ? <DataTableView table={section.table} /> : <ChartView spec={section.chart} height={chartHeight} ariaLabel={section.title} />}
      </div>

      <p className="flex gap-2.5 border-t border-[var(--rule)] px-4 py-3 text-[13.5px] text-[var(--ink)] md:px-5">
        <span className="mt-1 h-3.5 w-0.5 shrink-0 bg-[var(--teal)]" aria-hidden="true" />
        {section.takeaway}
      </p>
    </section>
  );
}
