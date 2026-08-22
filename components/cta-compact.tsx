import Link from 'next/link';
import { Reveal } from './reveal';
import { IconArrowRight } from './icons';

/**
 * Compact variant of the closing CTA on the landing page.
 *
 * Same primitives as <Cta />: display heading with one italic phrase, serif
 * lede, primary + ghost button pair. Trimmed to a single band because a
 * sub-page has already made its argument by the time the reader gets here.
 *
 * Links are rooted (`/#waitlist`, not `#waitlist`) so they work from any route.
 */
export function CtaCompact({
  heading,
  emphasis,
  lede,
  secondaryHref = '/#escrow',
  secondaryLabel = 'How escrow works',
}: {
  heading: string;
  /** The italic phrase, appended to the heading. */
  emphasis: string;
  lede: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="band rule-b scroll-mt-20 py-16 md:py-20">
      <div className="shell">
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-end lg:gap-16">
            <div>
              <h2 className="max-w-[18ch] text-[clamp(1.7rem,3.6vw,2.4rem)]">
                {heading} <em>{emphasis}</em>
              </h2>
              <p className="lede mt-5 max-w-[44ch]">{lede}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link href="/#waitlist" className="btn btn-primary">
                Join the waitlist
                <IconArrowRight className="h-4 w-4" />
              </Link>
              <Link href={secondaryHref} className="btn btn-ghost">
                {secondaryLabel}
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
