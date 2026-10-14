import type { Metadata, Viewport } from 'next';

import { AppProviders } from '@/components/app/providers';
import { ServiceWorkerRegistrar } from '@/components/app/pwa';

import '../dashboard.css';
import './app.css';

/*
 * /app — the HandLancer product on the web, ported from the mobile app
 * (Handlancer-Mobile-Application). Nested in the site's root layout for the
 * fonts and tokens, but none of the marketing chrome.
 *
 * Every screen is a Client Component reading Supabase from the browser, as the
 * app does; proxy.ts keeps the session cookie fresh and turns signed-out
 * visitors to /app/sign-in.
 */
export const metadata: Metadata = {
  title: {
    default: 'HandLancer',
    template: '%s · HandLancer',
  },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  appleWebApp: { capable: true, title: 'HandLancer', statusBarStyle: 'default' },
};

/*
 * `cover` lets the installed app draw under the notch and home bar; app.css
 * pads the top bar and tab bar back out with env(safe-area-inset-*).
 * `resizes-content` keeps a pinned composer above the on-screen keyboard.
 */
export const viewport: Viewport = {
  themeColor: '#FBFCFD',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="hl-app">
      <AppProviders>{children}</AppProviders>
      <ServiceWorkerRegistrar />
    </div>
  );
}
