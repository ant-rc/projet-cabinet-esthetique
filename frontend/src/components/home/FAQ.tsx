import { useState } from 'react';
import { faqData } from '@/data/pricing';
import { useScrollReveal } from '@/hooks/useScrollReveal';

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

                <div className={`faq-content ${isOpen ? 'open' : ''}`}>
                  <div>
                    <p className="px-6 pb-5 text-sm leading-relaxed text-text-light">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
