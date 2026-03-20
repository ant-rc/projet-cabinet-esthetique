import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function About() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="px-4 py-20 lg:px-8 lg:py-28">
      <div ref={ref} className="mx-auto flex max-w-5xl flex-col items-center gap-12 lg:flex-row lg:gap-16">
        {/* Left: image */}
        <div className={`reveal-left ${isVisible ? 'visible' : ''} flex flex-1 items-center justify-center`}>
          <div className="relative">
            <div className="absolute inset-0 -m-4 rounded-[2rem] bg-gradient-to-br from-rose-soft to-primary-light/40 blur-xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-primary-light/30 shadow-lg">
              <img
                src="/images/epilation-mannequin.jpeg"
                alt="Résultat épilation laser — peau lisse et douce"
                className="h-auto w-full max-w-md object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* Right: text */}
        <div className={`reveal-right ${isVisible ? 'visible' : ''} flex flex-1 flex-col gap-6 text-center lg:text-left`}>
          <h2 className="font-serif text-3xl font-bold text-text md:text-4xl">
            À Propos de Nous
          </h2>

          <div className="flex flex-col gap-4 text-base leading-relaxed text-text-light">
            <p>
              Infirmière diplômée d&apos;État avec plusieurs années d&apos;expérience
              dans le domaine paramédical.
            </p>
            <p>
              Formée et certifiée en épilation laser par un médecin esthétique,
              elle met son expertise au service de votre bien-être et de votre beauté.
            </p>
            <p>
              Équipée du <strong className="text-text">Candela GentleMax Pro</strong>,
              référence mondiale en épilation définitive, pour des traitements sûrs,
              efficaces et adaptés à tous les types de peau.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
