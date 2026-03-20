import { Link } from 'react-router-dom';
import { epilationCategories, getPricingByCategory } from '@/data/pricing';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function Pricing() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="page-enter px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-center font-serif text-3xl font-bold text-text md:text-4xl">
          Nos Tarifs
        </h1>
        <p className="mt-4 text-center text-base text-text-light">
          Tous nos tarifs sont indiqués par séance. Un devis personnalisé vous sera
          proposé lors de la consultation initiale.
        </p>

        <div ref={ref} className={`reveal ${isVisible ? 'visible' : ''} mt-12 flex flex-col gap-10`}>
          {epilationCategories.map((cat) => {
            const items = getPricingByCategory(cat.id);
            return (
              <div key={cat.id}>
                <div className="mb-6 flex items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">{cat.icon}</span>
                  <div>
                    <h2 className="font-serif text-xl font-semibold text-text">
                      {cat.label}
                    </h2>
                    <p className="text-sm text-text-light">{cat.description}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <article
                      key={item.id}
                      className="card-hover flex flex-col items-center gap-3 rounded-2xl border border-primary-light/50 bg-white p-8 text-center"
                    >
                      <h3 className="font-serif text-lg font-semibold text-text">
                        {item.zone}
                      </h3>
                      <p className="text-sm text-text-light">{item.description}</p>
                      <p className="mt-2 text-3xl font-bold text-primary-dark">
                        {item.price}&euro;
                      </p>
                      <p className="text-xs text-text-light">par {item.unit}</p>
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <p className="text-base text-text-light">
            Prête à franchir le pas&nbsp;?
          </p>
          <Link
            to="/rendez-vous"
            className="rounded-full bg-primary px-10 py-4 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-primary-dark hover:shadow-xl"
          >
            Prendre rendez-vous
          </Link>
        </div>
      </div>
    </section>
  );
}
