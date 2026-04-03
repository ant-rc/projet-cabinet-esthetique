import { Link } from 'react-router-dom';

const LEGAL_LINKS = [
  { to: '/mentions-legales', label: 'Mentions légales' },
  { to: '/mentions-legales?tab=cgu', label: 'CGU' },
  { to: '/mentions-legales?tab=cgv', label: 'CGV' },
  { to: '/mentions-legales?tab=rgpd', label: 'RGPD' },
  { to: '/mentions-legales?tab=cookies', label: 'Cookies' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-nude px-4 py-6 lg:px-8 lg:py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-center">
        <div className="flex items-baseline gap-1.5">
          <span className="font-serif text-lg font-bold tracking-wide text-primary-dark lg:text-xl">AA</span>
          <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-text lg:text-xs">
            Laser Med
          </span>
        </div>

        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
          {LEGAL_LINKS.map(({ to, label }, i) => (
            <span key={to} className="flex items-center gap-3">
              {i > 0 && <span className="text-text-light/40">&middot;</span>}
              <Link
                to={to}
                className="text-xs text-text-light underline underline-offset-2 transition-colors hover:text-primary-dark lg:text-sm"
              >
                {label}
              </Link>
            </span>
          ))}
          <span className="flex items-center gap-3">
            <span className="text-text-light/40">&middot;</span>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}
              className="text-xs text-text-light underline underline-offset-2 transition-colors hover:text-primary-dark lg:text-sm"
            >
              G&eacute;rer les cookies
            </button>
          </span>
        </div>

        <p className="text-xs text-text-light/60 lg:text-sm">
          &copy; {currentYear} AA LASERMED &mdash; SAS au capital de 1 000 &euro; &mdash; RCS Meaux 100 897 057
        </p>
      </div>
    </footer>
  );
}
