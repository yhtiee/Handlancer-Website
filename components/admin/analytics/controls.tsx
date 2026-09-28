'use client';

import { useEffect, useRef, useState } from 'react';

import { IconDownload, IconPresent } from '@/components/admin/icons';
import { INTERVALS, PRESETS, lagosDateString, type Interval, type RangeParams, type ResolvedRange } from '@/lib/admin/analytics/range';

/**
 * One row above everything it scopes: date range first (presets, then a
 * custom range), then granularity; Present and Export on the right.
 */
export function AnalyticsControls({
  params,
  resolved,
  onChange,
  onPresent,
  onExport,
  exporting,
  loading,
}: {
  params: RangeParams;
  resolved: ResolvedRange | undefined;
  onChange: (p: RangeParams) => void;
  onPresent: () => void;
  onExport: (kind: 'pptx' | 'xlsx' | 'pdf') => void;
  exporting: 'pptx' | 'xlsx' | 'pdf' | null;
  loading: boolean;
}) {
  const [customOpen, setCustomOpen] = useState(params.range === 'custom');
  const today = lagosDateString(new Date());
  const [from, setFrom] = useState(params.from ?? (resolved ? lagosDateString(new Date(resolved.from)) : today));
  const [to, setTo] = useState(params.to ?? today);

  const seg = (active: boolean) =>
    `h-9 px-3 text-[13px] font-semibold transition-colors duration-200 first:rounded-l-md last:rounded-r-md ${
      active ? 'bg-[var(--navy)] text-white' : 'bg-[var(--paper)] text-[var(--muted)] hover:bg-[var(--band)] hover:text-[var(--ink)]'
    }`;

  return (
    <div className="analytics-controls enter mb-5 space-y-3" data-export-ignore="">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex overflow-hidden rounded-md border border-[var(--rule-strong)] [&>*+*]:border-l [&>*+*]:border-[var(--rule-strong)]" role="group" aria-label="Date range">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              title={p.long}
              aria-pressed={params.range === p.value}
              className={seg(params.range === p.value)}
              onClick={() => {
                setCustomOpen(false);
                onChange({ range: p.value });
              }}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={params.range === 'custom' || customOpen}
            aria-expanded={customOpen}
            className={seg(params.range === 'custom' || customOpen)}
            onClick={() => setCustomOpen((v) => !v)}
          >
            Custom
          </button>
        </div>

        <label className="flex items-center gap-2 text-[13px] text-[var(--muted)]">
          <span className="sr-only md:not-sr-only">Interval</span>
          <select
            className="input !h-9 !w-auto !py-0 pr-8 text-[13px]"
            value={params.interval ?? resolved?.interval ?? 'day'}
            onChange={(e) => onChange({ ...params, interval: e.target.value as Interval })}
          >
            {INTERVALS.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
        </label>

        <span
          aria-hidden="true"
          className={`size-1.5 rounded-full bg-[var(--teal)] transition-opacity duration-200 ${loading ? 'animate-pulse opacity-100' : 'opacity-0'}`}
        />

        <div className="ml-auto flex items-center gap-2">
          <button type="button" className="btn btn-ghost !h-9 !py-0" onClick={onPresent}>
            <IconPresent width={16} height={16} />
            Present
          </button>
          <ExportMenu onExport={onExport} exporting={exporting} />
        </div>
      </div>

      {customOpen && (
        <form
          className="flex flex-wrap items-end gap-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (from && to && from <= to) onChange({ ...params, range: 'custom', from, to });
          }}
        >
          <label className="text-[13px]">
            <span className="mb-1 block text-[var(--muted)]">From</span>
            <input type="date" className="input !h-9 !w-auto" value={from} max={to || today} onChange={(e) => setFrom(e.target.value)} required />
          </label>
          <label className="text-[13px]">
            <span className="mb-1 block text-[var(--muted)]">To</span>
            <input type="date" className="input !h-9 !w-auto" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} required />
          </label>
          <button type="submit" className="btn btn-primary !h-9 !py-0" disabled={!from || !to || from > to}>
            Apply
          </button>
        </form>
      )}
    </div>
  );
}

const EXPORTS: { kind: 'pptx' | 'xlsx' | 'pdf'; title: string; body: string }[] = [
  { kind: 'pptx', title: 'PowerPoint deck', body: 'Native, editable charts. One slide per section, with speaker notes.' },
  { kind: 'xlsx', title: 'Excel workbook', body: 'A summary sheet plus every section’s data, formatted.' },
  { kind: 'pdf', title: 'PDF report', body: 'The full page, laid out for A4 landscape. Choose “Save as PDF”.' },
];

function ExportMenu({ onExport, exporting }: { onExport: (k: 'pptx' | 'xlsx' | 'pdf') => void; exporting: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="btn btn-primary !h-9 !py-0"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        disabled={!!exporting}
      >
        <IconDownload width={16} height={16} />
        {exporting ? 'Preparing…' : 'Export'}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-20 mt-2 w-[300px] border border-[var(--rule-strong)] bg-[var(--paper)] py-1.5">
          {EXPORTS.map((x) => (
            <button
              key={x.kind}
              type="button"
              role="menuitem"
              className="block w-full px-4 py-2.5 text-left transition-colors duration-150 hover:bg-[var(--band)]"
              onClick={() => {
                setOpen(false);
                onExport(x.kind);
              }}
            >
              <span className="block font-semibold text-[var(--navy)]">{x.title}</span>
              <span className="block text-[12.5px] text-[var(--muted)]">{x.body}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
