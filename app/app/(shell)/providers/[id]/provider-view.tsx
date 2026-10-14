'use client';

/**
 * An artisan, seen by a client deciding whether to ask for a quote. Ported
 * from mobile (user)/provider/[id].tsx: the facts in one sentence, their
 * finished work as before/after cases joined to that client's review, how the
 * money moves, about. Only real work and real reviews — invented ones would
 * misrepresent a real person.
 */
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { Icon } from '@/components/app/icon';
import { MediaViewer } from '@/components/app/media';
import { Thumb } from '@/components/app/rows';
import { Button, ButtonLink, Details, EmptyState, Money, Section, Skeleton, Tape } from '@/components/app/ui';
import { Categories } from '@/lib/app/constants/categories';
import { useAuth } from '@/lib/app/auth';
import { formatMoney } from '@/lib/app/domain/money';
import { providerImageFallback } from '@/lib/app/domain/provider-images';
import { routes } from '@/lib/app/domain/routes';
import { serviceLabel } from '@/lib/app/domain/trades';
import { useStartConversation } from '@/lib/app/queries/use-chat';
import { useProviderMedia } from '@/lib/app/queries/use-media';
import { useProvider } from '@/lib/app/queries/use-providers';
import { useProviderReviews } from '@/lib/app/queries/use-reviews';
import type { JobMedia, Profile } from '@/lib/app/services/database.types';
import type { ReviewWithReviewer } from '@/lib/app/services/reviews';

const TRADE_IDS = new Set<string>(Categories.map((c) => c.id));

const AVAILABILITY: Record<NonNullable<Profile['availability']>, { label: string; dot: string }> = {
  available: { label: 'Available now', dot: 'bg-[var(--ok)]' },
  on_call: { label: 'On call', dot: 'bg-[var(--ok)]' },
  busy: { label: 'Busy this week', dot: 'bg-[var(--warn)]' },
  offline: { label: 'Not taking work', dot: 'bg-[var(--rule-strong)]' },
};

type Case = { jobId: string; media: JobMedia[]; before?: JobMedia; after?: JobMedia; review?: ReviewWithReviewer; at: string };

export function ProviderView() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { profile: me } = useAuth();
  const { data: provider, isLoading } = useProvider(id);
  const { data: media } = useProviderMedia(id);
  const { data: reviews } = useProviderReviews(id);
  const startChat = useStartConversation();
  const [viewing, setViewing] = useState<{ media: JobMedia[]; index: number; title?: string } | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);

  const { cases, quietReviews } = useMemo(() => buildCases(media ?? [], reviews ?? []), [media, reviews]);

  if (isLoading) return <Skeleton className="h-72" />;
  if (!provider) {
    return (
      <div className="card">
        <EmptyState title="Artisan not found" />
      </div>
    );
  }

  const first = provider.name?.trim().split(' ')[0] ?? 'them';
  const tradeIds = (provider.services ?? []).filter((s) => TRADE_IDS.has(s));
  const listed = (provider.services ?? []).filter((s) => !TRADE_IDS.has(s));
  // The main trade is the first one picked, skipping the catch-all "Other".
  const mainTrade = tradeIds.find((t) => t !== 'other') ?? tradeIds[0] ?? listed[0];
  const trade = mainTrade ? serviceLabel(mainTrade) : undefined;
  const portfolio = (provider.work_photos ?? []).map(
    (url, i): JobMedia => ({ id: `portfolio-${i}`, url, kind: 'photo', phase: 'after', job_id: '', provider_id: provider.id, created_at: provider.created_at }),
  );
  const years = provider.years_experience;
  const eyebrow = [trade, years ? `${years} ${years === 1 ? 'year' : 'years'}` : null, provider.business_name].filter(Boolean).join(' · ');
  const availability = provider.availability ? AVAILABILITY[provider.availability] : null;
  const km = distanceKm(me, provider);
  const reviewCount = reviews?.length ?? 0;
  const bio = provider.bio?.trim();
  const isClient = me?.role !== 'provider';

  async function message() {
    setChatError(null);
    try {
      const convo = await startChat.mutateAsync({ providerId: provider!.id, jobId: null });
      router.push(routes.chatThread(convo.id));
    } catch (e) {
      setChatError(e instanceof Error ? e.message : 'Could not open the chat.');
    }
  }

  const actions = isClient ? (
    <>
      <ButtonLink href={routes.postDirectJob(provider.id)} size="lg" block>
        Ask {first} for a quote
      </ButtonLink>
      <Button variant="ghost" icon="chatbubble" block loading={startChat.isPending} onClick={() => void message()}>
        Message {first}
      </Button>
      {chatError && <p className="text-[13.5px] text-[var(--bad)]">{chatError}</p>}
    </>
  ) : null;

  return (
    <div className="pb-24 lg:pb-0">
      <header className="enter mb-6 flex flex-col gap-5 sm:flex-row sm:items-end md:mb-8">
        <Thumb src={provider.avatar_url ?? providerImageFallback(provider)} size={112} />
        <div className="min-w-0">
          {eyebrow && <p className="label">{eyebrow}</p>}
          <h1 className="mt-1.5 flex items-center gap-2">
            {provider.name ?? 'Artisan'}
            {provider.is_verified && <Icon name="shield-checkmark" size={22} className="text-[var(--navy)]" aria-label="ID verified" />}
          </h1>
          {availability && (
            <p className="mt-2 inline-flex items-center gap-2 text-[14px] font-medium text-[var(--ink)]">
              <span className={`size-2 rounded-full ${availability.dot}`} aria-hidden="true" />
              {availability.label}
            </p>
          )}
          {/* The facts, said once, as a sentence. */}
          <p className="mt-2 text-[15px] text-[var(--muted)]">
            {reviewCount ? (
              <>
                <b className="figure font-semibold text-[var(--ink)]">{provider.rating.toFixed(1)}</b> from {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
              </>
            ) : (
              <b className="font-semibold text-[var(--ink)]">New on HandLancer</b>
            )}
            {km != null ? (
              <>
                {' · '}
                <b className="font-semibold text-[var(--ink)]">{km < 1 ? 'Under 1 km' : `${km.toFixed(1)} km`}</b> from you
              </>
            ) : provider.location ? (
              ` · ${provider.location}`
            ) : null}
            {provider.is_verified ? ' · ID verified' : null}
            {' · '}
            {provider.hourly_rate ? (
              <>
                <b className="figure font-semibold text-[var(--ink)]">From {formatMoney(provider.hourly_rate)}</b> an hour
              </>
            ) : (
              'priced by quote'
            )}
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <section className="enter">
            <h2 className="mb-4 !text-[22px]">
              Their work, <em>before and after.</em>
            </h2>
            {cases.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {cases.map((c) => (
                  <CaseCard key={c.jobId} item={c} onOpen={() => setViewing({ media: c.media, index: 0 })} />
                ))}
              </div>
            ) : portfolio.length ? (
              <p className="text-[14.5px] text-[var(--muted)]">
                Before and after photos from {first}’s HandLancer jobs appear here as they finish them. Until then, here is work {first} shared with us.
              </p>
            ) : (
              <div className="rounded-md bg-[var(--navy)] p-6 text-white">
                <p className="text-[22px] italic" style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}>
                  {trade ?? 'Their trade'}
                </p>
                <p className="mt-2 text-[14.5px] text-white/85">
                  No job photos yet. {first}’s before and after photos appear here as they finish jobs on HandLancer.
                </p>
              </div>
            )}
          </section>

          {portfolio.length > 0 && (
            <Section title={`Work ${first} shared`}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {portfolio.map((m, i) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setViewing({ media: portfolio, index: i, title: `Shared by ${first}` })}
                    aria-label={`Open photo ${i + 1} of ${portfolio.length}`}
                    className="aspect-square overflow-hidden rounded-md bg-[var(--band-deep)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL. */}
                    <img src={m.url} alt="" loading="lazy" className="size-full object-cover transition-transform duration-200 hover:scale-[1.03]" />
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[13px] text-[var(--muted)]">
                Photos {first} sent with their application{provider.provider_status === 'approved' ? ', checked by HandLancer before approval' : ''}. Not from jobs paid through HandLancer.
              </p>
            </Section>
          )}

          {(tradeIds.length > 0 || listed.length > 0) && (
            <Section title={`What ${first} does`}>
              {tradeIds.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {tradeIds.map((t) => (
                    <li key={t} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--navy)] px-3.5 text-[14px] font-semibold text-white">
                      {t === mainTrade && <span className="rounded bg-white/20 px-1.5 text-[10.5px] uppercase tracking-wide">Main</span>}
                      {serviceLabel(t)}
                    </li>
                  ))}
                </ul>
              )}
              {listed.length > 0 && (
                <ul className={`flex flex-wrap gap-1.5 ${tradeIds.length ? 'mt-3' : ''}`}>
                  {listed.map((s) => (
                    <li key={s} className="inline-flex h-8 items-center rounded-full border border-[var(--rule-strong)] bg-[var(--paper)] px-3 text-[13.5px] text-[var(--ink)]">
                      {serviceLabel(s)}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          )}

          {bio && (
            <Section title={`About ${first}`}>
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--ink)]">{bio}</p>
            </Section>
          )}

          {quietReviews.length > 0 && (
            <Section title="More from clients">
              <div className="divide-y divide-[var(--rule)]">
                {quietReviews.slice(0, 6).map((r) => (
                  <div key={r.id} className="py-3 first:pt-0 last:pb-0">
                    {r.comment && <p className="text-[15px] italic text-[var(--ink)]">“{r.comment}”</p>}
                    <p className="mt-1 text-[13px] text-[var(--muted)]">
                      {[r.reviewer?.name?.split(' ')[0] ?? 'Client', `${r.rating} of 5`, monthYear(r.created_at)].join(' · ')}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {actions && <div className="card hidden space-y-2.5 p-4 lg:block">{actions}</div>}
          <Section title="Details">
            <Details
              items={[
                { label: 'Area', value: provider.location || '—' },
                { label: 'Experience', value: years != null ? `${years} ${years === 1 ? 'year' : 'years'}` : '—' },
                { label: 'Rate', value: provider.hourly_rate ? <Money amount={provider.hourly_rate} className="text-[var(--ink)]" /> : 'Priced by quote' },
                { label: 'Rating', value: reviewCount ? `${provider.rating.toFixed(1)} from ${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}` : 'No reviews yet' },
                ...(provider.business_name ? [{ label: 'Business', value: provider.business_name }] : []),
                { label: 'Availability', value: availability?.label ?? '—' },
                { label: 'On HandLancer since', value: monthYear(provider.created_at) },
              ]}
            />
          </Section>
          <Section title={`How you’d pay ${first}`}>
            <p className="mb-4 text-[14.5px] text-[var(--muted)]">You pay into escrow, not to {first}. They’re paid in stages, each one when you approve it.</p>
            <Tape
              progress={0.35}
              stops={[0.35]}
              marks={[
                { at: 0.35, value: 'Materials', label: 'when they buy' },
                { at: 1, value: 'The rest', label: 'when you approve' },
              ]}
            />
          </Section>
        </aside>
      </div>

      {/* The one action, in the thumb zone, on phones. */}
      {actions && (
        <div className="hl-actionbar fixed inset-x-0 z-20 border-t border-[var(--rule)] bg-[var(--paper)] px-4 py-3 lg:hidden">
          <div className="mx-auto flex max-w-[560px] gap-2">
            <Button variant="ghost" icon="chatbubble" loading={startChat.isPending} onClick={() => void message()}>
              <span className="sr-only">Message {first}</span>
            </Button>
            <div className="flex-1">
              <ButtonLink href={routes.postDirectJob(provider.id)} size="lg" block>
                Ask {first} for a quote
              </ButtonLink>
            </div>
          </div>
        </div>
      )}

      <MediaViewer
        media={viewing?.media ?? []}
        index={viewing ? viewing.index : null}
        onIndex={(i) => setViewing((v) => (v ? { ...v, index: i } : v))}
        onClose={() => setViewing(null)}
        title={viewing?.title}
      />
    </div>
  );
}

function CaseCard({ item, onOpen }: { item: Case; onOpen: () => void }) {
  const hero = item.after ?? item.before;
  const inset = item.after && item.before ? item.before : null;
  const when = monthYear(item.review?.created_at ?? item.at);
  return (
    <figure className="space-y-2.5">
      <button type="button" onClick={onOpen} aria-label="Open the photos from this job" className="relative block aspect-[5/4] w-full overflow-hidden rounded-md bg-[var(--band-deep)]">
        {hero && (
          // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URLs.
          <img src={hero.url} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
        )}
        <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[rgba(10,18,32,0.6)] to-transparent" />
        <span className="absolute bottom-2.5 left-3 text-[13px] font-semibold text-white">{item.after ? 'After' : 'Before'}</span>
        {inset && (
          <span className="absolute bottom-2.5 right-2.5 size-[30%] overflow-hidden rounded border-2 border-[var(--paper)]">
            {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URLs. */}
            <img src={inset.url} alt="" loading="lazy" className="size-full object-cover" />
            <span className="absolute left-1 top-1 rounded bg-black/55 px-1 text-[10px] font-semibold text-white">Before</span>
          </span>
        )}
        {item.media.length > 2 && (
          <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[12px] font-semibold text-white">
            <Icon name="image" size={13} />
            {item.media.length}
          </span>
        )}
      </button>
      <figcaption>
        {item.review?.comment && <p className="line-clamp-4 text-[15px] italic text-[var(--ink)]">“{item.review.comment}”</p>}
        <p className="mt-1 text-[13px] text-[var(--muted)]">
          {item.review ? [item.review.reviewer?.name?.split(' ')[0] ?? 'Client', `${item.review.rating} of 5`, when].filter(Boolean).join(' · ') : `Finished ${when}`}
        </p>
      </figcaption>
    </figure>
  );
}

/** One case per job, newest first, joined to that job's review. */
function buildCases(media: JobMedia[], reviews: ReviewWithReviewer[]) {
  const byJob = new Map<string, JobMedia[]>();
  for (const m of media) {
    const list = byJob.get(m.job_id) ?? [];
    list.push(m);
    byJob.set(m.job_id, list);
  }
  const cases: Case[] = [];
  for (const [jobId, list] of byJob) {
    const photos = list.filter((m) => m.kind === 'photo');
    if (!photos.length) continue;
    cases.push({
      jobId,
      media: list,
      before: photos.find((m) => m.phase === 'before'),
      after: photos.find((m) => m.phase === 'after'),
      review: reviews.find((r) => r.job_id === jobId),
      at: list.reduce((a, b) => (a.created_at > b.created_at ? a : b)).created_at,
    });
  }
  // Jobs with both halves of the story first, then newest.
  cases.sort((a, b) => Number(!!b.after && !!b.before) - Number(!!a.after && !!a.before) || b.at.localeCompare(a.at));
  const shown = new Set(cases.map((c) => c.jobId));
  const quietReviews = reviews.filter((r) => !shown.has(r.job_id) && r.comment?.trim());
  return { cases, quietReviews };
}

/** Straight-line distance between two profiles, when both have coordinates. */
function distanceKm(a?: Profile | null, b?: Profile | null): number | null {
  if (a?.latitude == null || a.longitude == null || b?.latitude == null || b.longitude == null) return null;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

function monthYear(iso: string) {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleString('en-NG', sameYear ? { month: 'long' } : { month: 'short', year: 'numeric' });
}
