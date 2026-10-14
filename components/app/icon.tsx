/**
 * App icons. Names are the Ionicons names the mobile app uses (categories,
 * notification copy), so ported code passes them through unchanged; the
 * drawings follow components/admin/icons.tsx — 24px grid, currentColor stroke,
 * no icon package.
 */
import type { SVGProps } from 'react';

const PATHS = {
  // Navigation
  home: <><path d="M3.5 10.5 12 3.5l8.5 7" /><path d="M5.5 9v11h13V9" /><path d="M10 20v-6h4v6" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7" /><path d="M3 12.5h18" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>,
  chatbubble: <><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v10a1.5 1.5 0 0 1-1.5 1.5H9l-5 3.5v-15Z" /></>,
  chatbubbles: <><path d="M14.5 4h-10A1.5 1.5 0 0 0 3 5.5v8.5l3.5-2.5h8a1.5 1.5 0 0 0 1.5-1.5v-4.5A1.5 1.5 0 0 0 14.5 4Z" /><path d="M16 9h3.5A1.5 1.5 0 0 1 21 10.5V19l-3.5-2.5H11a1.5 1.5 0 0 1-1.5-1.5V14" /></>,
  wallet: <><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" /><rect x="4" y="8" width="16.5" height="12" rx="2" /><path d="M16.5 14h.01" /></>,
  person: <><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" /></>,
  people: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" /><path d="M18.5 14.2A6.5 6.5 0 0 1 21.5 20" /></>,
  notifications: <><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15l1.5-2Z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" /></>,
  'help-circle': <><circle cx="12" cy="12" r="8.5" /><path d="M9.6 9.5a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2.2-2.4 3.5" /><path d="M12 17h.01" /></>,
  'log-out': <><path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14" /><path d="M10 16.5 5.5 12 10 7.5" /><path d="M5.5 12H15" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  close: <><path d="M6 6l12 12M18 6 6 18" /></>,
  add: <><path d="M12 5v14M5 12h14" /></>,
  remove: <><path d="M5 12h14" /></>,
  'chevron-back': <><path d="m14.5 6-6 6 6 6" /></>,
  'chevron-forward': <><path d="m9.5 6 6 6-6 6" /></>,
  'chevron-down': <><path d="m6 9.5 6 6 6-6" /></>,
  'arrow-forward': <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  'arrow-up': <><path d="M12 19V5M6 11l6-6 6 6" /></>,
  'arrow-down': <><path d="M12 5v14M6 13l6 6 6-6" /></>,
  options: <><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></>,
  send: <><path d="M4 12 20 4l-5 16-3-7-8-1Z" /><path d="m12 13 8-9" /></>,
  camera: <><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.3l1.4-2h5.6l1.4 2h2.3A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-9Z" /><circle cx="12" cy="12.5" r="3.3" /></>,
  image: <><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="9.5" r="1.6" /><path d="m20.5 15.5-5-5-9 9" /></>,
  videocam: <><rect x="3" y="6.5" width="12.5" height="11" rx="2" /><path d="m15.5 10.5 5.5-3v9l-5.5-3" /></>,
  location: <><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></>,
  time: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  'lock-closed': <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></>,
  'eye-off': <><path d="M4 4l16 16" /><path d="M9.9 5.8A9.5 9.5 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.6 3.4M6.2 7.4A16 16 0 0 0 2.5 12S6 18.5 12 18.5a9.3 9.3 0 0 0 4.3-1" /></>,
  copy: <><rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2" /><path d="M15.5 8.5V5.5A1.5 1.5 0 0 0 14 4H5.5A1.5 1.5 0 0 0 4 5.5V14a1.5 1.5 0 0 0 1.5 1.5h3" /></>,
  create: <><path d="M4 20h4L19 9a2.1 2.1 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>,
  trash: <><path d="M4 7h16M9.5 7V4.5h5V7M6 7l1 13h10l1-13" /></>,
  'open-outline': <><path d="M13.5 4H20v6.5M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
  refresh: <><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3L19.5 9" /><path d="M19.5 4v5h-5" /></>,
  'cloud-offline': <><path d="M4 4l16 16" /><path d="M8.5 7.5A5.5 5.5 0 0 1 17 11a3.5 3.5 0 0 1 3 4.5M17 19H7a4 4 0 0 1-1.3-7.8" /></>,
  download: <><path d="M12 4v11M7 10l5 5 5-5" /><path d="M5 19.5h14" /></>,
  'phone-portrait': <><rect x="6.5" y="2.5" width="11" height="19" rx="2" /><path d="M11 18h2" /></>,
  'logo-whatsapp': <><path d="M4 20l1.2-4A8.3 8.3 0 1 1 8.4 19L4 20Z" /><path d="M9 9.5c.3 1.9 2.4 4.3 5 5l1-1.4-1.8-1-.8.8c-.9-.4-1.8-1.3-2.2-2.2l.8-.8-1-1.8L9 9.5Z" /></>,
  mail: <><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  flag: <><path d="M5.5 21V4" /><path d="M5.5 4.5h11l-2 4 2 4h-11" /></>,
  'information-circle': <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5M12 7.8h.01" /></>,
  'checkmark': <><path d="m5 12.5 4.5 4.5L19 7.5" /></>,

  // Status
  'checkmark-circle': <><circle cx="12" cy="12" r="8.5" /><path d="m8.2 12.3 2.6 2.6 5-5.4" /></>,
  'close-circle': <><circle cx="12" cy="12" r="8.5" /><path d="m9 9 6 6M15 9l-6 6" /></>,
  warning: <><path d="M12 4 2.8 19.5h18.4L12 4Z" /><path d="M12 10v4.5M12 17h.01" /></>,
  'shield-checkmark': <><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6L12 3Z" /><path d="m8.8 12 2.3 2.3 4.1-4.4" /></>,
  star: <><path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8L12 3.5Z" /></>,
  'document-text': <><path d="M6.5 3.5h7l4.5 4.5v12.5h-11.5Z" /><path d="M13.5 3.5V8H18M9 12.5h6M9 16h6" /></>,
  card: <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h3" /></>,
  cash: <><rect x="2.5" y="6.5" width="19" height="11" rx="1.5" /><circle cx="12" cy="12" r="2.5" /><path d="M6 9.5v5M18 9.5v5" /></>,
  receipt: <><path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3v-17Z" /><path d="M9 8h6M9 11.5h6M9 15h3.5" /></>,

  // Trades (categories.ts)
  water: <><path d="M12 3.5s-6 6.6-6 11a6 6 0 0 0 12 0c0-4.4-6-11-6-11Z" /></>,
  flash: <><path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z" /></>,
  hammer: <><path d="m13.5 9.5-9 9a1.6 1.6 0 0 0 2.3 2.3l9-9" /><path d="m11 7 3-3c2-.5 4.5.5 6 3l-3 1-1 1 1.5 1.5-2 2L10 7.5" /></>,
  brush: <><path d="M19.5 3.5 11 12" /><path d="M10.5 12.5c-2-.5-4 .5-4.5 3S4.5 19 3.5 20c3 .5 6.5 0 7.5-2.5s.5-4.5-.5-5" /></>,
  sparkles: <><path d="M10 4.5 11.6 9l4.4 1.5-4.4 1.6L10 16.5l-1.6-4.4L4 10.5 8.4 9 10 4.5Z" /><path d="M17.5 14v5M15 16.5h5" /></>,
  construct: <><path d="M14.5 6.5a3.8 3.8 0 0 0 4.8 4.8L21 13l-3 3-1.7-1.7a3.8 3.8 0 0 0-4.8-4.8" /><path d="m11.5 9.5-8 8a1.8 1.8 0 0 0 2.5 2.5l8-8" /></>,
  business: <><rect x="4" y="3.5" width="10" height="17" /><path d="M14 9.5h6v11h-6M7 7.5h4M7 11h4M7 14.5h4M17 13.5h.01M17 17h.01" /></>,
  snow: <><path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" /><path d="m9.5 4.5 2.5 2 2.5-2M9.5 19.5l2.5-2 2.5 2" /></>,
  'car-sport': <><path d="M3.5 15.5v-3l2-4.5h13l2 4.5v3" /><path d="M3.5 15.5h17v2.5h-17Z" /><circle cx="7.5" cy="15.5" r="1" /><circle cx="16.5" cy="15.5" r="1" /><path d="M5.5 12h13" /></>,
  leaf: <><path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15" /><path d="M5 19 13 11" /></>,
  cube: <><path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>,
  'ellipsis-horizontal-circle': <><circle cx="12" cy="12" r="8.5" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></>,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  strokeWidth = 1.7,
  ...rest
}: { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, 'name'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name] ?? PATHS.briefcase}
    </svg>
  );
}
