import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Crumb } from '@/lib/schema';
import { Reveal } from './reveal';

/**
 * The head of every sub-page.
 *
 * Same shape as a landing-page section head — mono marker on a 1.5px ink rule,
 * display heading with one italic emphasis phrase, serif lede in the right
 * column — except the heading is the page's single <h1>.
 *
 * Breadcrumbs are rendered visibly, not just as JSON-LD. BreadcrumbList schema
 * is only honest if the trail is on the page, and the same rule that removed
 * MobileApplication applies here.
 */
export function PageHeader({
  marker,
  label,
  title,
  lede,
  trail,
}: {
  /** Two-digit section number, matching the landing page's 01–07 convention. */
  marker: string;
  label: string;
  /** Pass JSX so the emphasis phrase can be wrapped in <em>. */
  title: ReactNode;
  lede: ReactNode;
  /** Full trail including Home. The last crumb is the current page. */
  trail: Crumb[];
}) {
  return (
    <section className="rule-b scroll-mt-20 pt-32 pb-16 md:pt-36 md:pb-20">
      <div className="shell">
        <Reveal>
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.13em] text-[var(--muted)]">
              {trail.map((crumb, i) => {
                const isCurrent = i === trail.length - 1;
                return (
                  <li key={crumb.path} className="flex items-center gap-2">
                    {isCurrent ? (
                      <span aria-current="page" className="text-[var(--ink)]">
                        {crumb.name}
                      </span>
                    ) : (
                      <Link
                        href={crumb.path}
                        className="transition-colors duration-200 hover:text-[var(--ink)]"
                      >
                        {crumb.name}
                      </Link>
                    )}
                    {!isCurrent && <span className="text-[var(--rule-strong)]">/</span>}
                  </li>
                );
              })}
            </ol>
          </nav>
        </Reveal>

        <Reveal>
          <p className="marker">
            <b>{marker}</b> <span>{label}</span>
          </p>
        </Reveal>

        <div className="mt-9 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
          <Reveal>
            <h1 className="max-w-[19ch] text-[clamp(2.1rem,4.8vw,3.3rem)]">{title}</h1>
          </Reveal>
          <Reveal delay={80}>
            <p className="lede max-w-[46ch] lg:pt-2">{lede}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
