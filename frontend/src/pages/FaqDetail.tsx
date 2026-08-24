import { useParams, Link } from 'react-router-dom';
import Seo, { SITE_URL } from '@/components/Seo';
import NotFound from '@/pages/NotFound';
import { findFaqPage, relatedFaqPages } from '@/data/faqPages';

export default function FaqDetail() {
  const { slug } = useParams<{ slug: string }>();
  const page = findFaqPage(slug);

  if (!page) return <NotFound />;

  const related = relatedFaqPages(page.slug);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: page.question,
      url: `${SITE_URL}/faq/${page.slug}`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: [page.answer, ...page.context].join(' '),
      },
    },
  };

  return (
    <section className="page-enter px-4 py-16 lg:px-8 lg:py-24">
      <Seo
        path={`/faq/${page.slug}`}
        title={`${page.title} — AA Laser Med`}
        description={page.description}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        <nav aria-label="Fil d'ariane" className="flex flex-wrap gap-2 text-xs text-text-light">
          <Link to="/" className="hover:text-primary-dark">Accueil</Link>
          <span aria-hidden="true">/</span>
          <Link to="/faq" className="hover:text-primary-dark">Questions fr&eacute;quentes</Link>
        </nav>

        <header className="flex flex-col gap-4">
          <h1 className="font-serif text-3xl font-bold text-text md:text-4xl">{page.title}</h1>
        </header>

        <div className="flex flex-col gap-4">
          <p className="rounded-2xl bg-nude px-6 py-5 text-base leading-relaxed text-text">
            {page.answer}
          </p>
          {page.context.map((paragraph) => (
            <p key={paragraph} className="text-sm leading-relaxed text-text-light">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4 rounded-2xl border border-primary-light/50 px-6 py-8 text-center">
          <p className="text-base text-text-light">
            Une question sur votre situation&nbsp;? La consultation initiale est gratuite et
            comprend un tir d&apos;essai.
          </p>
          <Link
            to="/reservation"
            className="rounded-full bg-primary px-10 py-4 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-primary-dark hover:shadow-xl"
          >
            Prendre rendez-vous
          </Link>
          <Link to="/tarifs" className="text-sm text-primary-dark underline">
            Voir les tarifs par zone
          </Link>
        </div>

        {related.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-serif text-lg font-semibold text-text">Autres questions</h2>
            <div className="flex flex-col gap-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  to={`/faq/${item.slug}`}
                  className="card-hover rounded-2xl border border-rose-soft bg-white px-6 py-4 text-sm font-semibold text-text"
                >
                  {item.question}
                </Link>
              ))}
            </div>
            <Link to="/faq" className="text-sm text-primary-dark underline">
              Toutes les questions fr&eacute;quentes
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
