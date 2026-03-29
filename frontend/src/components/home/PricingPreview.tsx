import { Link } from 'react-router-dom';
import { servicesData } from '@/data/pricing';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const PREVIEW_IDS = [
  '550e8400-e29b-41d4-a716-446655440022', // Demi-jambes (femme)
  '550e8400-e29b-41d4-a716-446655440013', // Maillot intégral (femme)
  '550e8400-e29b-41d4-a716-446655440015', // Aisselles (femme)
] as const;

export default function PricingPreview() {
  const { ref, isVisible } = useScrollReveal();

  const previewItems = servicesData.filter((item) =>
    (PREVIEW_IDS as readonly string[]).includes(item.id),
  );

  return (
    <section id="tarifs" className="bg-nude px-4 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-4xl">
        <div ref={ref} className={`reveal ${isVisible ? 'visible' : ''}`}>
          <h2 className="text-center font-serif text-3xl font-bold text-text md:text-4xl">
            Nos Tarifs
          </h2>
        </div>

        <div className={`reveal-stagger ${isVisible ? 'visible' : ''} mt-12 grid gap-6 sm:grid-cols-3`}>
          {previewItems.map((item) => (
            <article
              key={item.id}
              className="card-hover flex flex-col items-center gap-3 rounded-2xl border border-primary-light/50 bg-white p-8 text-center"
            >
              <h3 className="font-serif text-lg font-semibold text-text">{item.name}</h3>
              <p className="text-3xl font-bold text-primary-dark">{item.price}&euro;</p>
              <p className="text-xs text-text-light">par séance</p>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/tarifs"
            className="text-sm font-medium text-primary-dark underline underline-offset-4 transition-colors hover:text-primary"
          >
            Voir tous nos tarifs
          </Link>
        </div>
      </div>
    </section>
  );
}
