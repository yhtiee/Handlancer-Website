'use client';

import type { UseQueryResult } from '@tanstack/react-query';

import { ListToolbar, Pagination } from '@/components/admin/list-controls';
import { QueryError, ViewSkeleton } from '@/components/admin/query-state';
import { DataTable, type Column } from '@/components/admin/table';
import type { Paged } from '@/lib/admin/data/shared';

/**
 * Every list page: toolbar, table, pager — driven by one useQuery result.
 *
 * While a new filter or page loads, the previous rows stay on screen dimmed
 * (keepPreviousData) and a teal rule runs under the toolbar, so the layout
 * never collapses to a spinner between pages.
 */
export function ListView<T>({
  query,
  toolbar,
  columns,
  rowKey,
  rowHref,
  empty,
  emptyHint,
  onRowIntent,
}: {
  query: UseQueryResult<Paged<T>>;
  toolbar: React.ComponentProps<typeof ListToolbar>;
  columns: Column<T>[];
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string;
  empty?: string;
  emptyHint?: string;
  onRowIntent?: (row: T) => void;
}) {
  const { data, error, isFetching, isPlaceholderData, refetch } = query;

  return (
    <div className="card enter overflow-hidden">
      <ListToolbar {...toolbar} fetching={isFetching} />
      {data ? (
        <>
          <DataTable
            rows={data.rows}
            columns={columns}
            rowKey={rowKey}
            rowHref={rowHref}
            empty={empty}
            emptyHint={emptyHint}
            dimmed={isPlaceholderData}
            onRowIntent={onRowIntent}
          />
          <Pagination page={data.page} pageCount={data.pageCount} total={data.total} />
        </>
      ) : error ? (
        <div className="p-4">
          <QueryError error={error} onRetry={() => refetch()} />
        </div>
      ) : (
        <div className="p-4">
          <ViewSkeleton />
        </div>
      )}
    </div>
  );
}
