/**
 * Line icons drawn to match the Ionicons set the mobile app uses, so a category
 * on the website reads as the same thing it does in the app. Stroke-based,
 * currentColor, 24px grid.
 */
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;

function Svg({ children, ...p }: P & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
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

/* -- category icons (keyed by the app's category ids) -------------------- */

export const IconWater = (p: P) => (
  <Svg {...p}><path d="M12 2.7s6 6.4 6 10.7a6 6 0 0 1-12 0c0-4.3 6-10.7 6-10.7Z" /><path d="M9.2 13.6a2.9 2.9 0 0 0 2.9 2.9" /></Svg>
);
export const IconFlash = (p: P) => (
  <Svg {...p}><path d="M13.4 2 4.6 13.2h6L10.2 22l9.2-11.5h-6.4L13.4 2Z" /></Svg>
);
export const IconHammer = (p: P) => (
  <Svg {...p}><path d="m14.6 6.3 3.1 3.1" /><path d="M11.8 3.5 9 6.3l1.6 1.6 2.1-.7 3.9 3.9 2.8-2.8-3.9-3.9.7-2.1-1.6-1.6-2.8 2.8Z" /><path d="m10.6 7.9-7 7a1.9 1.9 0 0 0 0 2.7l2.8 2.8a1.9 1.9 0 0 0 2.7 0l7-7" /></Svg>
);
export const IconBrush = (p: P) => (
  <Svg {...p}><path d="M9.5 14.5 3 21" /><path d="M20.9 3.1a2.1 2.1 0 0 0-3 0l-7.6 7.6 3 3 7.6-7.6a2.1 2.1 0 0 0 0-3Z" /><path d="M7.5 12.5 11 16a3.5 3.5 0 0 1-5.6 4.1" /></Svg>
);
export const IconSparkles = (p: P) => (
  <Svg {...p}><path d="m12 2.8 1.9 5.3 5.3 1.9-5.3 1.9L12 17.2l-1.9-5.3L4.8 10l5.3-1.9L12 2.8Z" /><path d="m18.5 15.5.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1Z" /></Svg>
);
export const IconConstruct = (p: P) => (
  <Svg {...p}><path d="M14.6 6.1a3.9 3.9 0 0 1 5.1 5.1l-1.6-1.6-2 .4-.4-2-1.1-1.9Z" /><path d="m14.2 9.8-9 9a2 2 0 0 0 2.8 2.8l9-9" /><path d="M4.3 4.3 8 8" /><path d="M3 8.5 8.5 3" /></Svg>
);
export const IconBusiness = (p: P) => (
  <Svg {...p}><path d="M3 21h18" /><path d="M4 21V6.5a1 1 0 0 1 .6-.9l7-3a1 1 0 0 1 1.4.9V21" /><path d="M13 10h6a1 1 0 0 1 1 1v10" /><path d="M7.5 9v.01M7.5 13v.01M7.5 17v.01M16.5 14v.01M16.5 17.5v.01" /></Svg>
);
export const IconSnow = (p: P) => (
  <Svg {...p}><path d="M12 2v20M2 12h20" /><path d="m5 5 14 14M19 5 5 19" /><path d="M12 6.5 9.8 4.6M12 6.5l2.2-1.9M12 17.5l-2.2 1.9M12 17.5l2.2 1.9" /></Svg>
);
export const IconCar = (p: P) => (
  <Svg {...p}><path d="M4.5 16.5h15" /><path d="M6 16.5V19a.9.9 0 0 1-.9.9H4.4A.9.9 0 0 1 3.5 19v-2.5" /><path d="M20.5 16.5V19a.9.9 0 0 1-.9.9h-.7a.9.9 0 0 1-.9-.9v-2.5" /><path d="M3.5 16.5v-4l1.8-4.7A2 2 0 0 1 7.2 6.5h9.6a2 2 0 0 1 1.9 1.3l1.8 4.7v4" /><path d="M4 12.5h16" /><path d="M7 14.5v.01M17 14.5v.01" /></Svg>
);
export const IconLeaf = (p: P) => (
  <Svg {...p}><path d="M4 20c8.5 0 16-4.5 16-14 0 0-3 1-6.5 1S6 8.5 6 12a5 5 0 0 0 3 4.6" /><path d="M4 20c1.5-4.5 4.5-7.5 8.5-9.5" /></Svg>
);
export const IconCube = (p: P) => (
  <Svg {...p}><path d="M12 2.6 20.5 7v10L12 21.4 3.5 17V7L12 2.6Z" /><path d="M3.5 7 12 11.5 20.5 7M12 11.5v9.9" /></Svg>
);
export const IconGrid = (p: P) => (
  <Svg {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></Svg>
);

/** Category id → icon, matching src/constants/categories.ts. */
export const CATEGORY_ICONS: Record<string, (p: P) => React.ReactElement> = {
  plumbing: IconWater,
  electrical: IconFlash,
  carpentry: IconHammer,
  painting: IconBrush,
  cleaning: IconSparkles,
  appliance: IconConstruct,
  masonry: IconBusiness,
  ac: IconSnow,
  auto: IconCar,
  gardening: IconLeaf,
  moving: IconCube,
  other: IconGrid,
};

/* -- UI icons ------------------------------------------------------------ */

export const IconShield = (p: P) => (
  <Svg {...p}><path d="M12 2.8 4.5 6v6c0 4.6 3.1 8 7.5 9.2 4.4-1.2 7.5-4.6 7.5-9.2V6L12 2.8Z" /><path d="m9 12 2.2 2.2L15.4 10" /></Svg>
);
export const IconLock = (p: P) => (
  <Svg {...p}><rect x="4.5" y="10" width="15" height="11" rx="2.5" /><path d="M8 10V7.5a4 4 0 0 1 8 0V10" /><path d="M12 14.5v2.5" /></Svg>
);
export const IconWallet = (p: P) => (
  <Svg {...p}><path d="M20.5 9V7.5a2 2 0 0 0-2-2H5a1.5 1.5 0 0 1 0-3h12.5" /><path d="M3 4.5v13a2 2 0 0 0 2 2h13.5a2 2 0 0 0 2-2V9H5" /><path d="M16.5 13.5v.01" /></Svg>
);
export const IconChat = (p: P) => (
  <Svg {...p}><path d="M20.5 12.5c0 4-3.8 7.2-8.5 7.2a10 10 0 0 1-2.6-.3L4.5 21l1.3-3.6A6.9 6.9 0 0 1 3.5 12.5c0-4 3.8-7.2 8.5-7.2s8.5 3.2 8.5 7.2Z" /></Svg>
);
export const IconCamera = (p: P) => (
  <Svg {...p}><path d="M3.5 8.5a2 2 0 0 1 2-2h1.9l1.2-2h6.8l1.2 2h1.9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-9Z" /><circle cx="12" cy="13" r="3.4" /></Svg>
);
export const IconStar = (p: P) => (
  <Svg {...p}><path d="m12 3.2 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8-5.4 2.8 1-6L3.2 9.6l6.1-.9L12 3.2Z" /></Svg>
);
export const IconScale = (p: P) => (
  <Svg {...p}><path d="M12 3.5v17M7 20.5h10" /><path d="M3 9.5h6.5L6.2 16 3 9.5Z" /><path d="M14.5 9.5H21L17.8 16l-3.3-6.5Z" /><path d="M12 6.5 3 9.5M12 6.5l9 3" /></Svg>
);
export const IconSearch = (p: P) => (
  <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></Svg>
);
export const IconArrowRight = (p: P) => (
  <Svg {...p}><path d="M4.5 12h15M13.5 6l6 6-6 6" /></Svg>
);
export const IconCheck = (p: P) => (
  <Svg {...p}><path d="m5 12.5 4.5 4.5L19 7" /></Svg>
);
export const IconChevron = (p: P) => (
  <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>
);
export const IconMenu = (p: P) => (
  <Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>
);
export const IconClose = (p: P) => (
  <Svg {...p}><path d="m6 6 12 12M18 6 6 18" /></Svg>
);
export const IconBolt = (p: P) => IconFlash(p);
export const IconUser = (p: P) => (
  <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" /></Svg>
);
export const IconTools = (p: P) => IconConstruct(p);
export const IconPin = (p: P) => (
  <Svg {...p}><path d="M12 21.5s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" /><circle cx="12" cy="10.5" r="2.8" /></Svg>
);
export const IconDoc = (p: P) => (
  <Svg {...p}><path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5L14 3.5Z" /><path d="M13.5 3.5V9h5.5" /><path d="M8.5 13h7M8.5 16.5h4.5" /></Svg>
);

/** The app's logo mark, redrawn as inline SVG so the nav has no image request. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      {/* roof — brand navy */}
      <path
        d="M6 22.5 24 8l18 14.5"
        fill="none"
        stroke="var(--navy)"
        strokeWidth={4.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M35.5 10.5h4.2v7.2l-4.2-3.4v-3.8Z" fill="var(--navy)" />
      {/* house body + wrench — teal */}
      <path
        d="M11.5 20.5v18h25v-18"
        fill="none"
        stroke="var(--teal)"
        strokeWidth={3.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28.4 19.6a5.6 5.6 0 0 0-7.6 6.6l-6.4 6.4a2.4 2.4 0 1 0 3.4 3.4l6.4-6.4a5.6 5.6 0 0 0 6.6-7.6l-3 3-2.4-.6-.6-2.4 3-3Z"
        fill="var(--teal)"
      />
    </svg>
  );
}
