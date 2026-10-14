import 'server-only';

import { SERVICES } from '@/lib/services';

/**
 * The service catalogue (lib/services.ts — the same one behind the indexed
 * /services pages), trimmed to what a picker needs. Built on the server and
 * passed to the client as props, so the 60 KB of page copy never ships to the
 * browser.
 */
export type ServiceOption = { label: string; category: string; aliases: string[] };

export const SERVICE_OPTIONS: ServiceOption[] = SERVICES.map((s) => ({
  label: s.label,
  category: s.category,
  aliases: s.aliases ?? [],
}));
