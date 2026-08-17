'use client';

import { useId, useState } from 'react';
import { Reveal } from './reveal';
import { IconArrowRight } from './icons';

const naira = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`;

function Slider({
  label,
  hint,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (n: number) => string;
  onChange: (n: number) => void;
}) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[14.5px] font-semibold text-[var(--ink)]">
          {label}
        </label>
        <output htmlFor={id} className="figure text-[17px] font-semibold text-[var(--navy)]">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[var(--navy)] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--navy)]"
        style={{
          background: `linear-gradient(90deg, var(--teal) ${pct}%, var(--band-deep) ${pct}%)`,
        }}
      />
      <p className="mt-2 text-[12.5px] text-[var(--muted)]">{hint}</p>
    </div>
  );
}

export function Earnings() {
  const [jobs, setJobs] = useState(6);
  const [labour, setLabour] = useState(25_000);

  const monthly = jobs * labour;

  return (
    <section id="earn" className="band rule-b scroll-mt-20 py-20 md:py-28">
      <div className="shell">
        <Reveal>
          <p className="marker">
            <b>05</b> <span>For artisans</span>
          </p>
        </Reveal>

        <div className="mt-9 grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <Reveal>
            <h2 className="max-w-[17ch] text-[clamp(2rem,4.4vw,3.05rem)]">
              The work was never the hard part. <em>Getting paid</em> was.
            </h2>
            <p className="lede mt-6 max-w-[46ch]">
              On HandLancer the money is funded and sitting in escrow before you pick up a tool, and
              materials land in your wallet before you buy a single bag of cement.
            </p>

            <ul className="mt-8 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
              {[
                ['Free to join', 'No subscription, no bidding credits, no commission on quoting.'],
                [
                  'See the budget first',
                  'Job budget and location are on the card before you write a quote.',
                ],
                [
                  'Filter to your trade',
                  'Switch on “matches my skills” and the feed only shows work you can do.',
                ],
                [
                  'Withdraw to your bank',
                  'Payouts to a Nigerian account, confirmed with a transfer PIN.',
                ],
              ].map(([t, d]) => (
                <li key={t} className="flex flex-wrap items-baseline gap-x-3 py-3.5">
                  <span className="text-[15px] font-semibold text-[var(--navy)]">{t}</span>
                  <span className="text-[14.5px] text-[var(--muted)]">{d}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Worksheet */}
          <Reveal delay={100}>
            <div className="border border-[var(--rule-strong)] bg-[var(--paper)]">
              <div className="border-b border-[var(--rule)] px-6 py-4">
                <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.13em] text-[var(--muted)]">
                  Earnings worksheet
                </p>
              </div>

              <div className="space-y-7 px-6 py-7">
                <Slider
                  label="Jobs per month"
                  hint="A steady artisan on the platform books one to two a week."
                  value={jobs}
                  min={1}
                  max={30}
                  step={1}
                  format={(n) => String(n)}
                  onChange={setJobs}
                />
                <Slider
                  label="Average labour per job"
                  hint="Your quote's workmanship lines, excluding materials."
                  value={labour}
                  min={5_000}
                  max={150_000}
                  step={2_500}
                  format={naira}
                  onChange={setLabour}
                />
              </div>

              {/* Sum line, set like an invoice total */}
              <div className="border-t border-[var(--rule)] px-6 py-6">
                <div className="flex items-baseline justify-between gap-4 font-[family-name:var(--font-plex-mono)] text-[12px] text-[var(--muted)]">
                  <span>
                    {jobs} &times; {naira(labour)}
                  </span>
                  <span>PER MONTH</span>
                </div>
                <p className="figure mt-2 text-[clamp(2rem,5vw,2.7rem)] font-semibold leading-none text-[var(--navy)]">
                  {naira(monthly)}
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-[var(--muted)]">
                  Every naira of it funded before the work starts. This counts workmanship only —
                  materials money is reimbursement, not profit.
                </p>
              </div>

              <div className="border-t border-[var(--rule)] px-6 py-6">
                <a href="#waitlist" className="btn btn-primary w-full">
                  Join as an artisan
                  <IconArrowRight className="h-4 w-4" />
                </a>
                <p className="mt-3 text-center text-[12px] text-[var(--muted)]">
                  Illustrative only — actual earnings depend on the jobs you win.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
