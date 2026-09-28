/**
 * Column-driven table. Hook-free, so it renders inside client views and server
 * components alike. The controls above and below a list (tabs, search,
 * paging) live in components/admin/list-controls.tsx.
 */
import Link from 'next/link';

import { EmptyState } from '@/components/admin/ui';

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: 'left' | 'right';
  /** Hide below this breakpoint so phones see only what matters. */
  hideBelow?: 'sm' | 'md' | 'lg';
  className?: string;
};

const HIDE: Record<NonNullable<Column<unknown>['hideBelow']>, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowHref,
  empty = 'Nothing here yet',
  emptyHint,
  dimmed = false,
  onRowIntent,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** When set, the first column links here and the whole row becomes clickable. */
  rowHref?: (row: T) => string;
  empty?: string;
  emptyHint?: string;
  /** Previous results held on screen while the next set loads. */
  dimmed?: boolean;
  /** Pointer or focus landed on a row: warm whatever it opens. */
  onRowIntent?: (row: T) => void;
}) {
  if (rows.length === 0) return <EmptyState title={empty}>{emptyHint}</EmptyState>;

  return (
    <div
      className={`table-wrap transition-opacity duration-200 ${dimmed ? 'pointer-events-none opacity-55' : ''}`}
      aria-busy={dimmed || undefined}
    >
      <table className="data">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={`${c.hideBelow ? HIDE[c.hideBelow] : ''} ${c.align === 'right' ? 'text-right' : ''}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const href = rowHref?.(row);
            return (
              <tr
                key={rowKey(row)}
                className={href ? 'row-link cursor-pointer' : ''}
                onPointerEnter={onRowIntent ? () => onRowIntent(row) : undefined}
                onFocus={onRowIntent ? () => onRowIntent(row) : undefined}
              >
                {columns.map((c, i) => (
                  <td
                    key={c.key}
                    // Right-aligned columns are figures: amounts, counts, dates — set in the site's mono.
                    className={`${c.hideBelow ? HIDE[c.hideBelow] : ''} ${c.align === 'right' ? 'figure whitespace-nowrap text-right text-[13px]' : ''} ${c.className ?? ''}`}
                  >
                    {href && i === 0 ? (
                      // No route prefetch: on a long list that is one server render per
                      // visible row. The row's data is warmed on hover via onRowIntent.
                      <Link href={href} prefetch={false} className="row-anchor">
                        {c.cell(row)}
                      </Link>
                    ) : (
                      c.cell(row)
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
