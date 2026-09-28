import type { Metadata } from 'next';

import { QueryProvider } from '@/components/admin/query-provider';

import './admin.css';

/*
 * Everything under /admin: the sign-in screen and the console (the `(console)`
 * route group, which adds the authenticated shell). Nested inside the site's
 * root layout for the fonts and tokens, but none of the marketing chrome.
 *
 * QueryProvider sits here, above both, so the sign-in mutation and the
 * console's queries share one client.
 */
export const metadata: Metadata = {
  title: {
    default: 'Admin',
    template: '%s · HandLancer Admin',
  },
  // Belt and braces with robots.ts: never index, never follow.
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return <QueryProvider>{children}</QueryProvider>;
}
