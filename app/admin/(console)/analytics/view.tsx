'use client';

import { useCallback, useMemo, useState } from 'react';

import { AnalyticsControls } from '@/components/admin/analytics/controls';
import { KpiGrid } from '@/components/admin/analytics/kpi-grid';
import { Presentation } from '@/components/admin/analytics/presentation';
import { SectionCard } from '@/components/admin/analytics/section-card';
import { BrandLogo } from '@/components/admin/brand-logo';
import { QueryError, ViewSkeleton } from '@/components/admin/query-state';
import { downloadPptx, downloadXlsx, fileBase, printReport } from '@/lib/admin/analytics/export';
import { buildSections } from '@/lib/admin/analytics/sections';
import { useAnalytics, useAnalyticsRange } from '@/lib/admin/query/hooks';

type ExportKind = 'pptx' | 'xlsx' | 'pdf';

export function AnalyticsView() {
  const { params, setParams } = useAnalyticsRange();
  const query = useAnalytics(params);
  const report = query.data;
  const sections = useMemo(() => (report ? buildSections(report) : []), [report]);

  const [presentAt, setPresentAt] = useState<number | null>(null);
  const [exporting, setExporting] = useState<ExportKind | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const closePresentation = useCallback(() => setPresentAt(null), []);

  const runExport = async (kind: ExportKind) => {
    if (!report) return;
    setExportError(null);
    if (kind === 'pdf') return printReport();
    setExporting(kind);
    try {
      if (kind === 'pptx') await downloadPptx(report);
      else await downloadXlsx(report);
    } catch (e) {
      console.error(e);
      setExportError(`The ${kind === 'pptx' ? 'PowerPoint' : 'Excel'} file could not be created. Try again.`);
    } finally {
      setExporting(null);
    }
  };

  const base = report ? fileBase(report) : 'handlancer-analytics';

  return (
    <>
      {/* Print-only masthead for the PDF export */}
      {report && (
        <div className="print-only mb-6">
          <div className="flex items-center gap-2.5">
            <BrandLogo height={22} />
            <span className="text-[16px] font-bold tracking-[-0.03em] text-[var(--navy)]">HandLancer</span>
            <span className="label ml-2">Marketplace analytics</span>
          </div>
          <p className="mt-3 text-[13px] text-[var(--ink)]">
            {report.range.label} · compared with {report.range.prevLabel}
          </p>
          <p className="label mt-1 !text-[9px]">
            Generated {new Date(report.generatedAt).toLocaleString('en-NG', { timeZone: 'Africa/Lagos', dateStyle: 'long', timeStyle: 'short' })}{' '}
            · Lagos time
          </p>
        </div>
      )}

      <AnalyticsControls
        params={params}
        resolved={report?.range}
        onChange={setParams}
        onPresent={() => setPresentAt(0)}
        onExport={runExport}
        exporting={exporting}
        loading={query.isFetching}
      />

      {exportError && (
        <p role="alert" className="mb-4 rounded-md border border-[var(--bad)]/40 bg-[var(--bad)]/[.06] px-3.5 py-3 text-[13.5px] font-medium text-[var(--bad)]">
          {exportError}
        </p>
      )}

      {!report ? (
        query.error ? (
          <QueryError error={query.error} onRetry={() => query.refetch()} />
        ) : (
          <ViewSkeleton rows={8} />
        )
      ) : (
        <div className={`transition-opacity duration-200 ${query.isPlaceholderData ? 'pointer-events-none opacity-55' : ''}`} aria-busy={query.isPlaceholderData || undefined}>
          <p className="mb-4 text-[13px] text-[var(--muted)] print:hidden">
            <span className="font-medium text-[var(--ink)]">{report.range.label}</span> · compared with {report.range.prevLabel} ·{' '}
            {report.interval === 'day' ? 'daily' : report.interval === 'week' ? 'weekly' : 'monthly'} · Lagos time
          </p>
          {report.truncated && (
            <p className="mb-4 rounded-md border border-[var(--bad)]/40 bg-[var(--bad)]/[.06] px-3.5 py-3 text-[13px] text-[var(--bad)]">
              Some tables reached the row limit for this range, so figures are a lower bound. Narrow the range for exact numbers.
            </p>
          )}

          <KpiGrid kpis={report.kpis} prevLabel={report.range.prevLabel} />

          <div className="analytics-grid mt-4 grid grid-cols-1 gap-4 md:mt-6 md:gap-6 lg:grid-cols-2">
            {sections.map((s, i) => (
              <SectionCard
                key={s.id}
                section={s}
                fileBase={base}
                onPresent={() => setPresentAt(i + 2)}
                className={i === 0 ? 'lg:col-span-2' : ''}
                chartHeight={i === 0 ? 300 : 250}
              />
            ))}
          </div>
        </div>
      )}

      {presentAt !== null && report && (
        <Presentation report={report} sections={sections} start={presentAt} onClose={closePresentation} />
      )}
    </>
  );
}
