import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/', label: 'Accueil' },
  { to: '/tarifs', label: 'Tarifs' },
  { to: '/rendez-vous', label: 'Rendez-vous' },
  { to: '/contact', label: 'Contact' },
  { to: '/mon-compte', label: 'Mon Compte' },
] as const;

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    function handleScroll() {
      setHasScrolled(window.scrollY > 10);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`sticky top-0 z-50 bg-white/95 backdrop-blur-sm transition-shadow duration-300 ${
        hasScrolled ? 'shadow-md' : ''
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-8">
        <Link to="/" className="flex items-baseline gap-1.5" aria-label="AA Laser Med — Accueil">
          <span className="font-serif text-2xl font-bold tracking-wide text-primary-dark">AA</span>
          <span className="text-sm font-semibold uppercase tracking-widest text-text">
            Laser Med
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Navigation principale">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`text-sm font-medium transition-colors duration-200 hover:text-primary-dark ${
                location.pathname === to ? 'text-primary-dark' : 'text-text-light'
              }`}
            >
              {label}
            </Link>
          ))}
          <Link
            to="/rendez-vous"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-md"
          >
            Prendre rendez-vous
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="flex flex-col justify-center gap-1.5 md:hidden"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          <span
            className={`block h-0.5 w-6 bg-text transition-transform duration-300 ${
              isMenuOpen ? 'translate-y-2 rotate-45' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-text transition-opacity duration-300 ${
              isMenuOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-text transition-transform duration-300 ${
              isMenuOpen ? '-translate-y-2 -rotate-45' : ''
            }`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={`overflow-hidden transition-all duration-300 md:hidden ${
          isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav
          className="flex flex-col gap-4 border-t border-rose-soft bg-white px-6 py-6"
          aria-label="Navigation mobile"
        >
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`text-base font-medium transition-colors duration-200 hover:text-primary-dark ${
                location.pathname === to ? 'text-primary-dark' : 'text-text-light'
              }`}
            >
              {label}
            </Link>
          ))}
          <Link
            to="/rendez-vous"
            className="mt-2 rounded-full bg-primary px-5 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Prendre rendez-vous
          </Link>
        </nav>
      </div>
    </header>
  );
}
