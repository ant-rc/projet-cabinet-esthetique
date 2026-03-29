import { Link } from 'react-router-dom';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { categories, getServicesByGenderAndCategory } from '@/data/pricing';

export default function Zones() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="px-4 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-5xl">
        <div ref={ref} className={`reveal ${isVisible ? 'visible' : ''} text-center`}>
          <h2 className="font-serif text-3xl font-bold text-text md:text-4xl">
            Zones traitées
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-text-light">
            Découvrez nos prestations d&apos;épilation laser par zone.
          </p>
        </div>

        <div className={`reveal-stagger ${isVisible ? 'visible' : ''} mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3`}>
          {categories.map((cat) => {
            const items = getServicesByGenderAndCategory('female', cat.id).slice(0, 4);
            return (
              <div
                key={cat.id}
                className="card-hover flex flex-col gap-4 rounded-2xl border border-primary-light/50 bg-white p-6"
              >
                <h3 className="font-serif text-lg font-semibold capitalize text-text">{cat.label}</h3>

                <div className="flex flex-col gap-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl bg-nude px-4 py-3 transition-colors duration-200 hover:bg-rose-soft"
                    >
                      <span className="text-sm font-medium text-text">{item.name}</span>
                      <span className="text-sm font-bold text-primary-dark">{item.price}&euro;</span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/reservation"
                  className="mt-auto self-start rounded-full bg-primary/10 px-5 py-2 text-xs font-semibold text-primary-dark transition-all duration-300 hover:bg-primary hover:text-white"
                >
                  Réserver
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
