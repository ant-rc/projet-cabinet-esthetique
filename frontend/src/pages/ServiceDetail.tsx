import { useParams, Link } from 'react-router-dom';
import Seo, { SITE_URL } from '@/components/Seo';
import NotFound from '@/pages/NotFound';
import { categories, centerInfo } from '@/data/pricing';
import { findService, relatedServices, servicePath, genderToSlug } from '@/lib/serviceRoutes';
import type { DbService } from '@/types';

/** Protocol figures come from the FAQ, which is the client-validated wording. */
const SESSIONS_MIN = 6;
const SESSIONS_MAX = 8;
const WEEKS_BETWEEN = '4 à 8 semaines';

function totalProtocolCost(service: DbService): { min: number; max: number } {
  return { min: service.price * SESSIONS_MIN, max: service.price * SESSIONS_MAX };
}

export default function ServiceDetail() {
  const { gender, slug } = useParams<{ gender: string; slug: string }>();
  const service = findService(gender, slug);

  // An unknown zone must not render an empty priced page: 47 valid URLs would
  // otherwise open an unlimited number of indexable near-empty ones.
  if (!service) return <NotFound />;

  const genderLabel = service.gender === 'female' ? 'Femme' : 'Homme';
  const categoryLabel =
    categories.find((c) => c.id === service.category)?.label ?? service.category;
  const path = servicePath(service);
  const related = relatedServices(service);
  const total = totalProtocolCost(service);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Épilation laser ${service.name.toLowerCase()} ${genderLabel.toLowerCase()}`,
    serviceType: 'Épilation laser définitive',
    url: `${SITE_URL}${path}`,
    provider: { '@id': `${SITE_URL}/#business` },
    areaServed: { '@type': 'City', name: 'Magny-le-Hongre' },
    offers: {
      '@type': 'Offer',
      price: service.price,
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/reservation`,
    },
  };

  return (
    <section className="page-enter px-4 py-16 lg:px-8 lg:py-24">
      <Seo
        path={path}
        title={`Épilation laser ${service.name.toLowerCase()} ${genderLabel.toLowerCase()} — ${service.price} € la séance | Magny-le-Hongre`}
        description={`Épilation laser définitive ${service.name.toLowerCase()} ${genderLabel.toLowerCase()} à Magny-le-Hongre : ${service.price} € la séance, ${service.duration} min. Comptez ${SESSIONS_MIN} à ${SESSIONS_MAX} séances. Consultation gratuite avec tir d'essai.`}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        <nav aria-label="Fil d'ariane" className="flex flex-wrap gap-2 text-xs text-text-light">
          <Link to="/" className="hover:text-primary-dark">Accueil</Link>
          <span aria-hidden="true">/</span>
          <Link to="/tarifs" className="hover:text-primary-dark">Tarifs</Link>
          <span aria-hidden="true">/</span>
          <span className="text-text">{genderLabel} &mdash; {service.name}</span>
        </nav>

        <header className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-dark">
            {genderLabel} &middot; {categoryLabel}
          </p>
          {/* Gender belongs in the heading, not only in the title: "Nuque"
              exists in both catalogues at different prices, and two pages
              sharing one h1 read as duplicates. */}
          <h1 className="font-serif text-3xl font-bold text-text md:text-4xl">
            &Eacute;pilation laser {service.name.toLowerCase()} {genderLabel.toLowerCase()}
          </h1>
          <p className="text-base text-text-light">
            &Agrave; Magny-le-Hongre, au laser Candela GentleMax Pro, par une infirmi&egrave;re
            dipl&ocirc;m&eacute;e d&apos;&Eacute;tat. Tous phototypes, de I &agrave; VI.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1 rounded-2xl border border-primary-light/50 bg-white px-6 py-5">
            <p className="text-xs text-text-light">Prix &agrave; la s&eacute;ance</p>
            <p className="text-3xl font-bold text-primary-dark">{service.price}&euro;</p>
          </div>
          <div className="flex flex-col gap-1 rounded-2xl border border-rose-soft bg-white px-6 py-5">
            <p className="text-xs text-text-light">Dur&eacute;e</p>
            <p className="text-3xl font-bold text-text">{service.duration}<span className="text-base font-medium"> min</span></p>
          </div>
          <div className="flex flex-col gap-1 rounded-2xl border border-rose-soft bg-white px-6 py-5">
            <p className="text-xs text-text-light">S&eacute;ances</p>
            <p className="text-3xl font-bold text-text">{SESSIONS_MIN}&ndash;{SESSIONS_MAX}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl bg-nude px-6 py-5">
          <h2 className="font-serif text-lg font-semibold text-text">Le co&ucirc;t r&eacute;el du protocole</h2>
          <p className="text-sm leading-relaxed text-text-light">
            L&apos;&eacute;pilation laser se fait en s&eacute;ries. Comptez en moyenne{' '}
            <strong className="text-text">{SESSIONS_MIN} &agrave; {SESSIONS_MAX} s&eacute;ances</strong>{' '}
            espac&eacute;es de {WEEKS_BETWEEN}, soit{' '}
            <strong className="text-text">{total.min}&euro; &agrave; {total.max}&euro;</strong> pour
            un protocole complet sur cette zone. D&egrave;s la 3<sup>e</sup> s&eacute;ance, la
            r&eacute;duction est d&eacute;j&agrave; nette.
          </p>
          <p className="text-sm leading-relaxed text-text-light">
            <strong className="text-text">La premi&egrave;re consultation est gratuite</strong>, dure
            30 minutes et comprend un tir d&apos;essai : vous v&eacute;rifiez la tol&eacute;rance de
            votre peau avant de vous engager. Aucun devis payant, aucun frais de dossier.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-serif text-lg font-semibold text-text">Avant votre s&eacute;ance</h2>
          <p className="text-sm leading-relaxed text-text-light">
            Rasez la zone la veille ou le matin m&ecirc;me. La peau doit &ecirc;tre propre, sans
            maquillage, cr&egrave;me, d&eacute;odorant ni huile. Pas de cire ni de pince dans les
            3 semaines pr&eacute;c&eacute;dentes, et pas d&apos;exposition au soleil ni
            d&apos;autobronzant 2 &agrave; 6 semaines avant.
          </p>
          <p className="text-sm leading-relaxed text-text-light">
            Certaines situations contre-indiquent le traitement &mdash; grossesse, allaitement,
            maladies auto-immunes, infections cutan&eacute;es actives, anticoagulants, traitements
            photosensibilisants. Elles sont v&eacute;rifi&eacute;es en consultation.{' '}
            <Link to="/mentions-legales" className="text-primary-dark underline">
              Informations l&eacute;gales et RGPD
            </Link>
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 rounded-2xl border border-primary-light/50 px-6 py-8 text-center">
          <p className="text-base text-text-light">
            R&eacute;servez votre consultation gratuite, en ligne, 24h/24.
          </p>
          <Link
            to="/reservation"
            className="rounded-full bg-primary px-10 py-4 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-primary-dark hover:shadow-xl"
          >
            Prendre rendez-vous
          </Link>
          <p className="text-xs text-text-light">
            Ou par t&eacute;l&eacute;phone au{' '}
            <a href={`tel:${centerInfo.phone.replace(/\s/g, '')}`} className="text-primary-dark underline">
              {centerInfo.phone}
            </a>
          </p>
        </div>

        {related.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-serif text-lg font-semibold text-text">
              Autres zones &mdash; {categoryLabel.toLowerCase()} {genderLabel.toLowerCase()}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {related.map((item) => (
                <Link
                  key={item.id}
                  to={servicePath(item)}
                  className="card-hover flex items-center justify-between rounded-2xl border border-rose-soft bg-white px-6 py-4"
                >
                  <span className="text-sm font-semibold text-text">{item.name}</span>
                  <span className="text-lg font-bold text-primary-dark">{item.price}&euro;</span>
                </Link>
              ))}
            </div>
            <Link
              to={`/tarifs?gender=${genderToSlug(service.gender)}`}
              className="text-sm text-primary-dark underline"
            >
              Voir tous les tarifs {genderLabel.toLowerCase()}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
