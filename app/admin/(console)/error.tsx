'use client';

import { useEffect } from 'react';

/** Page-level failure inside the shell — the nav stays usable. */
export default function ConsoleError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="card enter mx-auto mt-10 max-w-md p-8 text-center">
      <h1 className="!text-[18px]">Something went wrong</h1>
      <p className="mt-2 text-[var(--muted)]">
        The data for this page could not be loaded. Nothing was changed.
        {error.digest && <span className="figure mt-2 block text-[12px]">Ref: {error.digest}</span>}
      </p>
      <button type="button" onClick={() => retry()} className="btn btn-ghost mt-5">
        Try again
      </button>
    </div>
  );
}
