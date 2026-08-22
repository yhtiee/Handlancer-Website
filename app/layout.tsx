import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Newsreader, Spline_Sans } from 'next/font/google';
import './globals.css';
import { SITE, SITE_URL } from '@/lib/site';
import { jsonLdGraph, organizationSchema, websiteSchema } from '@/lib/schema';
import { JsonLd } from '@/components/json-ld';

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

export const HOME_TITLE = 'HandLancer — Hire Trusted Artisans in Nigeria, Pay Only for Work Done';

/*
 * Site-wide defaults only. Anything that must be unique per route — the
 * canonical, og:url, and the page title/description — is built per page by
 * lib/seo.ts. In particular there is NO `alternates` here: metadata merges
 * shallowly, so an inherited `canonical: '/'` would point every sub-page at the
 * homepage.
 *
 * Open Graph and Twitter images come from the app/opengraph-image.png and
 * app/twitter-image.png file conventions, which resolve against metadataBase
 * and carry their own width/height/type. Declaring them here as absolute URLs
 * (as this file used to) bypasses metadataBase entirely.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: HOME_TITLE,
    template: '%s | HandLancer',
  },
  description: SITE.description,
  applicationName: SITE.name,
  category: 'business',
  authors: [{ name: SITE.name, url: SITE_URL }],
  creator: SITE.name,
  publisher: SITE.name,
  /* Google Search Console ownership. The token is public by design — it only
     proves control of this domain and grants nothing. Set here rather than in
     lib/seo.ts so it lands in <head> on every route, not just the homepage:
     Search Console re-checks it periodically and property-level checks can hit
     any URL. `verification` is its own top-level key, so the shallow merge that
     replaces `openGraph` per page does not affect it. */
  verification: {
    google: '54uz-0dEP-VSpwqXmVcaRygrtIM6g6ndYesery_WJig',
  },
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    siteName: SITE.name,
    title: HOME_TITLE,
    description: SITE.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: SITE.shortDescription,
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
        {/* Site-wide only. Page-specific schema (FAQPage, ItemList, Service,
            BreadcrumbList) is emitted by the page that shows that content. */}
        <JsonLd graph={jsonLdGraph(organizationSchema(), websiteSchema())} />
      </body>
    </html>
  );
}
