'use client';

import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Shared chart plumbing: the series palette, tick maths, and a width hook.
 *
 * Palette — validated with the dataviz skill's validator against the paper
 * surface (lightness band, chroma floor, CVD and normal-vision separation all
 * pass). Brand navy #1e3a5f itself fails as a mark colour (too dark, reads
 * grey), so charts use a lighter step of the same family. Teal is under 3:1
 * against paper, so every chart also carries a legend, tooltips and a table
 * view — identity and values never depend on colour alone.
 */
export const SERIES_COLORS = ['#2e64a8', '#0fb5a4'] as const;

/** Recessive chrome: hairline grid, muted mono ticks. */
export const GRID = 'var(--rule)';

/** 0, 1, 2, 5 × 10ⁿ steps, covering [0, max]. */
export function niceTicks(max: number, count = 4): number[] {
  if (!(max > 0)) return [0, 1];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks;
}

/** Tracks an element's content width. Starts from `fallback` so SSR and print have a layout. */
export function useWidth<T extends HTMLElement>(fallback = 640) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

/** Show at most one x label per `minGap` px; always keep the last. */
export function labelStride(points: number, width: number, minGap = 64): number {
  return Math.max(1, Math.ceil(points / Math.max(1, Math.floor(width / minGap))));
}
