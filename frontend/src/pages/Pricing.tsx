import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getServicesByGender, getCategoriesForGender } from '@/data/pricing';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import type { Gender, ServiceCategory } from '@/types';

export default function Pricing() {
  const { ref, isVisible } = useScrollReveal();
  const [gender, setGender] = useState<Gender>('female');
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | null>(null);

  const categories = useMemo(() => getCategoriesForGender(gender), [gender]);
  const services = useMemo(() => getServicesByGender(gender), [gender]);

  const filteredServices = useMemo(() => {
    if (!activeCategory) return services;
    return services.filter((s) => s.category === activeCategory);
  }, [services, activeCategory]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, typeof filteredServices> = {};
    for (const s of filteredServices) {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    }
    return groups;
  }, [filteredServices]);

  return (
    <section className="page-enter px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-center font-serif text-3xl font-bold text-text md:text-4xl">
          Nos Tarifs
        </h1>
        <p className="mt-4 text-center text-base text-text-light">
          Tous nos tarifs sont indiqués par séance. La première consultation est gratuite.
        </p>

        {/* Gender toggle */}
        <div className="mt-8 flex justify-center">
          <div className="flex overflow-hidden rounded-xl border border-rose-soft">
            <button
              type="button"
              onClick={() => { setGender('female'); setActiveCategory(null); }}
              className={`px-8 py-3 text-sm font-medium transition-all duration-300 ${
                gender === 'female' ? 'bg-primary text-white' : 'bg-white text-text-light hover:bg-nude'
              }`}
            >
              Femme
            </button>
            <button
              type="button"
              onClick={() => { setGender('male'); setActiveCategory(null); }}
              className={`px-8 py-3 text-sm font-medium transition-all duration-300 ${
                gender === 'male' ? 'bg-primary text-white' : 'bg-white text-text-light hover:bg-nude'
              }`}
            >
              Homme
            </button>
          </div>
        </div>

        {/* Category filter */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
              activeCategory === null
                ? 'bg-primary text-white shadow-md'
                : 'border border-rose-soft bg-white text-text-light hover:border-primary-light'
            }`}
          >
            Toutes les zones
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                activeCategory === cat.id
                  ? 'bg-primary text-white shadow-md'
                  : 'border border-rose-soft bg-white text-text-light hover:border-primary-light'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Services grid */}
        <div ref={ref} className={`reveal ${isVisible ? 'visible' : ''} mt-10 flex flex-col gap-10`}>
          {Object.entries(groupedByCategory).map(([category, items]) => {
            const catInfo = categories.find((c) => c.id === category);
            return (
              <div key={category}>
                <h2 className="mb-6 font-serif text-xl font-semibold capitalize text-text">
                  {catInfo?.label ?? category}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <article
                      key={item.id}
                      className="card-hover flex items-center justify-between rounded-2xl border border-primary-light/50 bg-white px-6 py-5"
                    >
                      <div>
                        <h3 className="font-semibold text-text">{item.name}</h3>
                        <p className="mt-1 text-xs text-text-light">{item.duration} min</p>
                      </div>
                      <p className="text-2xl font-bold text-primary-dark">{item.price}&euro;</p>
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <p className="text-base text-text-light">
            Prêt(e) à franchir le pas ?
          </p>
          <Link
            to="/reservation"
            className="rounded-full bg-primary px-10 py-4 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-primary-dark hover:shadow-xl"
          >
            Prendre rendez-vous
          </Link>
        </div>
      </div>
    </section>
  );
}
