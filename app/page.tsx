import type { Metadata } from 'next';
import { HOME_TITLE } from './layout';
import { buildMetadata } from '@/lib/seo';
import { SITE } from '@/lib/site';
import { Nav } from '@/components/nav';
import { Hero } from '@/components/hero';
import { EscrowSimulator } from '@/components/escrow-simulator';
import { Services } from '@/components/services';
import { HowItWorks } from '@/components/how-it-works';
import { Trust } from '@/components/trust';
import { Earnings } from '@/components/earnings';
import { Faq } from '@/components/faq';
import { Waitlist } from '@/components/waitlist';
import { Cta, Footer } from '@/components/cta';

export const metadata: Metadata = buildMetadata({
  path: '/',
  title: HOME_TITLE,
  description: SITE.description,
  absoluteTitle: true,
});

export default function Page() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <EscrowSimulator />
        <Services />
        <HowItWorks />
        <Trust />
        <Earnings />
        <Faq />
        <Waitlist />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
