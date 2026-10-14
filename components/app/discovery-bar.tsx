'use client';

import { Icon } from '@/components/app/icon';

/**
 * Search, filters and sort above a discovery list (Find work, Artisans). The
 * mobile JobFilterBar, as one toolbar row: sort is a native select, so it costs
 * one tap on a phone and needs no custom menu.
 */
export function DiscoveryBar<S extends string>({
  search,
  onSearch,
  placeholder,
  activeFilters,
  onOpenFilters,
  sort,
  sortLabels,
  onSort,
  total,
  noun,
}: {
  search: string;
  onSearch: (v: string) => void;
  placeholder: string;
  activeFilters: number;
  onOpenFilters: () => void;
  sort: S;
  sortLabels: Record<S, string>;
  onSort: (s: S) => void;
  total?: number;
  noun: [string, string];
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{placeholder}</span>
          <Icon name="search" size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input className="input !h-11 pl-9" type="search" placeholder={placeholder} value={search} onChange={(e) => onSearch(e.target.value)} />
        </label>
        <button
          type="button"
          onClick={onOpenFilters}
          className={`btn !h-11 shrink-0 !px-3.5 ${activeFilters ? 'bg-[var(--navy)] text-white hover:bg-[var(--navy)]' : 'btn-ghost'}`}
        >
          <Icon name="options" size={18} />
          <span className="hidden sm:inline">Filters</span>
          {activeFilters > 0 && <span className="figure rounded-full bg-white/20 px-1.5 text-[12px]">{activeFilters}</span>}
        </button>
      </div>
      <div className="flex items-center justify-between gap-3 text-[13.5px] text-[var(--muted)]">
        <span aria-live="polite">{total == null ? ' ' : `${total} ${total === 1 ? noun[0] : noun[1]}`}</span>
        <label className="flex items-center gap-1.5">
          <span>Sort</span>
          <select
            className="rounded-md border border-transparent bg-transparent py-1 pr-1 font-semibold text-[var(--ink)] hover:border-[var(--rule-strong)]"
            value={sort}
            onChange={(e) => onSort(e.target.value as S)}
          >
            {(Object.keys(sortLabels) as S[]).map((s) => (
              <option key={s} value={s}>
                {sortLabels[s]}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
