'use client';

/**
 * The desktop top bar both dashboards share — the app (/app) and the admin
 * console (/admin): breadcrumbs on the left; a greeting and the bell on the
 * right. Each surface passes its own crumbs and bell; this file owns the frame
 * and the idioms (marker-style crumbs, hairline rule, no shadow, no blur).
 */
import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

export type Crumb = { label: string; href?: string };

// ─────────────────────────── Greeting ───────────────────────────

function partOfDay(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

const noSubscribe = () => () => {};

/**
 * "Good morning" in the viewer's own time. The server can't know it, so the
 * first render (server and hydration) shows nothing and the browser fills it in.
 */
export function useGreeting(): string | null {
  return useSyncExternalStore(noSubscribe, partOfDay, () => null);
}

// ─────────────────────────── Breadcrumbs ───────────────────────────

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-[13.5px]">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={`${c.label}-${i}`} className={`flex min-w-0 items-center gap-1.5 ${last ? '' : 'shrink-0'}`}>
              {i > 0 && (
                <span aria-hidden="true" className="text-[var(--rule-strong)]">
                  /
                </span>
              )}
              {last || !c.href ? (
                <span aria-current={last ? 'page' : undefined} className={`truncate ${last ? 'font-semibold text-[var(--ink)]' : 'text-[var(--muted)]'}`}>
                  {c.label}
                </span>
              ) : (
                <Link href={c.href} className="truncate text-[var(--muted)] transition-colors duration-150 hover:text-[var(--ink)]">
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Turn a pathname into crumbs from a table of known sections. `labels` maps a
 * path pattern (with `:id` for a record) to its label; `named` can replace the
 * label for a record with its real name (a job title, a person). Segments that
 * have no page of their own (e.g. /wallet/transactions) are skipped.
 */
export function crumbsFor(
  pathname: string,
  root: string,
  labels: Record<string, string>,
  named: Record<string, string | undefined> = {},
): Crumb[] {
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  const rootParts = root.split('/').filter(Boolean);
  const crumbs: Crumb[] = [{ label: labels[root] ?? 'Home', href: root }];
  let pattern = root;
  let href = root;
  for (const part of parts.slice(rootParts.length)) {
    href += `/${part}`;
    const asId = /^[0-9a-f-]{8,}$/i.test(part);
    const literal = `${pattern}/${part}`;
    const idPattern = `${pattern}/:id`;
    if (!asId && literal in labels) {
      pattern = literal;
      crumbs.push({ label: labels[literal], href });
    } else if (asId && idPattern in labels) {
      pattern = idPattern;
      crumbs.push({ label: named[idPattern] || labels[idPattern], href });
    } else {
      // A segment with no page (e.g. "transactions" in /wallet/transactions/:id).
      pattern = asId ? idPattern : literal;
    }
  }
  return crumbs;
}

// ─────────────────────────── Popover ───────────────────────────

/**
 * A button that opens a panel under it. Closes on outside click, Escape, or
 * when focus leaves; the panel is a labelled region, not a menu, because its
 * rows are links.
 */
export function Popover({
  label,
  button,
  children,
  width = 360,
}: {
  label: string;
  button: (open: boolean) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={label}
        className={`relative grid size-10 place-items-center rounded-full transition-colors duration-150 ${open ? 'bg-[var(--band)] text-[var(--ink)]' : 'text-[var(--navy)] hover:bg-[var(--band)]'}`}
      >
        {button(open)}
      </button>
      {open && (
        <div
          role="region"
          aria-label={label}
          className="absolute right-0 top-full z-50 mt-2 max-w-[calc(100vw-24px)] overflow-hidden rounded-md border border-[var(--rule-strong)] bg-[var(--paper)]"
          style={{ width }}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

/** The bell glyph, with a dot when something needs reading. */
export function BellGlyph({ count }: { count: number }) {
  return (
    <>
      <svg viewBox="0 0 24 24" width={21} height={21} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15l1.5-2Z" />
        <path d="M10 20.5a2 2 0 0 0 4 0" />
      </svg>
      {count > 0 && (
        <span className="figure absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full border-2 border-[var(--paper)] bg-[var(--bad)] px-1 text-center text-[10.5px] font-semibold leading-[14px] text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </>
  );
}

// ─────────────────────────── The bar ───────────────────────────

export function TopBar({ crumbs, greeting, right }: { crumbs: Crumb[]; greeting: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-20 hidden h-16 items-center gap-6 border-b border-[var(--rule)] bg-[var(--paper)] px-8 lg:flex print:!hidden">
      <div className="min-w-0 flex-1">
        <Breadcrumbs crumbs={crumbs} />
      </div>
      <p className="shrink-0 text-[14px] text-[var(--muted)]">
        {greeting}
      </p>
      <div className="flex shrink-0 items-center gap-1">{right}</div>
    </div>
  );
}
