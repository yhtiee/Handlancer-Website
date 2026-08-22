/**
 * Single source of truth for site content, SEO copy and structured data.
 *
 * Categories, the escrow vocabulary and the job lifecycle here mirror the mobile
 * app (`src/constants/categories.ts`, `src/services/database.types.ts`) — if the
 * app's domain changes, change it here too so the marketing site can't drift
 * away from what the product actually does.
 */

/*
 * The one place the site origin is configured. Metadata, canonicals, the
 * sitemap, robots.txt and every JSON-LD @id derive from it.
 *
 * NEXT_PUBLIC_SITE_URL is inlined at build time. There is deliberately NO
 * VERCEL_URL fallback: preview deployments would otherwise emit canonicals and
 * OG URLs pointing at a throwaway *.vercel.app origin, which is how preview
 * builds end up competing with production in the index.
 */
const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.handlancer.com';

export const SITE_URL = rawSiteUrl.replace(/\/+$/, '');

export const SITE = {
  name: 'HandLancer',
  legalName: 'HandLancer',
  tagline: 'Hire trusted artisans. Pay only for work done.',
  description:
    'HandLancer is Nigeria’s escrow-protected marketplace for home services. Post a job, compare quotes from verified plumbers, electricians, carpenters and cleaners near you, and keep your money in escrow until the work is done right.',
  shortDescription:
    'Escrow-protected marketplace for hiring verified artisans in Nigeria.',
  email: 'handlancerng@gmail.com',
  country: 'Nigeria',
  currency: 'NGN',
  /* Pre-launch: every CTA points at #waitlist rather than a store listing.
     When the apps ship, add the store URLs here and repoint those CTAs. */
  launched: false,
} as const;

/* ------------------------------------------------------------------ */
/* Service categories — mirrors src/constants/categories.ts in the app */
/* ------------------------------------------------------------------ */

export type Category = {
  /** Stable key, mirrors the app's category ids. Submitted by the waitlist form
   *  and validated in lib/waitlist.ts — changing one breaks stored rows. */
  id: string;
  /** URL segment for /services/[trade]. Kept separate from `id` so the app
   *  parity key can stay short while the URL reads like English. */
  slug: string;
  label: string;
  /** One-line scope of the trade; also feeds the ItemList structured data. */
  blurb: string;
  /** Conversational "why people actually call" line, shown on the card. */
  demand: string;
};

export const CATEGORIES: Category[] = [
  {
    id: 'plumbing',
    slug: 'plumbing',
    label: 'Plumbing',
    blurb: 'Burst pipes, leaking taps, water heaters, soakaway and borehole work.',
    demand:
      'Most people post this one at the worst possible hour — a pipe that went overnight, or a tap that has been dripping since the last rainy season.',
  },
  {
    id: 'electrical',
    slug: 'electrical',
    label: 'Electrical',
    blurb: 'Wiring, sockets, DB boards, inverter and solar installation.',
    demand:
      'It usually starts with one socket that stopped working, and ends with somebody finally sizing the inverter properly.',
  },
  {
    id: 'carpentry',
    slug: 'carpentry',
    label: 'Carpentry',
    blurb: 'Wardrobes, kitchen cabinets, doors, ceilings and custom furniture.',
    demand:
      'New flat, empty rooms and a kitchen to fit out — or a wardrobe door that has been off its hinge long enough to count as furniture.',
  },
  {
    id: 'painting',
    slug: 'painting',
    label: 'Painting',
    blurb: 'Interior and exterior painting, screeding, POP finishing and texture.',
    demand:
      'Landlords ask before a tenant moves in. Everyone else asks after the rains have finished with the outside wall.',
  },
  {
    id: 'cleaning',
    slug: 'cleaning',
    label: 'Cleaning',
    blurb: 'Deep cleans, post-construction, fumigation and move-in cleaning.',
    demand:
      'Builders leave dust in places you did not know existed, keys change hands tomorrow, and the fumigation has been put off twice already.',
  },
  {
    id: 'appliance',
    slug: 'appliance-repair',
    label: 'Appliance Repair',
    blurb: 'Fridges, washing machines, microwaves, generators and gas cookers.',
    demand:
      'A fridge that hums but never gets cold, a generator that will not start on the second pull, a washing machine stuck halfway through a cycle.',
  },
  {
    id: 'masonry',
    slug: 'masonry',
    label: 'Masonry',
    blurb: 'Block work, plastering, tiling, interlocking and concrete repairs.',
    demand:
      'Tiling a bathroom properly, laying interlocking across the compound, or patching the plaster where damp has been getting in.',
  },
  {
    id: 'ac',
    slug: 'air-conditioning',
    label: 'AC & Cooling',
    blurb: 'Air conditioner installation, gassing, servicing and chiller repair.',
    demand:
      'It is always the first genuinely hot week of the year, and always the unit nobody serviced at the end of the last one.',
  },
  {
    id: 'auto',
    slug: 'auto-repair',
    label: 'Auto Repair',
    blurb: 'Mobile mechanics, diagnostics, panel beating and AC servicing.',
    demand:
      'A warning light nobody can explain, a car that will not start where it is parked, or a wing to beat out after somebody reversed into it.',
  },
  {
    id: 'gardening',
    slug: 'gardening',
    label: 'Gardening',
    blurb: 'Landscaping, lawn care, tree cutting and garden maintenance.',
    demand:
      'Lawns that got away during the rains, a tree leaning nearer the roof than it used to, or a bare compound being laid out from scratch.',
  },
  {
    id: 'moving',
    slug: 'moving',
    label: 'Moving & Haulage',
    blurb: 'House moves, office relocation, pickup trucks and dispatch.',
    demand:
      'A flat to empty before the weekend, an office to shift over a public holiday, or one heavy thing that was never going to fit in a car.',
  },
  {
    id: 'other',
    slug: 'handyman',
    label: 'More Trades',
    blurb: 'Welders, tailors, barbers, chefs, drivers and general handymen.',
    demand:
      'Gates and burglary bars, a suit that needs taking in, a driver for the week, and the small repairs nobody has a proper name for.',
  },
];

/* ------------------------------------------------------------------ */
/* Provider gallery — photos shipped with the mobile app               */
/* ------------------------------------------------------------------ */

export type Trade = { slug: string; label: string; craft: string };

/** Order is the marquee order; every entry has a matching /brand/providers/*.webp */
export const TRADES: Trade[] = [
  { slug: 'plumber', label: 'Plumber', craft: 'Pipework & fittings' },
  { slug: 'electrician', label: 'Electrician', craft: 'Wiring & inverters' },
  { slug: 'carpenter', label: 'Carpenter', craft: 'Furniture & fittings' },
  { slug: 'bricklayer', label: 'Bricklayer', craft: 'Block & plaster' },
  { slug: 'painter', label: 'Painter', craft: 'Interior & exterior' },
  { slug: 'welder', label: 'Welder', craft: 'Gates & railings' },
  { slug: 'mechanic', label: 'Mechanic', craft: 'Mobile diagnostics' },
  { slug: 'cleaning', label: 'Cleaner', craft: 'Deep & post-build' },
  { slug: 'gardener', label: 'Gardener', craft: 'Lawns & landscaping' },
  { slug: 'tailor', label: 'Tailor', craft: 'Bespoke & repairs' },
  { slug: 'barber', label: 'Barber', craft: 'Home service cuts' },
  { slug: 'hairdresser', label: 'Hairdresser', craft: 'Braids & styling' },
  { slug: 'chef', label: 'Chef', craft: 'Private & events' },
  { slug: 'driver', label: 'Driver', craft: 'Errands & logistics' },
  { slug: 'farmer', label: 'Farm Hand', craft: 'Seasonal labour' },
  { slug: 'artisan', label: 'Handyman', craft: 'Odd jobs & repairs' },
];

/* ------------------------------------------------------------------ */
/* Cities — local SEO surface                                          */
/* ------------------------------------------------------------------ */

export const CITIES = [
  'Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Benin City',
  'Enugu', 'Kaduna', 'Uyo', 'Abeokuta', 'Jos', 'Warri',
];

/* ------------------------------------------------------------------ */
/* FAQ — rendered on the page AND emitted as FAQPage structured data   */
/* ------------------------------------------------------------------ */

export type Faq = { q: string; a: string };

export const FAQS: Faq[] = [
  {
    q: 'Is HandLancer available yet?',
    a: 'Not yet — HandLancer is in build and we are opening city by city. Join the waitlist and we will email you the moment it goes live where you are. Customers and artisans have separate lists, so tell us which one you are; artisans on the list get their profiles reviewed and verified before customers start posting.',
  },
  {
    q: 'How does HandLancer escrow protect my money?',
    a: 'When you approve a quote, the full amount moves from your HandLancer wallet into escrow — it leaves your balance but the artisan cannot touch it yet. Escrow is split in two: the materials portion and the workmanship portion. You release materials so the artisan can buy supplies, and the workmanship portion is only released after you have seen the finished work and rated it. Until you release it, the money stays with HandLancer.',
  },
  {
    q: 'What is the difference between the materials and workmanship portions?',
    a: 'Every quote is itemised into material line items and labour line items. Those totals become the two halves of escrow. The artisan can request the materials portion early so they are not funding your cement and cable out of pocket, while the workmanship portion — their profit — stays locked until the job is signed off. It removes the classic standoff where neither side wants to pay or start first.',
  },
  {
    q: 'How much does HandLancer cost to use?',
    a: 'Posting a job, browsing artisans and receiving quotes is free. You fund your wallet for the value of the job you approve, and artisans withdraw their earnings to a Nigerian bank account secured by a transfer PIN.',
  },
  {
    q: 'How do I know an artisan is trustworthy?',
    a: 'Every provider has a public profile with a star rating, written reviews from previous customers, years of experience, listed skills and a verification badge. Ratings can only be left by a customer who actually hired and paid through the platform, so they cannot be gamed by strangers.',
  },
  {
    q: 'What happens if the work is not done properly?',
    a: 'Do not release the workmanship portion. Open a dispute from the job screen and the money stays frozen in escrow while the case is reviewed. Artisans upload before and after photos and videos of every job, so there is a timestamped record of the site condition on both sides.',
  },
  {
    q: 'How do artisans get paid?',
    a: 'Released escrow lands in the provider’s in-app wallet immediately. From there they request a withdrawal to their bank account, confirmed with a transfer PIN. Wallet top-ups and payouts run on Flutterwave.',
  },
  {
    q: 'Can I hire a specific artisan instead of posting publicly?',
    a: 'Yes. Browse the directory and send a direct hire request to one provider, and only they can quote. Or post the job publicly and let multiple artisans compete — quotes arrive sorted by total price so you can compare like for like.',
  },
  {
    q: 'Which cities does HandLancer cover?',
    a: `HandLancer is built for Nigeria and works anywhere you can reach an artisan, with the strongest coverage in ${CITIES.slice(0, 6).join(', ')} and other major cities. Providers set their own service radius, so you only see people who actually cover your area.`,
  },
  {
    q: 'Is HandLancer free to join as a service provider?',
    a: 'Yes. Create a provider profile, list your trades and service radius, and start quoting on open jobs straight away. You only need a bank account and a transfer PIN to withdraw what you earn.',
  },
];

/* ------------------------------------------------------------------ */
/* Structured data                                                     */
/* ------------------------------------------------------------------ */

export function buildJsonLd() {
  const org = {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: `${SITE_URL}/brand/logo.png`, width: 512, height: 512 },
    email: SITE.email,
    description: SITE.description,
    areaServed: { '@type': 'Country', name: 'Nigeria' },
    knowsAbout: CATEGORIES.map((c) => c.label),
  };

  const website = {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE.name,
    description: SITE.description,
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'en-NG',
  };

  const app = {
    '@type': 'MobileApplication',
    '@id': `${SITE_URL}/#app`,
    name: SITE.name,
    operatingSystem: 'Android, iOS',
    applicationCategory: 'BusinessApplication',
    description: SITE.description,
    url: SITE_URL,
    publisher: { '@id': `${SITE_URL}/#organization` },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'NGN' },
    featureList: [
      'Escrow-protected payments split into materials and workmanship',
      'Itemised quotes from multiple verified artisans',
      'In-app wallet with PIN-secured bank withdrawals',
      'Before and after photo and video proof of work',
      'Direct messaging between customer and artisan',
      'Verified reviews and star ratings',
      'Dispute resolution with funds held in escrow',
    ],
  };

  const services = {
    '@type': 'ItemList',
    '@id': `${SITE_URL}/#services`,
    name: 'Home services available on HandLancer',
    itemListElement: CATEGORIES.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Service',
        name: c.label,
        description: c.blurb,
        serviceType: c.label,
        provider: { '@id': `${SITE_URL}/#organization` },
        areaServed: CITIES.map((city) => ({ '@type': 'City', name: city })),
      },
    })),
  };

  const faq = {
    '@type': 'FAQPage',
    '@id': `${SITE_URL}/#faq`,
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': `${SITE_URL}/#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'How escrow works', item: `${SITE_URL}/#escrow` },
      { '@type': 'ListItem', position: 3, name: 'Services', item: `${SITE_URL}/#services` },
      { '@type': 'ListItem', position: 4, name: 'For artisans', item: `${SITE_URL}/#earn` },
    ],
  };

  return { '@context': 'https://schema.org', '@graph': [org, website, app, services, faq, breadcrumb] };
}
