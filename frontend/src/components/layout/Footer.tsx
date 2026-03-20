import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-nude px-4 py-10 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center">
        <div className="flex items-baseline gap-1.5">
          <span className="font-serif text-xl font-bold tracking-wide text-primary-dark">AA</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-text">
            Laser Med
          </span>
        </div>

        <p className="text-sm text-text-light">
          {currentYear} AA Laser Med. Tous droits réservés.
        </p>

        <Link
          to="/mentions-legales"
          className="text-sm text-text-light underline underline-offset-2 transition-colors hover:text-primary-dark"
        >
          Mentions légales
        </Link>
      </div>
    </footer>
  );
}
