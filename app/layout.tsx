import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Newsreader, Spline_Sans } from 'next/font/google';
import './globals.css';
import { SITE, SITE_URL, buildJsonLd, CATEGORIES, CITIES } from '@/lib/site';

/*
 * Three faces, three jobs. Inter is deliberately not among them — it is the
 * default in essentially every AI design tool, and reads as "nobody chose this".
 *
 *   Spline Sans  headings, UI, buttons — the app's own `--font-display`
 *   Newsreader   ledes, pull quotes, italic emphasis (carries the accent a
 *                gradient would otherwise have carried)
 *   Plex Mono    every naira figure, section number and the escrow log
 */
const spline = Spline_Sans({
  variable: '--font-spline',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#FBFCFD',
  width: 'device-width',
  initialScale: 1,
  // No maximumScale/userScalable — pinch-zoom must stay available.
};

const TITLE = 'HandLancer — Hire Trusted Artisans in Nigeria, Pay Only for Work Done';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: '%s | HandLancer',
  },
  description: SITE.description,
  applicationName: SITE.name,
  category: 'business',
  keywords: [
    'hire artisans Nigeria',
    'find a plumber near me',
    'electrician near me Lagos',
    'carpenter Nigeria',
    'home services app Nigeria',
    'escrow payment artisans',
    'handyman app Nigeria',
    'AC repair Lagos',
    'cleaning services Abuja',
    'artisan marketplace',
    'skilled workers Nigeria',
    'HandLancer',
    ...CATEGORIES.flatMap((c) => c.searches),
    ...CITIES.map((c) => `artisans in ${c}`),
  ],
  authors: [{ name: SITE.name, url: SITE_URL }],
  creator: SITE.name,
  publisher: SITE.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: SITE_URL,
    siteName: SITE.name,
    title: TITLE,
    description: SITE.description,
    images: [
      {
        url: '/handlancer-preview.png',
        width: 1200,
        height: 630,
        alt: 'HandLancer — Hire Trusted Artisans in Nigeria, Pay Only for Work Done',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: SITE.shortDescription,
    images: ['/handlancer-preview.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en-NG"
      className={`${spline.variable} ${newsreader.variable} ${plexMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col">
        {/* Scroll-reveal starts hidden and is un-hidden by JS; without JS the page
            would render blank, so force everything visible instead. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
        {children}
        <script
          type="application/ld+json"
          // Structured data is a static object we build ourselves — no user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd()) }}
        />
      </body>
    </html>
  );
}
