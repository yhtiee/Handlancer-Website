'use client';

/**
 * Rate the work — and, while money is still held, release the final payment
 * in the same transaction (review_and_release). Ported from mobile
 * (user)/job/review/[jobId].tsx. On a job already paid it is a plain review.
 */
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { PinConfirmDialog, SuccessDialog } from '@/components/app/escrow';
import { Icon } from '@/components/app/icon';
import { MediaGallery } from '@/components/app/media';
import { Button, ErrorNote, Money, Note, PageHeader, Section } from '@/components/app/ui';
import { formatMoney } from '@/lib/app/domain/money';
import { routes } from '@/lib/app/domain/routes';
import { useJob } from '@/lib/app/queries/use-jobs';
import { useJobMedia } from '@/lib/app/queries/use-media';
import { useCreateReview } from '@/lib/app/queries/use-reviews';
import { useEscrow, useReviewAndRelease } from '@/lib/app/queries/use-wallet';

const WORDS = ['', 'Poor', 'Not great', 'Okay', 'Good', 'Excellent'];

export function ReviewForm() {
  const router = useRouter();
  const { id: jobId } = useParams<{ id: string }>();
  const { data: job } = useJob(jobId);
  const { data: escrow } = useEscrow(jobId);
  const { data: media } = useJobMedia(jobId);
  const createReview = useCreateReview();
  const reviewAndRelease = useReviewAndRelease(jobId);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [released, setReleased] = useState(false);

  // Money still held means this is the approve-and-pay step.
  const releasing = Boolean(escrow) && !escrow!.workmanship_released;
  const amount = escrow ? escrow.total - (escrow.materials_released ? escrow.materials_amount : 0) : 0;
  const pending = createReview.isPending || reviewAndRelease.isPending;
  const after = (media ?? []).filter((m) => m.phase === 'after');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating < 1) return setError('Tap a star to rate the work');
    if (!job?.hired_provider_id) return setError('No artisan to review on this job');
    // Disputed money is support's to settle; review_and_release refuses it too.
    if (job.status === 'disputed') return setError('This job is under dispute. Support settles the escrow — it cannot be released here.');
    if (releasing) return setConfirming(true);
    try {
      await createReview.mutateAsync({ providerId: job.hired_provider_id, jobId, rating, comment: comment.trim() || null });
      router.replace(routes.jobDetail(jobId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit your review.');
    }
  }

  async function confirmRelease(pin: string) {
    setError(null);
    try {
      await reviewAndRelease.mutateAsync({ rating, comment: comment.trim() || null, pin });
      setConfirming(false);
      setReleased(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not release the payment.');
    }
  }

  const shown = hover || rating;

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-[720px]">
      <PageHeader
        back={{ href: routes.jobDetail(jobId), label: 'Back to job' }}
        title={releasing ? 'Check the work and pay' : 'Leave a review'}
        description={job?.title}
      />

      <div className="space-y-6">
        {releasing && after.length > 0 && (
          <Section title="Their after photos">
            <MediaGallery media={after} />
          </Section>
        )}

        <Section title="How was the work?">
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
                onMouseEnter={() => setHover(n)}
                onClick={() => {
                  setRating(n);
                  setError(null);
                }}
                className="grid size-11 place-items-center rounded-md hover:bg-[var(--band)]"
              >
                <Icon name="star" size={30} className={n <= shown ? 'fill-[#e2a03f] text-[#c77700]' : 'text-[var(--rule-strong)]'} />
              </button>
            ))}
            <span className="ml-2 text-[15px] font-semibold text-[var(--ink)]">{WORDS[shown]}</span>
          </div>
          <textarea
            aria-label="Your review"
            className="input mt-4 min-h-[110px]"
            placeholder="Share details about your experience (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </Section>

        {releasing && (
          <section className="card enter space-y-3 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[15px] text-[var(--muted)]">Final payment to release</p>
              <Money amount={amount} className="text-[22px] font-semibold text-[var(--ink)]" />
            </div>
            <Note icon="warning">
              Submitting sends this payment to the artisan and marks the job complete. This can’t be undone — open a dispute instead if something is wrong.
            </Note>
          </section>
        )}

        <ErrorNote>{error}</ErrorNote>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          {releasing ? (
            <button type="button" onClick={() => router.push(routes.disputeJob(jobId))} className="inline-flex items-center gap-2 text-[14px] text-[var(--muted)] hover:text-[var(--ink)]">
              <Icon name="flag" size={16} />
              Something wrong? Open a dispute
            </button>
          ) : (
            <span />
          )}
          <Button type="submit" size="lg" icon={releasing ? 'checkmark-circle' : undefined} loading={pending}>
            {releasing ? `Approve & release ${formatMoney(amount)}` : 'Submit review'}
          </Button>
        </div>
      </div>

      <PinConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={confirmRelease}
        title="Release final payment?"
        message="This pays the artisan and marks the job complete. It cannot be undone — open a dispute instead if something is wrong."
        confirmLabel="Approve & pay"
        loading={reviewAndRelease.isPending}
        error={error}
        details={[
          { label: 'Your rating', value: `${rating} of 5` },
          { label: 'Releasing now', value: <Money amount={amount} /> },
        ]}
      />

      <SuccessDialog
        open={released}
        onClose={() => {
          setReleased(false);
          router.replace(routes.jobDetail(jobId));
        }}
        title="Payment released"
        message="The artisan has been paid and this job is now complete. Thanks for leaving a review."
        amount={amount}
      />
    </form>
  );
}
