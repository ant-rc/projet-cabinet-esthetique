import { useScrollReveal } from '@/hooks/useScrollReveal';

const ITEMS = [
  {
    title: 'Consultation personnalisée',
    description: 'Analyse de votre peau et définition d\u2019un protocole sur mesure.',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="h-10 w-10" aria-hidden="true">
        <circle cx="20" cy="20" r="18" fill="#f5e6e0" />
        <path d="M14 20 L18 24 L26 16" stroke="#a87e6d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Traitement professionnel',
    description: 'Équipement de dernière génération, normes médicales strictes.',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="h-10 w-10" aria-hidden="true">
        <circle cx="20" cy="20" r="18" fill="#f5e6e0" />
        <path d="M20 12 L20 28 M12 20 L28 20" stroke="#a87e6d" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Suivi individualisé',
    description: 'Accompagnement attentif avec bilans réguliers.',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="h-10 w-10" aria-hidden="true">
        <circle cx="20" cy="20" r="18" fill="#f5e6e0" />
        <path d="M14 25 C14 19 20 14 20 14 C20 14 26 19 26 25" stroke="#a87e6d" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <circle cx="20" cy="25" r="2" fill="#a87e6d" />
      </svg>
    ),
  },
];

export default function Expertise() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="bg-nude px-4 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-4xl">
        <div ref={ref} className={`reveal ${isVisible ? 'visible' : ''}`}>
          <h2 className="text-center font-serif text-3xl font-bold text-text md:text-4xl">
            Votre Parcours Expert
          </h2>
        </div>

        <div className={`reveal-stagger ${isVisible ? 'visible' : ''} mt-12 grid gap-6 md:grid-cols-3`}>
          {ITEMS.map((item) => (
            <article
              key={item.title}
              className="card-hover flex flex-col items-center gap-4 rounded-2xl border border-primary-light/50 bg-white p-8 text-center"
            >
              {item.icon}
              <h3 className="font-serif text-lg font-semibold text-text">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-text-light">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
