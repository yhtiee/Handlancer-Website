'use client';

/**
 * Every review an artisan has received, newest first, with the 5→1
 * distribution. Ported from mobile components/reviews/provider-reviews-screen.tsx
 * — the bars matter more than the average: a 4.5 from twenty reviews reads
 * differently to a 4.5 from two.
 */
import { Avatar, EmptyState, ListSkeleton, PageHeader, Rating } from '@/components/app/ui';
import { useAuth } from '@/lib/app/auth';
import { timeAgo } from '@/lib/app/domain/date';
import { routes } from '@/lib/app/domain/routes';
import { useProviderReviews } from '@/lib/app/queries/use-reviews';

export function ReviewsView() {
  const { session } = useAuth();
  const { data: reviews, isLoading } = useProviderReviews(session?.user.id ?? '');
  const count = reviews?.length ?? 0;
  const average = count ? reviews!.reduce((s, r) => s + r.rating, 0) / count : 0;
  const buckets = [5, 4, 3, 2, 1].map((star) => ({ star, n: (reviews ?? []).filter((r) => r.rating === star).length }));

  return (
    <div className="mx-auto max-w-[760px]">
      <PageHeader back={{ href: routes.profile, label: 'Profile' }} title="My reviews" />
      <div className="space-y-6">
        {count > 0 && (
          <section className="card enter flex flex-col gap-6 p-5 sm:flex-row sm:items-center">
            <div className="text-center sm:w-36">
              <p className="figure text-[44px] font-semibold leading-none text-[var(--ink)]">{average.toFixed(1)}</p>
              <div className="mt-2">
                <Rating value={average} count={count} />
              </div>
            </div>
            <ul className="flex-1 space-y-1.5">
              {buckets.map(({ star, n }) => (
                <li key={star} className="flex items-center gap-2.5 text-[13px] text-[var(--muted)]">
                  <span className="figure w-3">{star}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--band-deep)]">
                    <span className="block h-full rounded-full bg-[var(--navy)]" style={{ width: `${(n / count) * 100}%` }} />
                  </span>
                  <span className="figure w-6 text-right">{n}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="card enter overflow-hidden">
          {isLoading ? (
            <ListSkeleton rows={4} />
          ) : !count ? (
            <EmptyState title="No reviews yet">
              Once you complete jobs, the clients you work with can rate you here. A strong rating helps you win more work.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-[var(--rule)]">
              {reviews!.map((r) => (
                <li key={r.id} className="flex gap-3 px-4 py-4 md:px-5">
                  <Avatar src={r.reviewer?.avatar_url} name={r.reviewer?.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-semibold text-[var(--ink)]">{r.reviewer?.name ?? 'Client'}</p>
                      <span className="text-[12.5px] text-[var(--muted)]">{timeAgo(r.created_at)}</span>
                    </div>
                    <p className="text-[13px] text-[var(--muted)]">{r.rating} of 5</p>
                    {r.comment && <p className="mt-1.5 text-[15px] text-[var(--ink)]">{r.comment}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
