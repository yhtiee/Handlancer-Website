import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

/*
 * The installable app is /app (the PWA port of the mobile app), not the
 * marketing homepage. `scope: '/app'` keeps the installed window on the
 * product: a link out to a guide or the terms opens in the browser instead.
 *
 * Colours are the paper canvas (globals.css --paper), matching
 * viewport.themeColor — the old #0E1116 was the app's dark theme and flashed a
 * black splash before a light page.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/app',
    name: `${SITE.name} — ${SITE.tagline}`,
    short_name: SITE.name,
    description: SITE.shortDescription,
    start_url: '/app',
    scope: '/app',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FBFCFD',
    theme_color: '#FBFCFD',
    categories: ['business', 'lifestyle', 'productivity'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'My jobs', url: '/app/jobs' },
      { name: 'Messages', url: '/app/messages' },
      { name: 'Wallet', url: '/app/wallet' },
    ],
  };
}
