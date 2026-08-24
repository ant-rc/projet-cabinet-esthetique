import Hero from '@/components/home/Hero';
import About from '@/components/home/About';
import Technology from '@/components/home/Technology';
import Expertise from '@/components/home/Expertise';
import Zones from '@/components/home/Zones';
import PricingPreview from '@/components/home/PricingPreview';
import CTASection from '@/components/home/CTASection';
import FAQ from '@/components/home/FAQ';
import Seo from '@/components/Seo';

export default function Home() {
  return (
    <>
      <Seo
        path="/"
        title="Épilation laser définitive à Magny-le-Hongre — AA Laser Med"
        description="Centre d'épilation laser définitive à Magny-le-Hongre (Val d'Europe). Infirmière diplômée d'État, laser Candela GentleMax Pro, tous phototypes. Tarifs affichés, 1re consultation gratuite."
      />
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
