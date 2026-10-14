'use client';

/**
 * Filter sheets for the two discovery lists. Ported from mobile
 * components/jobs/job-filter-sheet.tsx and components/providers/
 * provider-filter-sheet.tsx: the person edits a draft, sees the live count on
 * the button ("Show 12 jobs"), and nothing changes until they apply it.
 */
import { useState } from 'react';

import { Dialog } from '@/components/app/controls';
import { Button } from '@/components/app/ui';
import { Categories } from '@/lib/app/constants/categories';
import { POSTED_OPTIONS, SORT_LABELS, emptyJobFilters, type JobFilters, type JobSort } from '@/lib/app/domain/job-filters';
import {
  EXPERIENCE_OPTIONS,
  PROVIDER_SORT_LABELS,
  RATING_OPTIONS,
  emptyProviderFilters,
  type ProviderFilters,
  type ProviderSort,
} from '@/lib/app/domain/provider-filters';
import { useOpenJobsCount } from '@/lib/app/queries/use-discover-jobs';
import { useProvidersCount } from '@/lib/app/queries/use-providers';

function FilterSection({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-[var(--rule)] py-4 first:pt-0 last:border-0">
      <legend className="flex w-full items-baseline justify-between">
        <span className="font-semibold text-[var(--ink)]">{title}</span>
        {hint && <span className="text-[13px] text-[var(--muted)]">{hint}</span>}
      </legend>
      <div className="mt-3">{children}</div>
    </fieldset>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className="chip">
      {children}
    </button>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1.5">
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium text-[var(--ink)]">{label}</span>
        {hint && <span className="block text-[13px] text-[var(--muted)]">{hint}</span>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden="true"
        className="relative h-6 w-10 shrink-0 rounded-full bg-[var(--band-deep)] transition-colors duration-150 after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:duration-150 peer-checked:bg-[var(--navy)] peer-checked:after:translate-x-4 peer-focus-visible:outline-2 peer-focus-visible:outline-[var(--navy)]"
      />
    </label>
  );
}

function NairaInput({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <label className="flex-1">
      <span className="label !text-[10.5px]">{label}</span>
      <span className="relative mt-1 block">
        <span className="figure pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">₦</span>
        <input
          className="input figure pl-7"
          inputMode="numeric"
          placeholder="Any"
          value={value != null ? value.toLocaleString('en-NG') : ''}
          onChange={(e) => {
            const n = Number(e.target.value.replace(/[^0-9]/g, ''));
            onChange(n > 0 ? n : null);
          }}
        />
      </span>
    </label>
  );
}

function toggleIn(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

// ─────────────────────────── Jobs ───────────────────────────

export function JobFilterDialog({
  open,
  onClose,
  value,
  onApply,
  search,
  hasSkills,
}: {
  open: boolean;
  onClose: () => void;
  value: JobFilters;
  onApply: (f: JobFilters) => void;
  search: string | undefined;
  hasSkills: boolean;
}) {
  const [draft, setDraft] = useState(value);
  // Reopening starts from what is applied, not from an abandoned draft.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(value);
  }
  const { data: count } = useOpenJobsCount(search, draft);
  const set = (patch: Partial<JobFilters>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Filters"
      footer={
        <>
          <Button variant="ghost" onClick={() => setDraft(emptyJobFilters)}>
            Reset all
          </Button>
          <Button
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            {count == null ? 'Show jobs' : `Show ${count} ${count === 1 ? 'job' : 'jobs'}`}
          </Button>
        </>
      }
    >
      <FilterSection title="Trade" hint={draft.categories.length ? `${draft.categories.length} selected` : undefined}>
        <div className="flex flex-wrap gap-2">
          {Categories.map((c) => (
            <Chip key={c.id} on={draft.categories.includes(c.id)} onClick={() => set({ categories: toggleIn(draft.categories, c.id) })}>
              {c.label}
            </Chip>
          ))}
        </div>
        {hasSkills && (
          <div className="mt-3">
            <Toggle label="Only my trades" hint="Match the services on your profile" checked={draft.matchesMySkills} onChange={(v) => set({ matchesMySkills: v })} />
          </div>
        )}
      </FilterSection>

      <FilterSection title="Budget">
        <div className="flex items-end gap-3">
          <NairaInput label="Min" value={draft.minBudget} onChange={(v) => set({ minBudget: v })} />
          <span className="pb-2.5 text-[var(--muted)]">—</span>
          <NairaInput label="Max" value={draft.maxBudget} onChange={(v) => set({ maxBudget: v })} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[10_000, 50_000, 100_000].map((v) => (
            <Chip key={v} on={draft.minBudget === v && draft.maxBudget == null} onClick={() => set({ minBudget: v, maxBudget: null })}>
              ₦{v.toLocaleString('en-NG')}+
            </Chip>
          ))}
        </div>
        <div className="mt-2">
          <Toggle label="Hide open budgets" hint="Only jobs with a stated budget" checked={draft.budgetedOnly} onChange={(v) => set({ budgetedOnly: v })} />
        </div>
      </FilterSection>

      <FilterSection title="Location">
        <input className="input" placeholder="Area or city, e.g. Lekki" value={draft.location} onChange={(e) => set({ location: e.target.value })} />
      </FilterSection>

      <FilterSection title="Posted">
        <div className="flex flex-wrap gap-2">
          {POSTED_OPTIONS.map((o) => (
            <Chip key={o.label} on={draft.postedWithinDays === o.value} onClick={() => set({ postedWithinDays: o.value })}>
              {o.label}
            </Chip>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Sort by">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(SORT_LABELS) as JobSort[]).map((s) => (
            <Chip key={s} on={draft.sort === s} onClick={() => set({ sort: s })}>
              {SORT_LABELS[s]}
            </Chip>
          ))}
        </div>
      </FilterSection>
    </Dialog>
  );
}

// ─────────────────────────── Providers ───────────────────────────

export function ProviderFilterDialog({
  open,
  onClose,
  value,
  onApply,
  search,
}: {
  open: boolean;
  onClose: () => void;
  value: ProviderFilters;
  onApply: (f: ProviderFilters) => void;
  search: string | undefined;
}) {
  const [draft, setDraft] = useState(value);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(value);
  }
  const { data: count } = useProvidersCount(search, draft);
  const set = (patch: Partial<ProviderFilters>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Filters"
      footer={
        <>
          <Button variant="ghost" onClick={() => setDraft(emptyProviderFilters)}>
            Reset all
          </Button>
          <Button
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            {count == null ? 'Show artisans' : `Show ${count} ${count === 1 ? 'artisan' : 'artisans'}`}
          </Button>
        </>
      }
    >
      <FilterSection title="Trade" hint={draft.services.length ? `${draft.services.length} selected` : undefined}>
        <div className="flex flex-wrap gap-2">
          {Categories.map((c) => (
            <Chip key={c.id} on={draft.services.includes(c.id)} onClick={() => set({ services: toggleIn(draft.services, c.id) })}>
              {c.label}
            </Chip>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Rating">
        <div className="flex flex-wrap gap-2">
          {RATING_OPTIONS.map((r) => (
            <Chip key={r} on={draft.minRating === r} onClick={() => set({ minRating: draft.minRating === r ? null : r })}>
              {r}★ &amp; up
            </Chip>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Experience">
        <div className="flex flex-wrap gap-2">
          {EXPERIENCE_OPTIONS.map((y) => (
            <Chip key={y} on={draft.minExperience === y} onClick={() => set({ minExperience: draft.minExperience === y ? null : y })}>
              {y}+ yr{y === 1 ? '' : 's'}
            </Chip>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Max hourly rate">
        <NairaInput label="Up to" value={draft.maxRate} onChange={(v) => set({ maxRate: v })} />
      </FilterSection>

      <FilterSection title="Area">
        <input className="input" placeholder="Area or city, e.g. Uyo" value={draft.location} onChange={(e) => set({ location: e.target.value })} />
      </FilterSection>

      <FilterSection title="Trust & availability">
        <Toggle label="Verified only" hint="ID-checked artisans" checked={draft.verifiedOnly} onChange={(v) => set({ verifiedOnly: v })} />
        <Toggle label="Available now" hint="Currently taking new jobs" checked={draft.availableOnly} onChange={(v) => set({ availableOnly: v })} />
      </FilterSection>

      <FilterSection title="Sort by">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PROVIDER_SORT_LABELS) as ProviderSort[]).map((s) => (
            <Chip key={s} on={draft.sort === s} onClick={() => set({ sort: s })}>
              {PROVIDER_SORT_LABELS[s]}
            </Chip>
          ))}
        </div>
      </FilterSection>
    </Dialog>
  );
}
