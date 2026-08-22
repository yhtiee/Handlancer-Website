import Image from 'next/image';
import { CATEGORIES, TRADES, CITIES } from '@/lib/site';
import { CATEGORY_ICONS, IconGrid } from './icons';
import { Reveal } from './reveal';

export function Services() {
  return (
    <section id="services" className="rule-b scroll-mt-20 py-20 md:py-28">
      <div className="shell">
        <Reveal>
          <p className="marker">
            <b>02</b> <span>What you can hire for</span>
          </p>
        </Reveal>

        <div className="mt-9 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
          <Reveal>
            <h2 className="max-w-[18ch] text-[clamp(2rem,4.4vw,3.05rem)]">
              Twelve trades, <em>one</em> job post
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="lede max-w-[42ch] lg:pt-2">
              From a burst pipe at midnight to a full kitchen refit. Post once and let verified
              artisans near you compete with itemised quotes.
            </p>
          </Reveal>
        </div>

        {/* Grid lines are real: gap-px over a rule-coloured background. */}
        <div
          className="mt-12 grid gap-px border border-[var(--rule)] sm:grid-cols-2 lg:grid-cols-3"
          style={{ background: 'var(--rule)' }}
        >
          {CATEGORIES.map((c, i) => {
            const Icon = CATEGORY_ICONS[c.id] ?? IconGrid;
            return (
              <Reveal key={c.id} delay={(i % 3) * 60}>
                <article className="group h-full bg-[var(--paper)] p-6 transition-colors duration-200 hover:bg-[var(--band)]">
                  <div className="flex items-center gap-2.5">
                    {/* Navy, not teal: teal is 2.3:1 on paper and reads washed out. */}
                    <Icon className="h-[18px] w-[18px] shrink-0 text-[var(--navy)]" />
                    <h3 className="text-[17px]">{c.label}</h3>
                  </div>
                  <p className="mt-2.5 max-w-[34ch] text-[14.5px] leading-relaxed text-[var(--muted)]">
                    {c.blurb}
                  </p>
                  <p className="mt-4 max-w-[36ch] border-t border-[var(--rule)] pt-3.5 text-[13.5px] leading-relaxed text-[var(--muted)]">
                    {c.demand}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>

        {/* Cities — plain typographic list, no pills */}
        <Reveal>
          <div className="mt-12 border-t border-[var(--rule)] pt-6">
            <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.13em] text-[var(--muted)]">
              Coverage
            </p>
            <p className="mt-3 max-w-[62ch] text-[19px] leading-relaxed text-[var(--ink)]">
              {CITIES.map((c, n) => (
                <span key={c}>
                  <span className="font-semibold text-[var(--navy)]">{c}</span>
                  {n < CITIES.length - 1 && <span className="text-[var(--rule-strong)]"> · </span>}
                </span>
              ))}
            </p>
            <p className="mt-3 max-w-[52ch] text-[14.5px] text-[var(--muted)]">
              Providers set their own service radius, so you only ever see artisans who actually
              cover your street.
            </p>
          </div>
        </Reveal>
      </div>

      {/* -------- Provider marquee -------- */}
      <div className="mt-16">
        <Reveal className="shell">
          <p className="max-w-[46ch] text-[19px] leading-snug text-[var(--ink)]">
            The artisans here are welders, tailors, chefs and mechanics building a verified
            reputation one job at a time.
          </p>
        </Reveal>

        <div
          className="marquee relative mt-8 overflow-hidden"
          style={{
            maskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)',
            WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)',
          }}
        >
          <ul className="marquee-track gap-3">
            {[...TRADES, ...TRADES].map((t, i) => {
              /* The set is duplicated so the -50% loop is seamless. The copy is
                 decoration: hide it from assistive tech and crawlers, or all
                 sixteen artisans get announced twice. */
              const isLoopCopy = i >= TRADES.length;
              return (
              <li
                key={`${t.slug}-${i}`}
                aria-hidden={isLoopCopy || undefined}
                className="w-[196px] shrink-0 sm:w-[224px]"
              >
                <figure>
                  <div className="overflow-hidden rounded-sm border border-[var(--rule)]">
                    <Image
                      src={`/brand/providers/${t.slug}.webp`}
                      alt={
                        isLoopCopy ? '' : `${t.label} available for hire on HandLancer in Nigeria`
                      }
                      width={224}
                      height={272}
                      loading="lazy"
                      sizes="(max-width: 640px) 196px, 224px"
                      className="h-[248px] w-full object-cover sm:h-[272px]"
                    />
                  </div>
                  <figcaption className="mt-2.5 flex items-baseline justify-between gap-2 border-t border-[var(--rule)] pt-2">
                    <span className="text-[14px] font-semibold text-[var(--navy)]">{t.label}</span>
                    <span className="font-[family-name:var(--font-plex-mono)] text-[10.5px] uppercase tracking-wider text-[var(--muted)]">
                      {t.craft}
                    </span>
                  </figcaption>
                </figure>
              </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
