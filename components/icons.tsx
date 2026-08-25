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

/* -- social glyphs -------------------------------------------------------- */

/**
 * Brand marks are filled glyphs, not the 1.7px stroke the icon set above uses —
 * a stroked outline of a wordmark stops being the wordmark. Same 24 grid and
 * currentColor, so they still inherit the footer's muted → navy hover.
 */
function BrandSvg({ children, ...p }: P & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...p}>
      {children}
    </svg>
  );
}

export const IconTikTok = (p: P) => (
  <BrandSvg {...p}><path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 0 1 0-5.18c.27 0 .52.04.76.12v-3.2a5.9 5.9 0 0 0-.76-.05 5.7 5.7 0 1 0 5.7 5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.3 4.3 0 0 1-3.26-1.48Z" /></BrandSvg>
);
export const IconX = (p: P) => (
  <BrandSvg {...p}><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" /></BrandSvg>
);
export const IconInstagram = (p: P) => (
  <BrandSvg {...p}><path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.64.07 4.85 0 3.2-.01 3.58-.07 4.85-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07-3.2 0-3.58-.01-4.85-.07-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.64-.07-4.85 0-3.2.01-3.58.07-4.85.15-3.23 1.66-4.77 4.92-4.92 1.27-.06 1.65-.07 4.85-.07ZM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12c0 3.26.01 3.67.07 4.95.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24c3.26 0 3.67-.01 4.95-.07 4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95 0-3.26-.01-3.67-.07-4.95-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.41-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z" /></BrandSvg>
);

export const IconFacebook = (p: P) => (
  <BrandSvg {...p}><path d="M9.1 23.69v-7.98H6.63v-3.67H9.1v-1.58c0-4.08 1.85-5.98 5.86-5.98.4 0 .96.04 1.47.1.51.07.94.16 1.14.2v3.32a8.6 8.6 0 0 0-.65-.03c-.25-.01-.5-.01-.74-.01-.7 0-1.25.1-1.67.31a1.7 1.7 0 0 0-.68.62c-.26.42-.37 1-.37 1.75v1.3h3.92l-.39 2.1-.29 1.57h-3.24v8.24C19.4 23.24 24 18.18 24 12.04 24 5.42 18.63.04 12 .04S0 5.42 0 12.04c0 5.63 3.87 10.35 9.1 11.65Z" /></BrandSvg>
);

/** Social `icon` key (lib/site.ts) → glyph. */
export const SOCIAL_ICONS: Record<string, (p: P) => React.ReactElement> = {
  tiktok: IconTikTok,
  x: IconX,
  instagram: IconInstagram,
  facebook: IconFacebook,
};

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
