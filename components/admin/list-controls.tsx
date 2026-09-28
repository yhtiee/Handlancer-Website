'use client';

import { useEffect, useRef, useState } from 'react';

import { IconChevronLeft, IconChevronRight, IconSearch } from '@/components/admin/icons';
import { formatCount } from '@/lib/admin/format';
import { useListFilters } from '@/lib/admin/query/hooks';
import type { ListFilters } from '@/lib/admin/query/keys';

type FilterKey = Exclude<keyof ListFilters, 'page' | 'q'>;

/**
 * The one row of controls above every list: the site's tab idiom (ink label,
 * 2px teal underline) plus a search box. State lives in the URL via
 * useListFilters, so nothing here reloads the page.
 */
export function ListToolbar({
  paramKey = 'status',
  tabs,
  searchPlaceholder = 'Search',
  fetching = false,
}: {
  paramKey?: FilterKey;
  tabs?: { value: string | undefined; label: string }[];
  searchPlaceholder?: string;
  /** Background refetch in flight — drawn as a thin teal rule under the row. */
  fetching?: boolean;
}) {
  const { filters, setFilters } = useListFilters();
  const current = filters[paramKey];

  return (
    <div className="relative flex flex-col gap-3 border-b border-[var(--rule)] px-3 pt-1 md:flex-row md:items-end md:justify-between md:px-4">
      {tabs ? (
        <nav className="-mb-px flex gap-5 overflow-x-auto" aria-label="Filter">
          {tabs.map((t) => {
            const active = (t.value ?? '') === (current ?? '');
            return (
              <button
                key={t.label}
                type="button"
                onClick={() => setFilters({ [paramKey]: t.value })}
                aria-pressed={active}
                className={`shrink-0 whitespace-nowrap py-3 text-[14px] font-medium transition-colors duration-200 ${
                  active ? 'text-[var(--ink)]' : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
                style={{ borderBottom: `2px solid ${active ? 'var(--teal)' : 'transparent'}` }}
              >
                {t.label}
              </button>
            );
          })}
        </nav>
      ) : (
        <span />
      )}

      <SearchBox
        q={filters.q ?? ''}
        placeholder={searchPlaceholder}
        onSearch={(q) => setFilters({ q: q || undefined })}
      />

      <span
        aria-hidden="true"
        className={`absolute inset-x-0 -bottom-px h-0.5 origin-left bg-[var(--teal)] transition-[opacity,transform] duration-500 ${
          fetching ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
        }`}
      />
    </div>
  );
}

/** Debounced: results follow typing after a short pause; Enter searches at once. */
function SearchBox({
  q,
  placeholder,
  onSearch,
}: {
  /** The search currently in the URL. */
  q: string;
  placeholder: string;
  onSearch: (q: string) => void;
}) {
  const [value, setValue] = useState(q);
  const [syncedQ, setSyncedQ] = useState(q);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // The URL changed underneath us (Back/Forward, a tab reset): show its search.
  // Adjusted during render, not in an effect, and never while it already
  // matches what is typed — so typing is never interrupted.
  if (q !== syncedQ) {
    setSyncedQ(q);
    if (q !== value.trim()) setValue(q);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  const schedule = (next: string) => {
    setValue(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (next.trim() !== q) onSearch(next.trim());
    }, 350);
  };

  return (
    <form
      role="search"
      className="w-full pb-3 md:w-72 md:py-2.5"
      onSubmit={(e) => {
        e.preventDefault();
        clearTimeout(timer.current);
        onSearch(value.trim());
      }}
    >
      <div className="relative">
        <IconSearch
          width={16}
          height={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
        />
        <input
          type="search"
          value={value}
          onChange={(e) => schedule(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="input pl-9"
        />
      </div>
    </form>
  );
}

export function Pagination({ page, pageCount, total }: { page: number; pageCount: number; total: number }) {
  const { setFilters } = useListFilters();
  if (total === 0) return null;

  // The site's ghost-button border treatment, at icon size.
  const btn =
    'grid size-8 place-items-center rounded-md border border-[var(--rule-strong)] text-[var(--ink)] transition-colors duration-200 enabled:hover:border-[var(--ink)] enabled:hover:bg-[var(--band)] disabled:border-[var(--rule)] disabled:text-[var(--rule-strong)]';

  const go = (p: number) => {
    setFilters({ page: p });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex items-center justify-between gap-3 border-t border-[var(--rule)] px-4 py-3 text-[13px] text-[var(--muted)]">
      <span className="figure">
        {formatCount(total)} {total === 1 ? 'result' : 'results'}
      </span>
      <div className="flex items-center gap-2">
        <span className="figure mr-1">
          Page {page} of {pageCount}
        </span>
        <button type="button" className={btn} disabled={page <= 1} onClick={() => go(page - 1)} aria-label="Previous page">
          <IconChevronLeft width={16} height={16} />
        </button>
        <button
          type="button"
          className={btn}
          disabled={page >= pageCount}
          onClick={() => go(page + 1)}
          aria-label="Next page"
        >
          <IconChevronRight width={16} height={16} />
        </button>
      </div>
    </div>
  );
}
