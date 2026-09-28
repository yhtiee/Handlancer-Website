/**
 * Admin console icons. Same drawing rules as components/icons.tsx (24px grid,
 * currentColor stroke) so the console reads as part of the same product.
 */
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;

function Svg({ children, ...p }: P & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...p}
    >
      {children}
    </svg>
  );
}

export const IconOverview = (p: P) => (
  <Svg {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></Svg>
);
export const IconUsers = (p: P) => (
  <Svg {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" /><path d="M18.5 14.2A6.5 6.5 0 0 1 21.5 20" /></Svg>
);
export const IconBriefcase = (p: P) => (
  <Svg {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7" /><path d="M3 12.5h18" /></Svg>
);
export const IconShield = (p: P) => (
  <Svg {...p}><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6L12 3Z" /><path d="M12 8.5v4" /><path d="M12 15.8h.01" /></Svg>
);
export const IconWallet = (p: P) => (
  <Svg {...p}><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" /><rect x="4" y="8" width="16.5" height="11" rx="2" /><path d="M16 13.5h.01" /></Svg>
);
export const IconClipboard = (p: P) => (
  <Svg {...p}><rect x="5" y="4.5" width="14" height="16" rx="2" /><path d="M9 4.5V3.8A.8.8 0 0 1 9.8 3h4.4a.8.8 0 0 1 .8.8v.7" /><path d="M9 10h6" /><path d="M9 14h6" /></Svg>
);
export const IconMenu = (p: P) => (
  <Svg {...p}><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></Svg>
);
export const IconClose = (p: P) => (
  <Svg {...p}><path d="m6 6 12 12" /><path d="M18 6 6 18" /></Svg>
);
export const IconLogout = (p: P) => (
  <Svg {...p}><path d="M14 4h3.5A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5H14" /><path d="M10 16.5 5.5 12 10 7.5" /><path d="M5.5 12H15" /></Svg>
);
export const IconSearch = (p: P) => (
  <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.4-4.4" /></Svg>
);
export const IconChevronLeft = (p: P) => (
  <Svg {...p}><path d="m14.5 6-6 6 6 6" /></Svg>
);
export const IconChevronRight = (p: P) => (
  <Svg {...p}><path d="m9.5 6 6 6-6 6" /></Svg>
);
export const IconArrowUpRight = (p: P) => (
  <Svg {...p}><path d="M7 17 17 7" /><path d="M8 7h9v9" /></Svg>
);
export const IconInbox = (p: P) => (
  <Svg {...p}><path d="M3.5 13.5 6 5.5A1.5 1.5 0 0 1 7.4 4.5h9.2A1.5 1.5 0 0 1 18 5.5l2.5 8" /><path d="M3.5 13.5V18a1.5 1.5 0 0 0 1.5 1.5h14a1.5 1.5 0 0 0 1.5-1.5v-4.5h-5a3.5 3.5 0 0 1-7 0h-5Z" /></Svg>
);
export const IconChart = (p: P) => (
  <Svg {...p}><path d="M4 20V4" /><path d="M4 20h16" /><path d="m7.5 15 3.5-4 3 2.5 5-6" /></Svg>
);
export const IconDownload = (p: P) => (
  <Svg {...p}><path d="M12 4v11" /><path d="m7.5 10.5 4.5 4.5 4.5-4.5" /><path d="M5 19.5h14" /></Svg>
);
export const IconPresent = (p: P) => (
  <Svg {...p}><rect x="3" y="4" width="18" height="12.5" rx="1.5" /><path d="M12 16.5V20" /><path d="M8.5 20h7" /><path d="m10.5 8 3.5 2.25-3.5 2.25V8Z" /></Svg>
);
export const IconTable = (p: P) => (
  <Svg {...p}><rect x="3.5" y="4.5" width="17" height="15" rx="1.5" /><path d="M3.5 9.5h17" /><path d="M3.5 14.5h17" /><path d="M9.5 9.5v10" /></Svg>
);
export const IconImage = (p: P) => (
  <Svg {...p}><rect x="3.5" y="4.5" width="17" height="15" rx="1.5" /><circle cx="9" cy="10" r="1.6" /><path d="m20.5 16-4.5-4.5-8.5 8" /></Svg>
);
export const IconInfo = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5" /><path d="M12 8h.01" /></Svg>
);
