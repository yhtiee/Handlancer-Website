'use client';

import Link from 'next/link';

import { EmptyState } from '@/components/admin/ui';
import { ApiError } from '@/lib/admin/query/client';

/**
 * What a view shows when its query has no data to render: the very first visit
 * to a key (data still streaming in), a failed fetch, or a record that does
 * not exist.
 */

/** The API's 404 for an unknown id. (A server prefetch yields `null` instead.) */
export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

export function NotFound({ what, href }: { what: string; href: string }) {
  return (
    <div className="card enter mx-auto mt-6 max-w-md">
      <EmptyState title={`No such ${what}`}>
        It may have been deleted, or the link is wrong.{' '}
        <Link href={href} className="ulink">
          Back to the list
        </Link>
      </EmptyState>
    </div>
  );
}

export function QueryError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="card enter mx-auto mt-6 max-w-md p-8 text-center" role="alert">
      <h2 className="!text-[18px] !font-bold !normal-case !tracking-[-0.02em] text-[var(--navy)]">
        This could not be loaded
      </h2>
      <p className="mt-2 text-[var(--muted)]">{error.message} Nothing was changed.</p>
      <button type="button" onClick={onRetry} className="btn btn-ghost mt-5">
        Try again
      </button>
    </div>
  );
}

export function ViewSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="card p-5">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="skeleton mb-3 h-9 w-full last:mb-0" />
        ))}
      </div>
    </div>
  );
}
