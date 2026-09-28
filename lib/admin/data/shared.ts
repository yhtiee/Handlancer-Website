import 'server-only';

import { serviceClient } from '@/lib/admin/supabase';
import type { Profile } from '@/lib/admin/types';

export const PAGE_SIZE = 20;

export type ListParams = {
  page?: number;
  q?: string;
  status?: string;
};

export type Paged<T> = {
  rows: T[];
  total: number;
  page: number;
  pageCount: number;
};

/** Normalises `?page=` into a 1-based page and the matching PostgREST range. */
export function pageRange(page: number | undefined) {
  const p = Math.max(1, Math.floor(page ?? 1));
  const from = (p - 1) * PAGE_SIZE;
  return { page: p, from, to: from + PAGE_SIZE - 1 };
}

export function paged<T>(rows: T[] | null, total: number | null, page: number): Paged<T> {
  const t = total ?? 0;
  return { rows: rows ?? [], total: t, page, pageCount: Math.max(1, Math.ceil(t / PAGE_SIZE)) };
}

/**
 * Makes free text safe to drop into a PostgREST `or=(…)` filter, where commas,
 * parentheses and `%`/`*` are syntax rather than content.
 */
export function searchTerm(q: string | undefined): string | null {
  const cleaned = (q ?? '').replace(/[,()%*\\]/g, ' ').trim();
  return cleaned ? cleaned : null;
}

/** Route params reach `.or()` filters as raw strings; anything else is a 404. */
export { isUuidShape as isUuid } from '@/lib/admin/query/keys';

export type ProfileRef = Pick<Profile, 'id' | 'name' | 'email' | 'role'>;

/**
 * The hand-written types carry no FK relationships, so embedded selects
 * (`owner:profiles(...)`) would not type-check. Pages that list rows with
 * people on them fetch the rows first, then resolve the ids here in one query.
 */
export async function profilesById(ids: (string | null | undefined)[]): Promise<Map<string, ProfileRef>> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return new Map();

  const { data, error } = await serviceClient()
    .from('profiles')
    .select('id, name, email, role')
    .in('id', unique);
  if (error) throw error;

  return new Map((data ?? []).map((p) => [p.id, p]));
}

/** What is still sitting in an escrow — same arithmetic as admin_resolve_dispute (0009). */
export function heldAmount(e: {
  total: number;
  materials_amount: number;
  materials_released: boolean;
  workmanship_released: boolean;
}): number {
  if (e.workmanship_released) return 0;
  return Number(e.total) - (e.materials_released ? Number(e.materials_amount) : 0);
}
