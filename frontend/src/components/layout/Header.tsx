import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, role, logout } = useAuth();

  useEffect(() => {
    function handleScroll() {
      setHasScrolled(window.scrollY > 10);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close menu on navigation
    setIsMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: '/', label: 'Accueil' },
    { to: '/tarifs', label: 'Tarifs' },
    { to: '/reservation', label: 'Rendez-vous' },
    { to: '/contact', label: 'Contact' },
  ];

  const accountLink = isAuthenticated
    ? role === 'prestataire'
      ? { to: '/prestataire/dashboard', label: 'Dashboard' }
      : { to: '/account', label: 'Mon Compte' }
    : { to: '/login', label: 'Connexion' };

  return (
    <header
      className={`sticky top-0 z-50 bg-white/95 backdrop-blur-sm transition-shadow duration-300 ${
        hasScrolled ? 'shadow-md' : ''
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-8">
        <Link to="/" className="flex items-baseline gap-1.5" aria-label="AA Laser Med">
          <span className="font-serif text-2xl font-bold tracking-wide text-primary-dark">AA</span>
          <span className="text-sm font-semibold uppercase tracking-widest text-text">Laser Med</span>
        </Link>

        {/* Desktop */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Navigation principale">
          {navLinks.map(({ to, label }) => (
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
            to={accountLink.to}
            className={`text-sm font-medium transition-colors duration-200 hover:text-primary-dark ${
              location.pathname.startsWith(accountLink.to) ? 'text-primary-dark' : 'text-text-light'
            }`}
          >
            {accountLink.label}
          </Link>
          <Link
            to="/reservation"
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
          <span className={`block h-0.5 w-6 bg-text transition-transform duration-300 ${isMenuOpen ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`block h-0.5 w-6 bg-text transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-6 bg-text transition-transform duration-300 ${isMenuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={`overflow-hidden transition-all duration-300 md:hidden ${
          isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="flex flex-col gap-4 border-t border-rose-soft bg-white px-6 py-6" aria-label="Navigation mobile">
          {navLinks.map(({ to, label }) => (
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
            to={accountLink.to}
            className={`text-base font-medium transition-colors duration-200 hover:text-primary-dark ${
              location.pathname.startsWith(accountLink.to) ? 'text-primary-dark' : 'text-text-light'
            }`}
          >
            {accountLink.label}
          </Link>
          <Link
            to="/reservation"
            className="mt-2 rounded-full bg-primary px-5 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Prendre rendez-vous
          </Link>
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="mt-2 rounded-full border border-primary px-5 py-2.5 text-center text-sm font-medium text-primary transition-all duration-300 hover:bg-primary hover:text-white"
            >
              Se d&eacute;connecter
            </button>
          )}
        </nav>
      </div>

      {/* Logout confirmation modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowLogoutModal(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowLogoutModal(false); }}
          role="presentation"
        >
          <div
            className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
          >
            <h2 id="logout-modal-title" className="font-serif text-xl font-bold text-text">
              D&eacute;connexion
            </h2>
            <p className="mt-3 text-sm text-text-light">
              &Ecirc;tes-vous s&ucirc;r(e) de vouloir vous d&eacute;connecter&nbsp;?
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 rounded-full border border-rose-soft px-5 py-2.5 text-sm font-medium text-text-light transition-all duration-300 hover:bg-nude"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => { logout(); setShowLogoutModal(false); navigate('/'); }}
                className="flex-1 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-primary-dark"
              >
                Se d&eacute;connecter
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
