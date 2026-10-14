'use client';

/**
 * Pick the trades and services an artisan offers.
 *
 * Every service on the indexed /services pages is here (lib/services.ts),
 * findable three ways: search by name or local alias ("POP", "fridge man"),
 * browse every trade in full, or type one we don't list.
 *
 * What gets stored in profiles.services:
 *   - trade ids ('plumbing') — what both apps' trade filters match on. Picking
 *     a service adds its trade automatically; the first trade is the main one.
 *   - service names ('Borehole drilling'), listed and custom, as plain text —
 *     which every screen already shows as is (lib/app/domain/trades.ts).
 */
import { useId, useMemo, useState } from 'react';

import { Icon } from '@/components/app/icon';
import { Categories } from '@/lib/app/constants/categories';
import type { ServiceOption } from '@/lib/app/service-options';

export const MAX_TRADES = 5;
export const MAX_SERVICES = 30;

const TRADE_IDS = new Set<string>(Categories.map((c) => c.id));
const tradeLabel = (id: string) => Categories.find((c) => c.id === id)?.label ?? id;

function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function ServicePicker({
  value,
  onChange,
  options,
  onLimit,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  options: ServiceOption[];
  /** Called with a message when a limit stops a pick. */
  onLimit?: (message: string) => void;
}) {
  const searchId = useId();
  const [query, setQuery] = useState('');
  const [customTrade, setCustomTrade] = useState<string>('');

  const trades = value.filter((s) => TRADE_IDS.has(s));
  const services = value.filter((s) => !TRADE_IDS.has(s));
  const has = (label: string) => services.some((s) => s.toLowerCase() === label.toLowerCase());
  const byLabel = useMemo(() => new Map(options.map((o) => [o.label.toLowerCase(), o])), [options]);

  function addTrade(next: string[], id: string): string[] | null {
    if (next.includes(id)) return next;
    if (next.filter((s) => TRADE_IDS.has(s)).length >= MAX_TRADES) {
      onLimit?.(`Up to ${MAX_TRADES} trades — pick the ones you’re best at.`);
      return null;
    }
    return [...next, id];
  }

  function toggleTrade(id: string) {
    if (trades.includes(id)) {
      // Removing a trade takes its listed services with it; custom ones stay.
      onChange(value.filter((s) => s !== id && byLabel.get(s.toLowerCase())?.category !== id));
      return;
    }
    const next = addTrade(value, id);
    if (next) onChange(next);
  }

  function addService(label: string, category: string) {
    if (has(label)) return;
    if (services.length >= MAX_SERVICES) {
      onLimit?.(`Up to ${MAX_SERVICES} services.`);
      return;
    }
    const withTrade = addTrade(value, category);
    if (!withTrade) return;
    onChange([...withTrade, label]);
  }

  function removeService(label: string) {
    onChange(value.filter((s) => s.toLowerCase() !== label.toLowerCase()));
  }

  function toggleService(o: ServiceOption) {
    if (has(o.label)) removeService(o.label);
    else addService(o.label, o.category);
  }

  // ── Search ──
  const q = norm(query);
  const results = useMemo(() => {
    if (!q) return [];
    const words = q.split(' ');
    return options
      .map((o) => {
        const hay = norm([o.label, ...o.aliases, tradeLabel(o.category)].join(' '));
        const label = norm(o.label);
        if (!words.every((w) => hay.includes(w))) return null;
        const score = label.startsWith(q) ? 0 : label.includes(q) ? 1 : o.aliases.some((a) => norm(a).includes(q)) ? 2 : 3;
        return { o, score };
      })
      .filter((x): x is { o: ServiceOption; score: number } => !!x)
      .sort((a, b) => a.score - b.score || a.o.label.localeCompare(b.o.label))
      .slice(0, 12)
      .map((x) => x.o);
  }, [q, options]);

  const exact = q.length > 0 && options.some((o) => norm(o.label) === q);
  const canAddCustom = query.trim().length >= 3 && !exact && !has(query.trim());
  const guessTrade = customTrade || results[0]?.category || trades[0] || 'other';

  function addCustom() {
    const label = query.trim().replace(/\s+/g, ' ');
    const pretty = label.charAt(0).toUpperCase() + label.slice(1);
    addService(pretty, guessTrade);
    setQuery('');
    setCustomTrade('');
  }

  return (
    <div className="space-y-6">
      {/* ── What you've picked ── */}
      <section aria-label="Your trades and services" className="space-y-3">
        <div>
          <p className="label !text-[10.5px]">Your trades {trades.length > 0 && `· ${trades.length}/${MAX_TRADES}`}</p>
          {trades.length ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {trades.map((id, i) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => toggleTrade(id)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--navy)] pl-3.5 pr-2 text-[14px] font-semibold text-white"
                    aria-label={`Remove ${tradeLabel(id)}`}
                  >
                    {i === 0 && <span className="rounded bg-white/20 px-1.5 text-[10.5px] uppercase tracking-wide">Main</span>}
                    {tradeLabel(id)}
                    <Icon name="close" size={13} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-[14px] text-[var(--muted)]">None yet — search below or open a trade.</p>
          )}
        </div>
        {services.length > 0 && (
          <div>
            <p className="label !text-[10.5px]">
              Your services · {services.length}/{MAX_SERVICES}
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {services.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => removeService(s)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--navy)] bg-[var(--teal-wash)] pl-3 pr-2 text-[13.5px] font-medium text-[var(--navy)]"
                    aria-label={`Remove ${s}`}
                  >
                    {s}
                    <Icon name="close" size={12} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ── Search ── */}
      <section className="space-y-2.5">
        <label htmlFor={searchId} className="block text-[14px] font-semibold text-[var(--ink)]">
          Search {options.length}+ services
        </label>
        <div className="relative">
          <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            id={searchId}
            type="search"
            className="input !h-12 pl-10"
            placeholder="e.g. borehole, inverter, POP ceiling, fridge"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              if (results[0] && !has(results[0].label) && norm(results[0].label).startsWith(q)) {
                addService(results[0].label, results[0].category);
                setQuery('');
              } else if (canAddCustom) addCustom();
            }}
          />
        </div>

        {q && (
          <div className="overflow-hidden rounded-md border border-[var(--rule)] bg-[var(--paper)]">
            {results.length > 0 && (
              <ul className="divide-y divide-[var(--rule)]" aria-label="Matching services">
                {results.map((o) => {
                  const on = has(o.label);
                  return (
                    <li key={o.label}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleService(o)}
                        className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors duration-150 ${on ? 'bg-[var(--teal-wash)]' : 'hover:bg-[var(--band)]'}`}
                      >
                        <span
                          className={`grid size-5 shrink-0 place-items-center rounded border ${on ? 'border-[var(--navy)] bg-[var(--navy)] text-white' : 'border-[var(--rule-strong)]'}`}
                          aria-hidden="true"
                        >
                          {on && <Icon name="checkmark" size={12} strokeWidth={2.6} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-[var(--ink)]">{o.label}</span>
                          <span className="block truncate text-[12.5px] text-[var(--muted)]">
                            {tradeLabel(o.category)}
                            {o.aliases.length > 0 && ` · also “${o.aliases.slice(0, 2).join('”, “')}”`}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {canAddCustom && (
              <div className={`space-y-2.5 p-3.5 ${results.length ? 'border-t border-[var(--rule)] bg-[var(--band)]' : ''}`}>
                <p className="text-[14px] text-[var(--ink)]">
                  {results.length ? 'Not quite it?' : 'We don’t list that yet.'} Add <b className="font-semibold">“{query.trim()}”</b> as a service you offer.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label className="flex flex-1 items-center gap-2 text-[13.5px] text-[var(--muted)]">
                    <span className="shrink-0">Closest trade</span>
                    <select className="input !h-10 flex-1" value={guessTrade} onChange={(e) => setCustomTrade(e.target.value)}>
                      {Categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="button" onClick={addCustom} className="btn btn-primary !h-10 !px-4 !text-[14px]">
                    <Icon name="add" size={16} />
                    Add it
                  </button>
                </div>
              </div>
            )}

            {!results.length && !canAddCustom && <p className="p-3.5 text-[14px] text-[var(--muted)]">Keep typing…</p>}
          </div>
        )}
      </section>

      {/* ── Browse everything ── */}
      <section className="space-y-2">
        <p className="text-[14px] font-semibold text-[var(--ink)]">Or browse every trade</p>
        <div className="divide-y divide-[var(--rule)] overflow-hidden rounded-md border border-[var(--rule)] bg-[var(--paper)]">
          {Categories.map((c) => {
            const list = options.filter((o) => o.category === c.id);
            const picked = list.filter((o) => has(o.label)).length;
            const onTrade = trades.includes(c.id);
            return (
              <details key={c.id} className="group">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-3.5 py-3 hover:bg-[var(--band)]">
                  <Icon name={c.icon} size={19} className="shrink-0 text-[var(--navy)]" />
                  <span className="flex-1 font-medium text-[var(--ink)]">{c.label}</span>
                  {(onTrade || picked > 0) && (
                    <span className="figure rounded-full bg-[var(--navy)] px-2 text-[11.5px] leading-5 text-white">{onTrade && !picked ? '✓' : picked}</span>
                  )}
                  <span className="text-[12.5px] text-[var(--muted)]">{list.length} services</span>
                  <Icon name="chevron-down" size={16} className="text-[var(--muted)] transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="space-y-3 border-t border-[var(--rule)] bg-[var(--band)] px-3.5 py-3.5">
                  <label className="flex cursor-pointer items-center gap-2.5 text-[14px] font-semibold text-[var(--ink)]">
                    <input type="checkbox" checked={onTrade} onChange={() => toggleTrade(c.id)} className="size-[18px] accent-[var(--navy)]" />
                    I do {c.label.toLowerCase()} work
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {list.map((o) => (
                      <button key={o.label} type="button" aria-pressed={has(o.label)} onClick={() => toggleService(o)} className="chip !h-8 !text-[13px]">
                        {has(o.label) && <Icon name="checkmark" size={12} strokeWidth={2.6} />}
                        {o.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[12.5px] text-[var(--muted)]">Something else in {c.label.toLowerCase()}? Type it in the search above and add it.</p>
                </div>
              </details>
            );
          })}
        </div>
      </section>
    </div>
  );
}
