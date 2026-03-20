import Hero from '@/components/home/Hero';
import About from '@/components/home/About';
import Technology from '@/components/home/Technology';
import Expertise from '@/components/home/Expertise';
import Zones from '@/components/home/Zones';
import PricingPreview from '@/components/home/PricingPreview';
import CTASection from '@/components/home/CTASection';
import FAQ from '@/components/home/FAQ';

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Technology />
      <Expertise />
      <Zones />
      <PricingPreview />
      <CTASection />
      <FAQ />
    </>
  );
}
