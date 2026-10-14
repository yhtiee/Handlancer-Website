import { Categories } from '@/lib/app/constants/categories';

/**
 * `profiles.services` holds category ids ('plumbing') so the trade filters on
 * both apps match them. Older profiles hold free text ('Plumbing', 'Tiling');
 * this shows either one properly.
 */
export function serviceLabel(service: string): string {
  return Categories.find((c) => c.id === service || c.label.toLowerCase() === service.toLowerCase())?.label ?? service;
}
