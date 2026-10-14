// Ported from Handlancer-Mobile-Application/src/queries/use-reviews.ts @ 8968d5c — keep the diff minimal so later syncs stay easy.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/app/auth';
import { queryKeys } from '@/lib/app/queries/keys';
import { createReview, getMyReviewForJob, listReviewsForProvider } from '@/lib/app/services/reviews';

export function useProviderReviews(providerId: string) {
  return useQuery({
    queryKey: queryKeys.reviews(providerId),
    queryFn: () => listReviewsForProvider(providerId),
    enabled: !!providerId,
  });
}

export function useMyReviewForJob(jobId: string) {
  const { session } = useAuth();
  const reviewerId = session?.user.id;
  return useQuery({
    queryKey: ['review', 'mine', jobId] as const,
    queryFn: () => getMyReviewForJob(jobId, reviewerId!),
    enabled: !!reviewerId && !!jobId,
  });
}

export function useCreateReview() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      providerId: string;
      jobId: string;
      rating: number;
      comment?: string | null;
    }) => createReview({ ...input, reviewerId: session!.user.id }),
    onSuccess: (review) => {
      qc.invalidateQueries({ queryKey: queryKeys.reviews(review.provider_id) });
      qc.invalidateQueries({ queryKey: queryKeys.profile(review.provider_id) });
      qc.invalidateQueries({ queryKey: ['review', 'mine', review.job_id] });
    },
  });
}
