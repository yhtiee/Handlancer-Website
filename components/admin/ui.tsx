/**
 * Admin console building blocks. Server-safe (no hooks), so pages stay
 * Server Components and ship no JS for layout.
 *
 * Built from the marketing site's idioms (DESIGN-SYSTEM.md): bordered square
 * panels, .marker-style mono labels, .lede for page intros, .figure for every
 * naira amount and metric. Colour: navy + teal on greys (app/admin/admin.css).
 */
import Link from 'next/link';

import { IconChevronLeft, IconInbox } from '@/components/admin/icons';
import { humanize } from '@/lib/admin/format';

// ─────────────────────────── Page chrome ───────────────────────────

export function PageHeader({
  title,
  description,
  meta,
  back,
  actions,
}: {
  title: React.ReactNode;
  /** One sentence, set as the site's serif lede. */
  description?: React.ReactNode;
  /** Status pills, dates — the row under the title on detail pages. */
  meta?: React.ReactNode;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <header className="enter mb-6 md:mb-8">
      {back && (
        <Link
          href={back.href}
          className="label mb-4 inline-flex items-center gap-1 transition-colors duration-200 hover:!text-[var(--ink)]"
        >
          <IconChevronLeft width={14} height={14} />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1>{title}</h1>
          {description && <p className="lede mt-2 max-w-[68ch]">{description}</p>}
          {meta && <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-[var(--muted)]">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** Panel title in .marker type: mono, uppercase, tracked. */
export function PanelTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="label !text-[var(--ink)]">{children}</h2>;
}

export function Section({
  title,
  action,
  children,
  className = '',
  flush = false,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Drop the body padding — for tables that run edge to edge. */
  flush?: boolean;
}) {
  return (
    <section className={`card enter overflow-hidden ${className}`}>
      {title && (
        <div className="flex min-h-[50px] items-center justify-between gap-3 border-b border-[var(--rule)] px-4 py-3 md:px-5">
          <PanelTitle>{title}</PanelTitle>
          {action}
        </div>
      )}
      <div className={flush ? '' : 'p-4 md:p-5'}>{children}</div>
    </section>
  );
}

// ─────────────────────────── Figures ───────────────────────────

/**
 * Stat tile: label · figure · optional delta/hint. Meant to sit inside a
 * `.ruled-grid`, where the 1px gaps are the borders (the services grid idiom).
 */
export function StatTile({
  label,
  value,
  hint,
  delta,
  href,
}: {
  label: string;
  value: string;
  hint?: React.ReactNode;
  /** Signed change vs a named period, e.g. { value: 12, period: 'last week' }. */
  delta?: { value: number; period: string };
  href?: string;
}) {
  const body = (
    <>
      <p className="label">{label}</p>
      <p className="figure mt-3 text-[28px] font-medium leading-none text-[var(--ink)]">{value}</p>
      {(delta || hint) && (
        <p className="mt-3 flex flex-wrap items-center gap-x-1.5 text-[13px] text-[var(--muted)]">
          {delta && (
            <span className={`figure font-medium ${delta.value > 0 ? 'text-[var(--navy)]' : ''}`}>
              {delta.value > 0 ? '+' : delta.value < 0 ? '−' : '±'}
              {Math.abs(delta.value)}
            </span>
          )}
          {delta && <span>vs {delta.period}</span>}
          {hint}
        </p>
      )}
    </>
  );

  const cls = 'block p-4 md:p-5';
  return href ? (
    <Link href={href} className={`${cls} transition-colors duration-200 hover:!bg-[var(--band)]`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

// ─────────────────────────── Status ───────────────────────────

type Tone = 'neutral' | 'active' | 'progress' | 'alert';

/**
 * Every status in the schema, mapped to one of four tones. Only `alert` uses
 * red, and only for states where a person has to act.
 */
const TONES: Record<string, Tone> = {
  // jobs
  draft: 'neutral',
  posted: 'progress',
  hiring: 'progress',
  in_progress: 'active',
  completed: 'neutral',
  disputed: 'alert',
  cancelled: 'neutral',
  // disputes
  open: 'alert',
  in_review: 'progress',
  resolved: 'neutral',
  rejected: 'neutral',
  // transactions / quotes / escrow
  pending: 'progress',
  success: 'active',
  failed: 'alert',
  submitted: 'progress',
  approved: 'active',
  revised: 'progress',
  funded: 'active',
  materials_released: 'active',
  refunded: 'neutral',
  // people
  user: 'neutral',
  provider: 'progress',
};

const DOT: Record<Tone, string> = {
  neutral: 'bg-[var(--rule-strong)]',
  active: 'bg-[var(--teal)]',
  progress: 'bg-[var(--navy)]',
  alert: 'bg-[var(--bad)]',
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone = TONES[status] ?? 'neutral';
  return (
    <span className="inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--rule)] bg-[var(--paper)] px-2.5 text-[12px] font-medium text-[var(--ink)]">
      <span className={`size-1.5 rounded-full ${DOT[tone]}`} aria-hidden="true" />
      {label ?? humanize(status)}
    </span>
  );
}

// ─────────────────────────── Content ───────────────────────────

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-[var(--band)] text-[var(--muted)]">
        <IconInbox width={20} height={20} />
      </span>
      <p className="mt-3 font-semibold text-[var(--navy)]">{title}</p>
      {children && <p className="mt-1 max-w-[40ch] text-[var(--muted)]">{children}</p>}
    </div>
  );
}

/** Label/value pairs for detail pages. Two columns from `sm` up. */
export function Details({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
      {items.map(({ label, value }) => (
        <div key={label} className="min-w-0">
          <dt className="label !text-[10.5px]">{label}</dt>
          <dd className="mt-1 break-words text-[var(--ink)]">{value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A naira amount or metric in the site's figure face. */
export function Figure({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`figure ${className}`}>{children}</span>;
}

/** A person, linked to their user page. */
export function PersonLink({
  person,
  fallback = 'Unknown',
}: {
  person: { id: string; name: string | null; email: string | null } | null;
  fallback?: string;
}) {
  if (!person) return <span className="text-[var(--muted)]">{fallback}</span>;
  return (
    <Link href={`/admin/users/${person.id}`} className="ulink relative z-10">
      {person.name || person.email || 'Unnamed'}
    </Link>
  );
}
