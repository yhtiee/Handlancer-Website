'use client';

/**
 * "Waiting on you" / "Your move" — the newest things only this person can do.
 * Ported from the mobile Jobs tabs (`useAttention`, `useYourMove`) so the web
 * Home and My jobs screens share one source. Both are bounded scans of the most
 * recent page, so they stay cheap at any number of jobs.
 */
import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { AttentionItem } from '@/components/app/rows';
import { jobNextStep, providerNextStep } from '@/lib/app/domain/job-state';
import { routes } from '@/lib/app/domain/routes';
import { useInfiniteList } from '@/lib/app/hooks/use-infinite-list';
import { queryKeys } from '@/lib/app/queries/keys';
import { useMyJobs, useProviderJobs } from '@/lib/app/queries/use-jobs';
import type { Job } from '@/lib/app/services/database.types';
import { listQuotesForJob } from '@/lib/app/services/quotes';
import { getEscrow } from '@/lib/app/services/wallet';

const SCAN = 20;

export function useClientAttention(): AttentionItem[] {
  const openItems = useInfiniteList(useMyJobs('open')).items as Job[];
  const activeItems = useInfiniteList(useMyJobs('active')).items as Job[];
  const jobs = useMemo(() => [...activeItems.slice(0, SCAN), ...openItems.slice(0, SCAN)], [activeItems, openItems]);

  const escrows = useQueries({
    queries: jobs.map((j) => ({ queryKey: ['escrow', j.id] as const, queryFn: () => getEscrow(j.id) })),
  });
  const quotes = useQueries({
    queries: jobs.map((j) => ({
      queryKey: queryKeys.quotes.forJob(j.id),
      queryFn: () => listQuotesForJob(j.id),
      enabled: j.status !== 'in_progress',
    })),
  });

  const items: AttentionItem[] = [];
  jobs.forEach((job, i) => {
    const step = jobNextStep(job, escrows[i]?.data, quotes[i]?.data);
    if (step.lane !== 'needs' || !step.action) return;
    items.push({
      key: job.id,
      title: job.title,
      headline: step.headline,
      label: step.action.label,
      money: step.action.money,
      href: step.action.href,
    });
  });
  // Payments first: they hold up someone's work.
  return items.sort((a, b) => Number(!!b.money) - Number(!!a.money)).slice(0, 10);
}

export function useProviderMove(): AttentionItem[] {
  const activeItems = useInfiniteList(useProviderJobs('active')).items as Job[];
  const jobs = useMemo(() => activeItems.slice(0, SCAN), [activeItems]);
  const escrows = useQueries({
    queries: jobs.map((j) => ({ queryKey: ['escrow', j.id] as const, queryFn: () => getEscrow(j.id) })),
  });

  const items: AttentionItem[] = [];
  jobs.forEach((job, i) => {
    const step = providerNextStep(job, escrows[i]?.data);
    if (step.lane !== 'yours' || !step.action) return;
    items.push({
      key: job.id,
      title: job.title,
      headline: step.headline,
      label: step.action.label,
      money: step.action.money,
      href: routes.providerJobDetail(job.id),
    });
  });
  return items.slice(0, 10);
}
