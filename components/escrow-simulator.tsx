'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Reveal } from './reveal';
import { IconArrowRight } from './icons';

/*
 * Models the app's real lifecycle:
 *   fund_escrow -> release_materials -> request_completion_review -> review_and_release
 * The balances are the arithmetic those RPCs actually perform, and each step
 * appends a line to the ledger log — the same events the app writes to the
 * `transactions` table.
 */

const MATERIALS = 18_500;
const LABOUR = 30_000;
const TOTAL = MATERIALS + LABOUR;
const START = 60_000;

type Step = {
  rpc: string;
  title: string;
  actor: string;
  body: string;
  wallet: number;
  escrow: number;
  artisan: number;
  /** Appended to the log when this step is reached. */
  log: { at: string; event: string; amount: number | null; note: string; kind: 'hold' | 'ok' | '' };
};

const STEPS: Step[] = [
  {
    rpc: 'quotes.approve',
    title: 'You approve a quote',
    actor: 'Customer',
    body: 'Three artisans quoted. You pick one; the rest are auto-rejected and the job moves to hiring. No money has moved yet.',
    wallet: START,
    escrow: 0,
    artisan: 0,
    log: { at: '09:14:02', event: 'quote.approved', amount: TOTAL, note: '3 quotes, 1 hired', kind: '' },
  },
  {
    rpc: 'fund_escrow()',
    title: 'The job is funded',
    actor: 'Customer',
    body: 'The full amount leaves your wallet and is locked by HandLancer. The artisan can see the job is funded — proof you are serious — but cannot withdraw a naira of it.',
    wallet: START - TOTAL,
    escrow: TOTAL,
    artisan: 0,
    log: { at: '09:14:40', event: 'escrow.funded', amount: TOTAL, note: 'wallet -> held', kind: 'hold' },
  },
  {
    rpc: 'release_materials()',
    title: 'You release materials money',
    actor: 'Customer',
    body: 'The artisan asks for materials so they are not buying your pipes and fittings out of pocket. Only the material line items move. Their labour stays locked.',
    wallet: START - TOTAL,
    escrow: LABOUR,
    artisan: MATERIALS,
    log: { at: '11:02:18', event: 'materials.released', amount: MATERIALS, note: 'held -> artisan', kind: 'ok' },
  },
  {
    rpc: 'request_completion_review()',
    title: 'The artisan submits the work',
    actor: 'Artisan',
    body: 'They upload after-photos against the before-photos taken on arrival, and ask you to review. Still no money moves — the workmanship portion is entirely in your hands.',
    wallet: START - TOTAL,
    escrow: LABOUR,
    artisan: MATERIALS,
    log: { at: '16:38:55', event: 'completion.requested', amount: null, note: '4 photos attached', kind: '' },
  },
  {
    rpc: 'review_and_release()',
    title: 'You rate it and release the rest',
    actor: 'Customer',
    body: 'Your rating and the payout happen in one transaction — they succeed or fail together, so no artisan is ever paid without a review attached. Unhappy instead? Open a dispute and the money stays frozen.',
    wallet: START - TOTAL,
    escrow: 0,
    artisan: TOTAL,
    log: { at: '17:05:11', event: 'workmanship.released', amount: LABOUR, note: 'rated 5/5, job closed', kind: 'ok' },
  },
];

function useCountUp(target: number, ms = 520) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      fromRef.current = target;
      setValue(target);
      return;
    }

    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / ms, 1);
      setValue(Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = target;
    };
  }, [target, ms]);

  return value;
}

const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`;

function Balance({ label, amount, note }: { label: string; amount: number; note: string }) {
  const shown = useCountUp(amount);
  return (
    <div className="px-5 py-5">
      <p className="font-[family-name:var(--font-plex-mono)] text-[10.5px] uppercase tracking-[0.13em] text-[var(--muted)]">
        {label}
      </p>
      <p className="figure mt-2.5 text-[clamp(1.35rem,3.4vw,1.75rem)] font-semibold leading-none text-[var(--navy)]">
        {naira(shown)}
      </p>
      <p className="mt-2 text-[12px] leading-snug text-[var(--muted)]">{note}</p>
    </div>
  );
}

export function EscrowSimulator() {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const atEnd = i === STEPS.length - 1;
  const next = useCallback(() => setI((v) => (v + 1) % STEPS.length), []);

  return (
    <section id="escrow" className="band rule-b scroll-mt-20 py-20 md:py-28">
      <div className="shell">
        <Reveal>
          <p className="marker">
            <b>01</b> <span>The escrow engine</span>
          </p>
        </Reveal>

        <div className="mt-9 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
          <Reveal>
            <h2 className="max-w-[19ch] text-[clamp(2rem,4.4vw,3.05rem)]">
              Nobody pays first. Nobody works <em>for free</em>.
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="lede max-w-[42ch] lg:pt-2">
              Every quote is itemised into materials and labour — and escrow is split along the same
              seam. Step through a real job below.
            </p>
          </Reveal>
        </div>

        {/* ---------------- Panel ---------------- */}
        <Reveal delay={120} className="mt-12">
          <div className="overflow-hidden border border-[var(--rule-strong)] bg-[var(--paper)]">
            {/* Balances */}
            <div className="grid divide-y divide-[var(--rule)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <Balance label="Your wallet" amount={step.wallet} note="Topped up via Flutterwave" />
              <Balance label="Held in escrow" amount={step.escrow} note="Neither side can touch it" />
              <Balance
                label="Artisan wallet"
                amount={step.artisan}
                note="Withdrawn with a transfer PIN"
              />
            </div>

            {/* Split bar */}
            <div className="border-t border-[var(--rule)] px-5 py-5">
              <div className="flex h-2.5 overflow-hidden rounded-sm bg-[var(--band-deep)]">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${(MATERIALS / TOTAL) * 100}%`,
                    background: i >= 2 ? 'var(--ok)' : i >= 1 ? 'var(--teal)' : 'var(--rule-strong)',
                  }}
                />
                <div
                  className="h-full border-l border-[var(--paper)] transition-all duration-500"
                  style={{
                    width: `${(LABOUR / TOTAL) * 100}%`,
                    background: atEnd ? 'var(--ok)' : i >= 1 ? 'var(--navy)' : 'var(--rule-strong)',
                  }}
                />
              </div>
              <div className="mt-2.5 flex flex-wrap justify-between gap-x-4 gap-y-1 font-[family-name:var(--font-plex-mono)] text-[11.5px] text-[var(--muted)]">
                <span>
                  MATERIALS {naira(MATERIALS)}
                  {i >= 2 && <span className="text-[var(--ok-ink)]"> · released</span>}
                </span>
                <span>
                  WORKMANSHIP {naira(LABOUR)}
                  {atEnd && <span className="text-[var(--ok-ink)]"> · released</span>}
                </span>
              </div>
            </div>

            {/* Steps + detail */}
            <div className="grid min-w-0 border-t border-[var(--rule)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
              <ol className="divide-y divide-[var(--rule)] border-b border-[var(--rule)] lg:border-b-0 lg:border-r">
                {STEPS.map((s, n) => {
                  const current = n === i;
                  const done = n < i;
                  return (
                    <li key={s.rpc}>
                      <button
                        type="button"
                        onClick={() => setI(n)}
                        aria-current={current ? 'step' : undefined}
                        className="flex w-full cursor-pointer items-baseline gap-3.5 px-5 py-3.5 text-left transition-colors duration-150 hover:bg-[var(--band)]"
                        style={{ background: current ? 'var(--teal-wash)' : undefined }}
                      >
                        <span
                          className="figure shrink-0 text-[12px]"
                          style={{ color: done || current ? 'var(--navy)' : 'var(--muted)' }}
                        >
                          {String(n + 1).padStart(2, '0')}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className="block text-[14.5px] font-semibold"
                            style={{
                              color: current ? 'var(--navy)' : done ? 'var(--ink)' : 'var(--muted)',
                            }}
                          >
                            {s.title}
                          </span>
                          <code className="block truncate font-[family-name:var(--font-plex-mono)] text-[11px] text-[var(--muted)]">
                            {s.rpc}
                          </code>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>

              <div className="flex flex-col min-w-0 p-5 sm:p-7">
                <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.13em] text-[var(--muted)]">
                  {step.actor} action
                </p>
                <h3 className="mt-2.5 text-[21px]">{step.title}</h3>
                <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-[var(--muted)]">
                  {step.body}
                </p>

                {/* Ledger log — accumulates as you advance. */}
                <div className="log mt-6 max-w-full overflow-x-auto p-4">
                  {STEPS.slice(0, i + 1).map((s) => (
                    <div key={s.rpc} className="whitespace-nowrap">
                      <span className="t">[{s.log.at}]</span>{' '}
                      <span className={s.log.kind}>{s.log.event.padEnd(21, ' ')}</span>
                      <span className="amt">
                        {(s.log.amount === null ? '--' : naira(s.log.amount)).padEnd(10, ' ')}
                      </span>
                      <span className="t">{s.log.note}</span>
                    </div>
                  ))}
                  <div className="t">
                    <span className="caret">&#9611;</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={next} className="btn btn-primary">
                    {atEnd ? 'Run it again' : 'Next step'}
                    <IconArrowRight className="h-4 w-4" />
                  </button>
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => setI(0)}
                      className="cursor-pointer text-[14px] font-medium text-[var(--muted)] underline underline-offset-4 transition-colors duration-150 hover:text-[var(--ink)]"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Guarantees — plain rows on a rule, no icon tiles */}
        <div className="mt-14 grid gap-x-10 gap-y-8 border-t border-[var(--rule)] sm:grid-cols-3">
          {[
            [
              'Itemised quotes',
              'Every line is labelled material or labour. You see what you are paying for before you fund anything.',
            ],
            [
              'Before & after proof',
              'Artisans photograph the site on arrival and on completion, so both sides have a timestamped record.',
            ],
            [
              'Reviews that cost something',
              'Only a customer who funded and completed a job can leave a rating. Reviews cannot be bought.',
            ],
          ].map(([t, d], n) => (
            <Reveal key={t} delay={n * 70}>
              <div className="pt-6">
                <h3 className="text-[16.5px]">{t}</h3>
                <p className="mt-2 max-w-[38ch] text-[14.5px] leading-relaxed text-[var(--muted)]">
                  {d}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
