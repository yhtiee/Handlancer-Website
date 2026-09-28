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
};

export default nextConfig;
