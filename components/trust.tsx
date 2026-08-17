import { Reveal } from './reveal';

const PILLARS: [string, string][] = [
  [
    'The PIN is not a formality',
    'A withdrawal verifies the transfer PIN inside the same database transaction that debits the wallet. There is no code path that moves money without it, and bank details live in a separate locked-down table — never on the profile every signed-in user can read.',
  ],
  [
    'Photos are attached to the job, not to a chat',
    'Before-and-after media is filed against the job record itself, timestamped, visible to both parties. Nothing gets lost in a WhatsApp thread that one side can delete.',
  ],
  [
    'A dispute freezes the money where it is',
    'Opening a dispute holds escrow in place while the case is reviewed. Nothing is released because someone got tired of arguing.',
  ],
  [
    'A review cannot be bought',
    'Rating and payout are written in one atomic transaction. If the review fails, the payout fails with it — so every star on a profile belongs to a real, funded, completed job.',
  ],
  [
    'Naira, on rails you already use',
    'Wallet top-ups and payouts run on Flutterwave. No crypto, no foreign cards, no asking your cousin abroad to pay for it.',
  ],
];

export function Trust() {
  return (
    <section id="trust" className="rule-b scroll-mt-20 py-20 md:py-28">
      <div className="shell">
        <Reveal>
          <p className="marker">
            <b>04</b> <span>Trust &amp; safety</span>
          </p>
        </Reveal>

        <div className="mt-9 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
          <Reveal>
            <h2 className="max-w-[20ch] text-[clamp(2rem,4.4vw,3.05rem)]">
              Everyone has heard both <em>horror stories</em>
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <div className="lg:pt-2">
              <p className="lede max-w-[46ch]">
                The artisan who collects a deposit and stops answering. The customer who goes quiet
                the day the work finishes.
              </p>
              <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-[var(--muted)]">
                HandLancer is built so neither one is possible. Not discouraged — not possible.
              </p>
            </div>
          </Reveal>
        </div>

        <dl className="mt-14 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
          {PILLARS.map(([t, d], i) => (
            <Reveal key={t} delay={Math.min(i, 3) * 60}>
              <div className="grid gap-3 py-7 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-10">
                <dt className="text-[18px] font-bold leading-snug tracking-[-0.02em] text-[var(--navy)]">
                  {t}
                </dt>
                <dd className="max-w-[62ch] text-[15px] leading-relaxed text-[var(--muted)]">{d}</dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
