import { Categories } from '@/lib/app/constants/categories';

/**
 * `profiles.services` holds category ids ('plumbing') so the trade filters on
 * both apps match them. Older profiles hold free text ('Plumbing', 'Tiling');
 * this shows either one properly.
 */
export function serviceLabel(service: string): string {
  return Categories.find((c) => c.id === service || c.label.toLowerCase() === service.toLowerCase())?.label ?? service;
}

const TRADE_IDS = new Set<string>(Categories.map((c) => c.id));

/**
 * A provider's trades and services without the catch-all "Other". Picking a
 * service files it under its trade, so "Interior design" is stored beside
 * 'other' — which tells a customer nothing.
 */
export function withoutOther(services: string[] | null | undefined): string[] {
  return (services ?? []).filter((s) => s.trim().toLowerCase() !== 'other');
}

/** The one thing a provider is listed as: their first real trade, else their first named service. */
export function mainServiceLabel(services: string[] | null | undefined): string | undefined {
  const named = withoutOther(services);
  const main = named.find((s) => TRADE_IDS.has(s)) ?? named[0];
  return main ? serviceLabel(main) : undefined;
}
