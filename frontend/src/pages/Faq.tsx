import { Link } from 'react-router-dom';
import Seo, { SITE_URL } from '@/components/Seo';
import { staticMeta } from '@/lib/pageMeta';
import { faqPages } from '@/data/faqPages';

export default function Faq() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqPages.map((page) => ({
      '@type': 'Question',
      name: page.question,
      url: `${SITE_URL}/faq/${page.slug}`,
      acceptedAnswer: { '@type': 'Answer', text: page.answer },
    })),
  };

  return (
    <section className="page-enter px-4 py-16 lg:px-8 lg:py-24">
      <Seo {...staticMeta('/faq')} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        <header className="flex flex-col gap-4 text-center">
          <h1 className="font-serif text-3xl font-bold text-text md:text-4xl">
            Questions fr&eacute;quentes
          </h1>
          <p className="text-base text-text-light">
            Les questions pos&eacute;es avant une premi&egrave;re s&eacute;ance, et leurs
            r&eacute;ponses. Si la v&ocirc;tre n&apos;y est pas, la consultation initiale est
            gratuite et sert exactement &agrave; &ccedil;a.
          </p>
        </header>

        <div className="flex flex-col gap-4">
          {faqPages.map((page) => (
            <article
              key={page.slug}
              className="flex flex-col gap-2 rounded-2xl border border-rose-soft bg-white px-6 py-5"
            >
              <h2 className="font-serif text-lg font-semibold text-text">
                <Link to={`/faq/${page.slug}`} className="hover:text-primary-dark">
                  {page.question}
                </Link>
              </h2>
              <p className="text-sm leading-relaxed text-text-light">{page.answer}</p>
              <Link
                to={`/faq/${page.slug}`}
                className="self-start text-sm text-primary-dark underline"
              >
                En savoir plus
              </Link>
            </article>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4 rounded-2xl border border-primary-light/50 px-6 py-8 text-center">
          <p className="text-base text-text-light">
            La premi&egrave;re consultation est gratuite, dure 30 minutes et comprend un tir
            d&apos;essai.
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
