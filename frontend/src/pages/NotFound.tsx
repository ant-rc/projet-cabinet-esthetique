import { Link } from 'react-router-dom';
import Seo from '@/components/Seo';

/**
 * Unknown URLs used to redirect to the home page, which made every typo look
 * like a second copy of the home page to a crawler. They now stop here.
 *
 * A real 404 status is impossible without server-side rendering — Vercel
 * rewrites every path to index.html and answers 200. The noindex directive is
 * what keeps these URLs out of the index in the meantime; prerendering will
 * restore the correct status code.
 */
export default function NotFound() {
  return (
    <section className="page-enter px-4 py-16 lg:px-8 lg:py-24">
      <Seo
        noindex
        path="/404"
        title="Page introuvable | AA Laser Med"
        description="Cette page n'existe pas ou a été déplacée."
      />
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
        <p className="font-serif text-5xl font-bold text-primary-dark">404</p>
        <h1 className="font-serif text-2xl font-bold text-text md:text-3xl">
          Cette page n&apos;existe pas
        </h1>
        <p className="text-base text-text-light">
          Le lien est peut-&ecirc;tre incomplet, ou la page a &eacute;t&eacute; d&eacute;plac&eacute;e.
          Voici les pages les plus consult&eacute;es&nbsp;:
        </p>

        <nav className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <Link
            to="/tarifs"
            className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-primary-dark"
          >
            Voir les tarifs
          </Link>
          <Link
            to="/reservation"
            className="rounded-full border border-primary-light px-8 py-3 text-sm font-semibold text-primary-dark transition-all duration-300 hover:bg-rose-soft/50"
          >
            Prendre rendez-vous
          </Link>
          <Link
            to="/contact"
            className="rounded-full border border-rose-soft px-8 py-3 text-sm font-semibold text-text-light transition-all duration-300 hover:bg-nude"
          >
            Nous contacter
          </Link>
        </nav>

        <Link to="/" className="text-sm text-primary-dark underline">
          Retour &agrave; l&apos;accueil
        </Link>
      </div>
    </section>
  );
}
