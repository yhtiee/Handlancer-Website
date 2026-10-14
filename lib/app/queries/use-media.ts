// Ported from Handlancer-Mobile-Application/src/queries/use-media.ts @ 8968d5c — keep the diff minimal so later syncs stay easy.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/app/auth';
import { queryKeys } from '@/lib/app/queries/keys';
import { listJobMedia, listProviderMedia, uploadJobMedia, type MediaAsset } from '@/lib/app/services/media';
import type { MediaPhase } from '@/lib/app/services/database.types';

export function useJobMedia(jobId: string) {
  return useQuery({
    queryKey: queryKeys.jobMedia(jobId),
    queryFn: () => listJobMedia(jobId),
    enabled: !!jobId,
  });
}

export function useProviderMedia(providerId: string) {
  return useQuery({
    queryKey: queryKeys.providerMedia(providerId),
    queryFn: () => listProviderMedia(providerId),
    enabled: !!providerId,
  });
}

export function useUploadMedia(jobId: string) {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ phase, asset }: { phase: MediaPhase; asset: MediaAsset }) =>
      uploadJobMedia({ providerId: session!.user.id, jobId, phase, asset }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.jobMedia(jobId) });
      if (session) qc.invalidateQueries({ queryKey: queryKeys.providerMedia(session.user.id) });
    },
  });
}
