import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Footer } from '@/components/cta';
import { Nav } from '@/components/nav';
import { AVAILABILITY } from '@/lib/app/domain/availability';
import { formatMoney } from '@/lib/app/domain/money';
import { providerImageFallback } from '@/lib/app/domain/provider-images';
import { rateUnitLabel } from '@/lib/app/domain/rates';
import { routes } from '@/lib/app/domain/routes';
import { mainServiceLabel, serviceLabel, withoutOther } from '@/lib/app/domain/trades';
import { getPublicProvider } from '@/lib/public-provider';
import { buildMetadata } from '@/lib/seo';

/*
 * The page an artisan sends people. It works without an account and leads to
 * one thing: hiring them through a direct job request.
 *
 * Kept out of search on purpose. An artisan agreed to be seen by people using
 * the app, and sharing a link is their choice; being indexed under their own
 * name is a different one.
 */

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const provider = await getPublicProvider(id);
  if (!provider) return { title: 'Artisan not found', robots: { index: false, follow: false } };

  const name = provider.name?.trim() || 'Artisan';
  const trade = mainServiceLabel(provider.services);
  const place = provider.location?.trim();
  const description = `Hire ${name} on HandLancer${place ? ` in ${place}` : ''}. Your money stays in escrow until you approve the work.`;
  return buildMetadata({
    path: routes.publicProvider(provider.id),
    title: trade ? `${name}, ${trade}` : name,
    description,
    noindex: true,
    shareImage: { url: `${routes.publicProvider(provider.id)}/opengraph-image`, alt: `Hire ${name} on HandLancer` },
  });
}

const heading = 'mb-3 text-[20px]';
const card = 'rounded-lg border border-[var(--rule)] bg-[var(--paper)] p-5';

export default async function ArtisanPage({ params }: Props) {
  const { id } = await params;
  const provider = await getPublicProvider(id);
  if (!provider) notFound();

  const name = provider.name?.trim() || 'This artisan';
  const first = name.split(' ')[0];
  const offered = withoutOther(provider.services).map(serviceLabel);
  const trade = mainServiceLabel(provider.services);
  const years = provider.years_experience;
  const eyebrow = [trade, years ? `${years} ${years === 1 ? 'year' : 'years'}` : null, provider.business_name].filter(Boolean).join(' · ');
  const availability = provider.availability ? AVAILABILITY[provider.availability] : null;
  const photos = provider.work_photos ?? [];
  const bio = provider.bio?.trim();
  const reviews = provider.review_count;
  const hire = routes.hireFromShare(provider.id);

  const steps = [
    `Tell ${first} what you need. Only ${first} sees your request.`,
    `${first} sends you an itemised quote.`,
    `Pay into escrow, not to ${first}. They’re paid when you approve the work.`,
  ];

  return (
    <>
      <Nav />
      <main className="flex-1 pb-24 sm:pb-0">
        <div className="shell">
          <div className="max-w-[760px] space-y-10 pt-28 pb-16 md:pt-32">
          <header className="flex flex-col gap-5 sm:flex-row sm:items-end">
            {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL on any host. */}
            <img
              src={provider.avatar_url ?? providerImageFallback(provider)}
              alt=""
              width={112}
              height={112}
              className="size-28 shrink-0 rounded-md bg-[var(--band)] object-cover object-top"
            />
            <div className="min-w-0">
              {eyebrow && <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--muted)]">{eyebrow}</p>}
              <h1 className="mt-1.5 text-[clamp(2rem,6vw,2.75rem)]">{name}</h1>
              {availability && (
                <p className="mt-2 inline-flex items-center gap-2 text-[14px] font-medium text-[var(--ink)]">
                  <span className={`size-2 rounded-full ${availability.dot}`} aria-hidden="true" />
                  {availability.label}
                </p>
              )}
              <p className="mt-2 text-[15px] text-[var(--muted)]">
                {reviews > 0 && provider.rating != null ? (
                  <>
                    <b className="font-semibold text-[var(--ink)]">{Number(provider.rating).toFixed(1)}</b> from {reviews} {reviews === 1 ? 'review' : 'reviews'}
                  </>
                ) : (
                  <b className="font-semibold text-[var(--ink)]">New on HandLancer</b>
                )}
                {provider.location ? ` · ${provider.location}` : null}
                {provider.is_verified ? ' · ID verified' : null}
                {' · '}
                {provider.hourly_rate ? (
                  <>
                    <b className="font-semibold text-[var(--ink)]">From {formatMoney(Number(provider.hourly_rate))}</b> {rateUnitLabel(provider.rate_unit)}
                  </>
                ) : (
                  'priced by quote'
                )}
              </p>
            </div>
          </header>

          <div className="hidden sm:block">
            <Link href={hire} className="btn btn-primary">
              Hire {first}
            </Link>
          </div>

          {offered.length > 0 && (
            <section>
              <h2 className={heading}>What {first} does</h2>
              <ul className="flex flex-wrap gap-2">
                {offered.map((service) => (
                  <li key={service} className="inline-flex h-9 items-center rounded-full border border-[var(--rule-strong)] bg-[var(--paper)] px-3.5 text-[14px] text-[var(--ink)]">
                    {service}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {bio && (
            <section>
              <h2 className={heading}>About {first}</h2>
              <p className="whitespace-pre-wrap text-[16px] leading-relaxed text-[var(--ink)]">{bio}</p>
            </section>
          )}

          {photos.length > 0 && (
            <section>
              <h2 className={heading}>{first}’s work</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {photos.map((url) => (
                  <div key={url} className="aspect-square overflow-hidden rounded-md bg-[var(--band-deep)]">
                    {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL. */}
                    <img src={url} alt="" loading="lazy" className="size-full object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className={card}>
            <h2 className={heading}>How hiring {first} works</h2>
            <ol className="space-y-3">
              {steps.map((step, i) => (
                <li key={step} className="flex gap-3 text-[15px] text-[var(--ink)]">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--navy)] text-[13px] font-semibold text-white">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <div className="mt-5 hidden sm:block">
              <Link href={hire} className="btn btn-primary">
                Hire {first}
              </Link>
            </div>
          </section>
          </div>
        </div>
      </main>

      {/* The one action, in the thumb zone, on phones. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--rule)] bg-[var(--paper)] px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:hidden">
        <Link href={hire} className="btn btn-primary w-full">
          Hire {first}
        </Link>
      </div>
      <Footer />
    </>
  );
}
