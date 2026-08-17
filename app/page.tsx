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
