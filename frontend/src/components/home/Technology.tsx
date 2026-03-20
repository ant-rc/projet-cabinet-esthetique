import { useScrollReveal } from '@/hooks/useScrollReveal';

const ADVANTAGES = [
  'Résultats visibles dès les premières séances',
  'Adapté à toutes les carnations (phototypes I à VI)',
  'Traitement rapide et précis',
  'Sécurité optimale certifiée',
];

const COMFORT_POINTS = [
  'Réduction considérable de la sensation de chaleur',
  'Protection active de la peau',
  'Séance beaucoup plus confortable',
];

export default function Technology() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="bg-nude px-4 py-20 lg:px-8 lg:py-28">
      <div ref={ref} className="mx-auto max-w-5xl">
        <div className={`reveal ${isVisible ? 'visible' : ''} text-center`}>
          <h2 className="font-serif text-3xl font-bold text-text md:text-4xl">
            Notre Technologie
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-text-light">
            Épilation laser définitive avec la technologie Candela GentleMax Pro
          </p>
        </div>

        <div className={`reveal ${isVisible ? 'visible' : ''} mt-12 grid gap-8 lg:grid-cols-2`}>
          {/* Left: image + machine info */}
          <div className="flex flex-col gap-6">
            <div className="overflow-hidden rounded-2xl border border-primary-light/30 shadow-lg">
              <img
                src="/images/epilation-mannequin-machine.jpeg"
                alt="Séance d'épilation laser avec le Candela GentleMax Pro — adapté à tous les types de peau"
                className="h-auto w-full object-cover"
                loading="lazy"
              />
            </div>

            <div className="rounded-2xl border border-primary-light/50 bg-white p-6">
              <h3 className="font-serif text-lg font-semibold text-text">
                Candela GentleMax Pro
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-light">
                Laser médical haut de gamme, référence mondiale en épilation définitive.
                Grâce à sa <strong className="text-text">double technologie Alexandrite &amp; Nd:yav</strong>,
                il traite efficacement <strong className="text-text">tous les types de peau</strong>,
                même les plus sensibles, avec des résultats rapides et durables.
              </p>
            </div>
          </div>

          {/* Right: advantages + comfort */}
          <div className="flex flex-col gap-6">
            <div className="card-hover rounded-2xl border border-primary-light/50 bg-white p-6">
              <h3 className="font-serif text-lg font-semibold text-text">
                Pourquoi cette technologie&nbsp;?
              </h3>
              <ul className="mt-4 flex flex-col gap-3">
                {ADVANTAGES.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-text-light">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs text-green-600">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-hover rounded-2xl border border-primary-light/50 bg-white p-6">
              <h3 className="font-serif text-lg font-semibold text-text">
                Confort optimal pendant la séance
              </h3>
              <p className="mt-2 text-sm text-text-light">
                Nos soins sont réalisés avec un système de refroidissement avancé
                <strong className="text-text"> CryoAir</strong>, qui diffuse de l&apos;air froid
                en continu pour :
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                {COMFORT_POINTS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-text-light">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">
                      ❄
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-center text-sm font-medium text-primary-dark">
              Une technologie performante, pour une peau nette, douce et durablement
              débarrassée des poils.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
