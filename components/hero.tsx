'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { IconArrowRight, IconCheck } from './icons';

/*
 * A white-to-grey "stage" with a drafting grid the pointer develops as it moves.
 * The two artisan cut-outs shipped with the app stand on the bottom edge,
 * framing centred type.
 *
 * Layout: the figures are absolutely positioned in the bottom corners at every
 * size. Below lg the section carries bottom padding so centred content clears
 * them; from lg the column is narrow enough to sit between them. Those widths
 * are load-bearing — see the table in README before changing either.
 */

const FIGURES = [
  {
    src: '/brand/artisan-m.webp',
    alt: 'Verified HandLancer artisan in work uniform, arms folded',
    side: 'left-0 sm:left-2 lg:left-4 xl:left-12',
  },
  {
    src: '/brand/artisan-w.webp',
    alt: 'Verified HandLancer tradeswoman in work uniform, arms folded',
    side: 'right-0 sm:right-2 lg:right-4 xl:right-12',
  },
];

/** Must match --grid-cell in globals.css for the cell highlight to line up. */
const CELL = 72;

export function Hero() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // No cursor to follow on touch; the CSS hides those layers too.
    if (!window.matchMedia('(pointer: fine)').matches) return;

    let x = 0;
    let y = 0;
    let queued = false;
    let raf = 0;

    const flush = () => {
      queued = false;
      el.style.setProperty('--mx', `${x}px`);
      el.style.setProperty('--my', `${y}px`);
      el.style.setProperty('--cx', `${Math.floor(x / CELL) * CELL}px`);
      el.style.setProperty('--cy', `${Math.floor(y / CELL) * CELL}px`);
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      x = e.clientX - r.left;
      y = e.clientY - r.top;
      el.style.setProperty('--hot', '1');
      // Coalesce to one write per frame — pointermove fires far faster than paint.
      if (!queued) {
        queued = true;
        raf = requestAnimationFrame(flush);
      }
    };

    const onLeave = () => el.style.setProperty('--hot', '0');

    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      id="main"
      ref={ref}
      className="stage relative isolate flex min-h-[90svh] flex-col justify-center overflow-hidden border-b border-[var(--rule)] pt-28 pb-[54vw] sm:pb-[40vw] lg:min-h-[86vh] lg:pt-32 lg:pb-28"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="stage-grid absolute inset-0" />
        <div className="stage-grid-hot absolute inset-0" />
        <div className="stage-cell" />
      </div>

      {/* ---------------- Figures ---------------- */}
      {FIGURES.map((f, i) => (
        <figure
          key={f.src}
          className={`pointer-events-none absolute bottom-0 z-0 w-[36vw] sm:w-[28vw] lg:w-[20vw] xl:w-[clamp(240px,22vw,340px)] ${f.side}`}
        >
          <Image
            src={f.src}
            alt={f.alt}
            width={880}
            height={1116}
            priority={i === 0}
            sizes="(max-width: 640px) 36vw, (max-width: 1024px) 28vw, (max-width: 1280px) 20vw, 340px"
            className="h-auto w-full"
          />
        </figure>
      ))}

      {/* ---------------- Centre column ---------------- */}
      <div className="shell relative z-10">
        <div className="mx-auto max-w-[34rem] text-center sm:max-w-[38rem] lg:max-w-[28rem] xl:max-w-[34rem]">
          <p className="kicker text-[var(--muted)]">Escrow-protected hiring</p>

          <h1 className="mt-7 text-[clamp(2.4rem,5.4vw,3.85rem)]">
            Hire an artisan. Hold the money <em>until the work is done</em>.
          </h1>

          <p className="lede mx-auto mt-6 max-w-[36rem]">
            Post a job, compare itemised quotes from verified plumbers, electricians and carpenters
            near you, and keep every naira locked in escrow until you have seen the finished work.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="#waitlist" className="btn btn-primary w-full sm:w-auto">
              Join the waitlist
              <IconArrowRight className="h-4 w-4" />
            </a>
            <a href="#escrow" className="btn btn-ghost w-full sm:w-auto">
              See how escrow works
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-[13px] text-[var(--muted)]">
            {['Free to join', 'Money held until you approve', 'Paid in naira'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <IconCheck className="h-3.5 w-3.5 shrink-0 text-[var(--navy)]" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ---------------- Ticker rail ---------------- */}
      <div className="absolute inset-x-0 bottom-0 z-10 border-t border-[var(--rule)] bg-[rgba(255,255,255,.72)]">
        <div className="shell flex flex-wrap items-center justify-center gap-x-8 gap-y-1 py-3 font-[family-name:var(--font-plex-mono)] text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)] sm:justify-between">
          <span>12 service categories</span>
          <span className="hidden sm:inline">Materials released up front</span>
          <span className="hidden md:inline">Workmanship on approval</span>
          <span>Flutterwave · ₦</span>
        </div>
      </div>
    </section>
  );
}
