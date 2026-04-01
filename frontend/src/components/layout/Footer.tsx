import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-nude px-4 py-6 lg:px-8 lg:py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 text-center sm:flex-row sm:justify-center sm:gap-4">
        <div className="flex items-baseline gap-1.5">
          <span className="font-serif text-lg font-bold tracking-wide text-primary-dark lg:text-xl">AA</span>
          <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-text lg:text-xs">
            Laser Med
          </span>
        </div>

        <span className="hidden text-text-light/40 sm:inline">&middot;</span>

        <p className="text-xs text-text-light lg:text-sm">
          {currentYear} AA Laser Med. Tous droits r&eacute;serv&eacute;s.
        </p>

        <span className="hidden text-text-light/40 sm:inline">&middot;</span>

        <Link
          to="/mentions-legales"
          className="text-xs text-text-light underline underline-offset-2 transition-colors hover:text-primary-dark lg:text-sm"
        >
          Mentions l&eacute;gales
        </Link>
      </div>
    </footer>
  );
}
