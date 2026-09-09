import { useState } from 'react';
import { Link } from 'react-router-dom';
import { faqData } from '@/data/pricing';
import { faqPages } from '@/data/faqPages';
import { useScrollReveal } from '@/hooks/useScrollReveal';

/** Questions that also exist as a standalone page, by question text. */
const SLUG_BY_QUESTION = new Map(faqPages.map((p) => [p.question, p.slug]));

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { ref, isVisible } = useScrollReveal();

  function toggle(index: number) {
    setOpenIndex((prev) => (prev === index ? null : index));
  }

  return (
    <section className="px-4 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-3xl">
        <div ref={ref} className={`reveal ${isVisible ? 'visible' : ''}`}>
          <h2 className="text-center font-serif text-3xl font-bold text-text md:text-4xl">
            Foire Aux Questions
          </h2>
        </div>

        <div className={`reveal ${isVisible ? 'visible' : ''} mt-12 flex flex-col gap-3`}>
          {faqData.map((item, index) => {
            const isOpen = openIndex === index;
            const slug = SLUG_BY_QUESTION.get(item.question);

            return (
              <div
                key={item.question}
                className={`rounded-xl border transition-all duration-300 ${
                  isOpen
                    ? 'border-primary-light bg-white shadow-md'
                    : 'border-rose-soft bg-white hover:border-primary-light hover:shadow-sm'
                }`}
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  onClick={() => toggle(index)}
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-medium text-text md:text-base">
                    {item.question}
                  </span>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm transition-all duration-400 ${
                      isOpen
                        ? 'rotate-45 bg-primary text-white'
                        : 'bg-nude text-primary-dark'
                    }`}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </button>

                {/*
                  Trois niveaux, et aucun n'est décoratif.

                  Le premier porte la grille qui anime le repli. Le deuxième est
                  volontairement nu : c'est lui que le CSS masque, et le moindre
                  padding dessus l'empêcherait de descendre à zéro. Le troisième
                  porte l'espacement.
                */}
                <div className={`faq-content ${isOpen ? 'open' : ''}`}>
                  <div>
                    <div className="flex flex-col gap-2 px-6 pb-5">
                      <p className="text-sm leading-relaxed text-text-light">{item.answer}</p>
                      {slug && (
                        <Link
                          to={`/faq/${slug}`}
                          className="self-start text-sm text-primary-dark underline"
                        >
                          En savoir plus
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <Link to="/faq" className="text-sm text-primary-dark underline">
            Voir toutes les questions fr&eacute;quentes
          </Link>
        </div>
      </div>
    </section>
  );
}
