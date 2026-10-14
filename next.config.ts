import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Reuse a dynamic page's server payload for 30s after a visit, so going
    // back to an admin console page within that window needs no server round
    // trip at all; its data comes from the TanStack cache and refreshes in the
    // background. The marketing pages are static and unaffected (they use the
    // `static` window, left at its default).
    staleTimes: {
      dynamic: 30,
    },
  },
  async headers() {
    return [
      {
        // The signed-in surfaces: never framed (clickjacking a "Release
        // payment" button is the attack), no referrer leaking job ids.
        source: '/:area(app|admin)/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // The /app service worker (public/sw.js). Never cached, so a fix ships
        // on the next visit; same-origin scripts only. See the Next.js PWA guide.
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
