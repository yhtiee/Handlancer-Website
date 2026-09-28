'use client';

import { formatDelta, formatValue } from '@/lib/admin/analytics/format';
import { rangeSlug } from '@/lib/admin/analytics/range';
import { buildSections, kpiTable, type ChartSpec, type Section, type TableSpec } from '@/lib/admin/analytics/sections';
import type { AnalyticsReport } from '@/lib/admin/analytics/types';

/**
 * Every analytics export. The heavy libraries (pptxgenjs, write-excel-file,
 * html-to-image) are imported on click, so the page itself never ships them.
 */

type Pptx = InstanceType<typeof import('pptxgenjs').default>;
type Slide = ReturnType<Pptx['addSlide']>;

const BRAND = {
  navy: '1E3A5F',
  ink: '10151B',
  muted: '5B6772',
  rule: 'E5E9EC',
  paper: 'FBFCFD',
  band: 'F1F4F6',
  teal: '0FB5A4',
  good: '0E6B33',
  bad: 'B3262B',
  series: ['2E64A8', '0FB5A4'],
};

export function fileBase(r: AnalyticsReport): string {
  return `handlancer-analytics_${rangeSlug(r.range)}`;
}

function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─────────────────────────── CSV ───────────────────────────

/**
 * Raw numbers for money and counts (so a spreadsheet can sum them), percent as
 * "42.5%". UTF-8 BOM so Excel reads ₦ and accented names correctly.
 */
export function tableToCsv(t: TableSpec): string {
  const esc = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const cell = (v: string | number | null, format: string) => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'number') {
      if (format === 'percent') return `${(v * 100).toFixed(1)}%`;
      if (format === 'hours') return v.toFixed(1);
      return String(Math.round(v * 100) / 100);
    }
    return esc(v);
  };
  const lines = [
    t.columns.map((c) => esc(c.label)).join(','),
    ...t.rows.map((row) => t.columns.map((c) => cell(row[c.key], c.format)).join(',')),
  ];
  return '﻿' + lines.join('\r\n');
}

export function downloadCsv(t: TableSpec, fileName: string) {
  download(new Blob([tableToCsv(t)], { type: 'text/csv;charset=utf-8' }), `${fileName}.csv`);
}

// ─────────────────────────── PNG ───────────────────────────

/** A chart card as a 2× PNG, with the site's fonts embedded. Controls are left out. */
export async function downloadPng(node: HTMLElement, fileName: string) {
  const { toPng } = await import('html-to-image');
  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    backgroundColor: `#${BRAND.paper}`,
    filter: (el) => !(el instanceof HTMLElement && el.dataset.exportIgnore !== undefined),
  });
  const blob = await (await fetch(dataUrl)).blob();
  download(blob, `${fileName}.png`);
}

// ─────────────────────────── Excel ───────────────────────────

const XLSX_FORMAT: Record<string, string | undefined> = {
  naira: '"₦"#,##0',
  count: '#,##0',
  percent: '0.0%',
  hours: '0.0',
};

function sheetName(s: string, used: Set<string>): string {
  // Excel: ≤ 31 chars, none of : \ / ? * [ ]
  const base = s.replace(/[:\\/?*[\]]/g, ' ').slice(0, 31).trim();
  let name = base;
  for (let i = 2; used.has(name); i++) name = `${base.slice(0, 28)} ${i}`;
  used.add(name);
  return name;
}

export async function downloadXlsx(r: AnalyticsReport) {
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
  const sections = buildSections(r);
  const used = new Set<string>();

  type Cell = { value?: string | number; type?: StringConstructor | NumberConstructor; format?: string; fontWeight?: 'bold'; color?: string };
  const header = (label: string): Cell => ({ value: label, fontWeight: 'bold', color: `#${BRAND.navy}` });
  const tableRows = (t: TableSpec): Cell[][] => [
    t.columns.map((c) => header(c.label)),
    ...t.rows.map((row) =>
      t.columns.map((c): Cell => {
        const v = row[c.key];
        if (typeof v === 'number') return { value: v, type: Number, format: XLSX_FORMAT[c.format] };
        return { value: v ?? '', type: String };
      }),
    ),
  ];

  const summary: Cell[][] = [
    [{ value: 'HandLancer — marketplace analytics', fontWeight: 'bold', color: `#${BRAND.navy}` }],
    [{ value: r.range.label }],
    [{ value: `Compared with ${r.range.prevLabel}` }],
    [{ value: `Generated ${new Date(r.generatedAt).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })} (Lagos time)` }],
    [],
    ...tableRows(kpiTable(r)),
  ];
  if (r.truncated) summary.splice(4, 0, [{ value: 'Note: some tables hit the row cap; figures are a lower bound.' }]);

  const sheets = [
    { data: summary, sheet: sheetName('Summary', used), columns: [{ width: 26 }, { width: 18 }, { width: 18 }, { width: 12 }, { width: 80 }] },
    ...sections.map((s) => ({
      data: [[{ value: s.title, fontWeight: 'bold' as const, color: `#${BRAND.navy}` }], [{ value: s.subtitle }], [], ...tableRows(s.table)],
      sheet: sheetName(s.title, used),
      columns: s.table.columns.map((c, i) => ({ width: i === 0 ? 30 : c.format === 'text' ? 60 : 20 })),
    })),
  ];

  const blob = await writeXlsxFile(sheets as Parameters<typeof writeXlsxFile>[0]).toBlob();
  download(blob, `${fileBase(r)}.xlsx`);
}

// ─────────────────────────── PowerPoint ───────────────────────────

/** The trimmed brand mark as PNG (PowerPoint does not reliably take WebP). */
async function logoPng(): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const img = new Image();
    img.src = '/brand/logo-mark.webp';
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext('2d')!.drawImage(img, 0, 0);
    return { data: canvas.toDataURL('image/png'), w: img.naturalWidth, h: img.naturalHeight };
  } catch {
    return null;
  }
}

const PPT_FORMAT: Record<string, string> = {
  naira: '"₦"#,##0',
  count: '#,##0',
  percent: '0%',
  hours: '0.0',
};

export async function downloadPptx(r: AnalyticsReport) {
  const { default: PptxGenJS } = await import('pptxgenjs');
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 × 7.5 in
  pptx.author = 'HandLancer';
  pptx.company = 'HandLancer';
  pptx.title = `HandLancer analytics — ${r.range.label}`;

  const FONT = 'Arial';
  const MONO = 'Consolas';
  const W = 13.33;
  const logo = await logoPng();
  const sections = buildSections(r);

  const chrome = (slide: Slide, title: string, subtitle?: string, n?: number) => {
    slide.background = { color: BRAND.paper };
    if (logo) slide.addImage({ data: logo.data, x: 0.6, y: 0.42, w: 0.36 * (logo.w / logo.h), h: 0.36 });
    slide.addText('HANDLANCER ANALYTICS', {
      x: 1.2, y: 0.4, w: 6, h: 0.4, fontFace: MONO, fontSize: 9, color: BRAND.muted, charSpacing: 3,
    });
    slide.addText(r.range.label, { x: W - 6.6, y: 0.4, w: 6, h: 0.4, fontFace: MONO, fontSize: 9, color: BRAND.muted, align: 'right' });
    slide.addShape(pptx.ShapeType.line, { x: 0.6, y: 0.95, w: W - 1.2, h: 0, line: { color: BRAND.ink, width: 1.25 } });
    slide.addText(title, { x: 0.6, y: 1.1, w: W - 1.2, h: 0.7, fontFace: FONT, fontSize: 28, bold: true, color: BRAND.navy });
    if (subtitle) slide.addText(subtitle, { x: 0.6, y: 1.75, w: W - 1.2, h: 0.4, fontFace: FONT, fontSize: 13, color: BRAND.muted });
    if (n) slide.addText(String(n).padStart(2, '0'), { x: W - 1.2, y: 6.95, w: 0.6, h: 0.3, fontFace: MONO, fontSize: 9, color: BRAND.muted, align: 'right' });
  };

  // 1 — Title
  {
    const s = pptx.addSlide();
    s.background = { color: BRAND.paper };
    if (logo) s.addImage({ data: logo.data, x: 0.8, y: 0.8, w: 0.7 * (logo.w / logo.h), h: 0.7 });
    s.addText('HandLancer', { x: 0.8 + 0.8 * (logo ? logo.w / logo.h : 0) + 0.1, y: 0.8, w: 5, h: 0.7, fontFace: FONT, fontSize: 24, bold: true, color: BRAND.navy });
    s.addShape(pptx.ShapeType.rect, { x: 0.8, y: 3.05, w: 0.9, h: 0.08, fill: { color: BRAND.teal }, line: { color: BRAND.teal } });
    s.addText('Marketplace performance', { x: 0.8, y: 3.3, w: 11, h: 1, fontFace: FONT, fontSize: 44, bold: true, color: BRAND.navy });
    s.addText(r.range.label, { x: 0.8, y: 4.35, w: 11, h: 0.5, fontFace: FONT, fontSize: 18, color: BRAND.ink });
    s.addText(`Compared with ${r.range.prevLabel}`, { x: 0.8, y: 4.85, w: 11, h: 0.4, fontFace: FONT, fontSize: 13, color: BRAND.muted });
    s.addText(`Generated ${new Date(r.generatedAt).toLocaleString('en-NG', { timeZone: 'Africa/Lagos', dateStyle: 'long', timeStyle: 'short' })} · Lagos time`, {
      x: 0.8, y: 6.7, w: 11, h: 0.3, fontFace: MONO, fontSize: 9, color: BRAND.muted,
    });
  }

  // 2 — Headline numbers
  {
    const s = pptx.addSlide();
    chrome(s, 'Headline numbers', `Versus ${r.range.prevLabel}`, 2);
    const cols = 4;
    const bw = (W - 1.2 - 0.3 * (cols - 1)) / cols;
    r.kpis.forEach((k, i) => {
      const x = 0.6 + (i % cols) * (bw + 0.3);
      const y = 2.45 + Math.floor(i / cols) * 2.2;
      const d = formatDelta(k.value, k.previous, k.format, k.goodWhen);
      s.addShape(pptx.ShapeType.rect, { x, y, w: bw, h: 1.95, fill: { color: 'FFFFFF' }, line: { color: BRAND.rule, width: 0.75 } });
      s.addText(k.label.toUpperCase(), { x: x + 0.2, y: y + 0.15, w: bw - 0.4, h: 0.35, fontFace: MONO, fontSize: 9, color: BRAND.muted, charSpacing: 2 });
      s.addText(formatValue(k.value, k.format, true), { x: x + 0.2, y: y + 0.55, w: bw - 0.4, h: 0.75, fontFace: FONT, fontSize: 30, bold: true, color: BRAND.ink });
      s.addText(
        d ? `${d.text}  vs ${formatValue(k.previous, k.format, true)}` : 'No comparison',
        { x: x + 0.2, y: y + 1.35, w: bw - 0.4, h: 0.4, fontFace: MONO, fontSize: 10, color: d?.good === true ? BRAND.good : d?.good === false ? BRAND.bad : BRAND.muted },
      );
    });
    s.addNotes(r.kpis.map((k) => `${k.label}: ${k.definition}`).join('\n'));
  }

  // 3… — One slide per section, with a native (editable) chart
  sections.forEach((sec, i) => {
    const s = pptx.addSlide();
    const subtitle = sec.stats
      ? `${sec.subtitle} · ${sec.stats.map((x) => `${x.label}: ${x.value}`).join(' · ')}`
      : sec.subtitle;
    chrome(s, sec.title, subtitle, i + 3);
    addNativeChart(pptx, s, sec.chart, { x: 0.6, y: 2.3, w: W - 1.2, h: 3.95 });
    s.addShape(pptx.ShapeType.rect, { x: 0.6, y: 6.4, w: 0.06, h: 0.42, fill: { color: BRAND.teal }, line: { color: BRAND.teal } });
    s.addText(sec.takeaway, { x: 0.8, y: 6.35, w: W - 1.4, h: 0.52, fontFace: FONT, fontSize: 13, color: BRAND.ink });
    const partialNote =
      sec.chart.kind === 'trend' && sec.chart.partial
        ? '\n\nThe last period on the chart is still in progress, so its figures are not yet complete.'
        : '';
    s.addNotes(`${sec.takeaway}\n\n${subtitle}${partialNote}`);
  });

  // Last — definitions, so the deck stands on its own
  {
    const s = pptx.addSlide();
    chrome(s, 'How these numbers are calculated', undefined, sections.length + 3);
    s.addTable(
      [
        [
          { text: 'Metric', options: { bold: true, color: BRAND.navy } },
          { text: 'Definition', options: { bold: true, color: BRAND.navy } },
        ],
        ...r.kpis.map((k) => [{ text: k.label }, { text: k.definition }]),
      ],
      { x: 0.6, y: 2.0, w: W - 1.2, colW: [2.8, W - 4.0], fontFace: FONT, fontSize: 11, color: BRAND.ink, border: { type: 'solid', color: BRAND.rule, pt: 0.75 }, rowH: 0.42, valign: 'middle' },
    );
    if (r.truncated) {
      s.addText('Some tables reached the export row cap; figures are a lower bound.', { x: 0.6, y: 6.6, w: 10, h: 0.3, fontSize: 10, color: BRAND.bad, fontFace: FONT });
    }
  }

  await pptx.writeFile({ fileName: `${fileBase(r)}.pptx`, compression: true });
}

function addNativeChart(
  pptx: Pptx,
  slide: Slide,
  chart: ChartSpec,
  box: { x: number; y: number; w: number; h: number },
) {
  const axis = {
    catAxisLabelColor: BRAND.muted,
    valAxisLabelColor: BRAND.muted,
    catAxisLabelFontFace: 'Arial',
    valAxisLabelFontFace: 'Arial',
    catAxisLabelFontSize: 10,
    valAxisLabelFontSize: 10,
    valGridLine: { color: BRAND.rule, style: 'solid' as const, size: 0.75 },
    catGridLine: { style: 'none' as const },
    legendFontFace: 'Arial',
    legendFontSize: 11,
    legendColor: BRAND.ink,
  };

  if (chart.kind === 'trend') {
    const data = chart.series.map((s) => ({ name: s.name, labels: chart.labels, values: s.values }));
    const type = chart.mode === 'columns' ? pptx.ChartType.bar : chart.mode === 'area' ? pptx.ChartType.area : pptx.ChartType.line;
    slide.addChart(type, data, {
      ...box,
      ...axis,
      chartColors: BRAND.series,
      chartColorsOpacity: chart.mode === 'area' ? 35 : undefined,
      showLegend: chart.series.length > 1,
      legendPos: 't',
      valAxisLabelFormatCode: PPT_FORMAT[chart.format],
      valAxisMinVal: 0,
      lineSize: 2,
      lineDataSymbol: 'none',
      barDir: 'col',
      barGrouping: 'clustered',
      barGapWidthPct: 80,
    });
    return;
  }

  const items =
    chart.kind === 'funnel'
      ? chart.steps.map((s) => ({ label: s.label, value: s.value }))
      : chart.items.map((i) => ({ label: i.label, value: i.value }));
  const format = chart.kind === 'funnel' ? 'count' : chart.format;
  if (items.length === 0) {
    slide.addText('Nothing recorded in this period', { ...box, align: 'center', color: BRAND.muted, fontSize: 14, fontFace: 'Arial' });
    return;
  }
  // PowerPoint draws the first category at the bottom of a horizontal bar
  // chart; reverse so the largest reads first, top-down, like the page.
  const ordered = [...items].reverse();
  slide.addChart(pptx.ChartType.bar, [{ name: 'Value', labels: ordered.map((i) => i.label), values: ordered.map((i) => i.value) }], {
    ...box,
    ...axis,
    barDir: 'bar',
    chartColors: [BRAND.series[0]],
    showLegend: false,
    showValue: true,
    dataLabelPosition: 'outEnd',
    dataLabelColor: BRAND.ink,
    dataLabelFontFace: 'Arial',
    dataLabelFontSize: 10,
    dataLabelFormatCode: PPT_FORMAT[format],
    valAxisHidden: true,
    valGridLine: { style: 'none' },
    barGapWidthPct: 60,
  });
}

// ─────────────────────────── PDF ───────────────────────────

/**
 * The browser's print-to-PDF against the page's print stylesheet (admin.css):
 * vector charts, A4 landscape, one section per block, controls hidden.
 */
export function printReport() {
  window.print();
}

export type { Section };
