'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { ChartView } from '@/components/admin/analytics/chart-view';
import { KpiGrid } from '@/components/admin/analytics/kpi-grid';
import { StatRow } from '@/components/admin/analytics/section-card';
import { BrandLogo } from '@/components/admin/brand-logo';
import { IconChevronLeft, IconChevronRight, IconClose } from '@/components/admin/icons';
import type { Section } from '@/lib/admin/analytics/sections';
import type { AnalyticsReport } from '@/lib/admin/analytics/types';

const subscribeResize = (cb: () => void) => {
  window.addEventListener('resize', cb);
  return () => window.removeEventListener('resize', cb);
};

/**
 * Presentation mode: the same sections as the page, one per slide, full
 * screen. ← → / PgUp PgDn / Space / Home End to move, Esc to leave. Starts at
 * `start` (0 = title, 1 = headline numbers, 2… = sections).
 */
export function Presentation({
  report,
  sections,
  start,
  onClose,
}: {
  report: AnalyticsReport;
  sections: Section[];
  start: number;
  onClose: () => void;
}) {
  const total = sections.length + 2;
  const [index, setIndex] = useState(Math.min(start, total - 1));
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportH = useSyncExternalStore(subscribeResize, () => window.innerHeight, () => 800);

  const go = useCallback((i: number) => setIndex(Math.max(0, Math.min(total - 1, i))), [total]);

  // Full screen on open; leaving full screen (Esc) leaves the presentation.
  useEffect(() => {
    const el = rootRef.current;
    let entered = false;
    el?.requestFullscreen?.().then(() => (entered = true)).catch(() => {});
    const onFs = () => {
      if (entered && !document.fullscreenElement) onClose();
    };
    document.addEventListener('fullscreenchange', onFs);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('fullscreenchange', onFs);
      document.body.style.overflow = overflow;
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) go(index + 1);
      else if (['ArrowLeft', 'PageUp'].includes(e.key)) go(index - 1);
      else if (e.key === 'Home') go(0);
      else if (e.key === 'End') go(total - 1);
      else if (e.key === 'Escape') onClose();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, index, total, onClose]);

  const section = index >= 2 ? sections[index - 2] : null;
  const chartH = Math.max(240, Math.min(560, viewportH - 380));

  return (
    <div
      ref={rootRef}
      className="admin presentation fixed inset-0 z-[60] flex flex-col bg-[var(--paper)]"
      role="dialog"
      aria-modal="true"
      aria-label="Analytics presentation"
    >
      {/* Chrome: the deck's running header */}
      <header className="flex items-center justify-between gap-4 px-8 pt-6 md:px-14">
        <div className="flex items-center gap-2.5">
          <BrandLogo height={24} />
          <span className="label">HandLancer analytics</span>
        </div>
        <span className="label hidden sm:block">{report.range.label}</span>
      </header>
      <div className="mx-8 mt-4 border-t-[1.5px] border-[var(--ink)] md:mx-14" />

      {/* Slide */}
      <main key={index} className="enter flex min-h-0 flex-1 flex-col px-8 py-8 md:px-14">
        {index === 0 && (
          <div className="my-auto max-w-4xl">
            <span className="block h-1.5 w-16 bg-[var(--teal)]" />
            <h1 className="mt-6 !text-[clamp(2.6rem,6vw,4.4rem)] !leading-[1.02]">
              Marketplace <em>performance</em>
            </h1>
            <p className="lede mt-5 !text-[clamp(1.1rem,2vw,1.5rem)]">{report.range.label}</p>
            <p className="mt-2 text-[var(--muted)]">Compared with {report.range.prevLabel}</p>
          </div>
        )}

        {index === 1 && (
          <div className="my-auto">
            <h1 className="!text-[clamp(2rem,4vw,3rem)]">Headline numbers</h1>
            <p className="lede mt-2">Versus {report.range.prevLabel}</p>
            <div className="mt-8">
              <KpiGrid kpis={report.kpis} prevLabel={report.range.prevLabel} large />
            </div>
          </div>
        )}

        {section && (
          <>
            <h1 className="!text-[clamp(2rem,4vw,3rem)]">{section.title}</h1>
            <p className="lede mt-2">{section.subtitle}</p>
            <div className="mt-8 min-h-0 flex-1">
              {section.stats && <StatRow stats={section.stats} large />}
              <div className={section.chart.kind === 'trend' ? '' : 'max-w-[980px]'}>
                <ChartView spec={section.chart} height={chartH} ariaLabel={section.title} />
              </div>
            </div>
            <p className="mt-6 flex gap-3 text-[clamp(1rem,1.6vw,1.25rem)] text-[var(--ink)]">
              <span className="mt-1.5 h-5 w-1 shrink-0 bg-[var(--teal)]" aria-hidden="true" />
              {section.takeaway}
            </p>
          </>
        )}
      </main>

      {/* Controls */}
      <footer className="flex items-center justify-between gap-4 px-8 pb-6 md:px-14">
        <button type="button" onClick={onClose} className="btn btn-ghost !h-9 !py-0" aria-label="Exit presentation">
          <IconClose width={16} height={16} />
          Exit
        </button>
        <div className="flex items-center gap-3">
          <span className="figure text-[13px] text-[var(--muted)]" aria-live="polite">
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
          <button type="button" onClick={() => go(index - 1)} disabled={index === 0} className="btn btn-ghost !h-9 !w-9 !p-0" aria-label="Previous slide">
            <IconChevronLeft width={18} height={18} />
          </button>
          <button type="button" onClick={() => go(index + 1)} disabled={index === total - 1} className="btn btn-primary !h-9 !w-9 !p-0" aria-label="Next slide">
            <IconChevronRight width={18} height={18} />
          </button>
        </div>
      </footer>
      <div className="h-1 bg-[var(--band)]">
        <div className="h-full bg-[var(--teal)] transition-[width] duration-300" style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>
    </div>
  );
}
