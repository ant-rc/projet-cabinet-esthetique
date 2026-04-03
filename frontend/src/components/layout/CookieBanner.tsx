import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  maps: boolean;
}

interface StoredConsent {
  prefs: CookiePreferences;
  timestamp: number; // ms since epoch
}

const STORAGE_KEY = 'aa_laser_cookie_consent';
const MAX_AGE_MS = 13 * 30 * 24 * 60 * 60 * 1000; // ~13 months

function readConsent(): CookiePreferences | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const stored = JSON.parse(raw) as StoredConsent;
    // Expire after 13 months
    if (Date.now() - stored.timestamp > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return stored.prefs;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function saveConsent(prefs: CookiePreferences) {
  const data: StoredConsent = { prefs, timestamp: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getCookieConsent(): CookiePreferences {
  return readConsent() ?? { necessary: true, analytics: false, maps: false };
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    maps: false,
  });

  useEffect(() => {
    const consent = readConsent();
    if (!consent) {
      setVisible(true);
    } else {
      setPrefs(consent);
    }
  }, []);

  const accept = useCallback((p: CookiePreferences) => {
    saveConsent(p);
    setPrefs(p);
    setVisible(false);
    setShowDetails(false);
    // Notify other components of consent change
    window.dispatchEvent(new CustomEvent('cookie-consent-change', { detail: p }));
  }, []);

  function handleAcceptAll() {
    accept({ necessary: true, analytics: true, maps: true });
  }

  function handleRefuseAll() {
    accept({ necessary: true, analytics: false, maps: false });
  }

  function handleSaveCustom() {
    accept(prefs);
  }

  // Reopen banner (called from footer link)
  useEffect(() => {
    function handleReopen() {
      setVisible(true);
      setShowDetails(false);
    }
    window.addEventListener('open-cookie-settings', handleReopen);
    return () => window.removeEventListener('open-cookie-settings', handleReopen);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-rose-soft bg-white shadow-2xl">
        {!showDetails ? (
          <div className="flex flex-col gap-4 p-5">
            <div>
              <h3 className="text-sm font-bold text-text">Gestion des cookies</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-text-light">
                Nous utilisons des cookies pour assurer le fonctionnement du site et am&eacute;liorer
                votre exp&eacute;rience. Vous pouvez accepter, refuser ou personnaliser vos choix.{' '}
                <Link to="/mentions-legales?tab=cookies" className="text-primary-dark underline" onClick={() => setVisible(false)}>
                  En savoir plus
                </Link>
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleAcceptAll}
                className="flex-1 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-white transition-all duration-300 hover:bg-primary-dark"
              >
                Tout accepter
              </button>
              <button
                type="button"
                onClick={handleRefuseAll}
                className="flex-1 rounded-full border border-rose-soft px-4 py-2.5 text-xs font-semibold text-text-light transition-all duration-300 hover:bg-nude"
              >
                Tout refuser
              </button>
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                className="flex-1 rounded-full border border-primary-light px-4 py-2.5 text-xs font-semibold text-primary-dark transition-all duration-300 hover:bg-rose-soft/50"
              >
                Personnaliser
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-5">
            <h3 className="text-sm font-bold text-text">Personnaliser les cookies</h3>

            <div className="flex items-center justify-between rounded-xl bg-nude px-4 py-3">
              <div>
                <p className="text-xs font-semibold text-text">Cookies n&eacute;cessaires</p>
                <p className="mt-0.5 text-[11px] text-text-light">
                  Authentification, session. Indispensables au fonctionnement.
                </p>
              </div>
              <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold text-green-700">
                Toujours actif
              </span>
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-rose-soft px-4 py-3 transition-colors hover:bg-nude/50">
              <div>
                <p className="text-xs font-semibold text-text">Analytiques</p>
                <p className="mt-0.5 text-[11px] text-text-light">
                  Vercel Analytics &mdash; mesure de performance et de fr&eacute;quentation.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.analytics}
                onChange={(e) => setPrefs((p) => ({ ...p, analytics: e.target.checked }))}
                className="h-5 w-5 rounded border-rose-soft text-primary accent-primary focus:ring-primary"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-rose-soft px-4 py-3 transition-colors hover:bg-nude/50">
              <div>
                <p className="text-xs font-semibold text-text">Google Maps</p>
                <p className="mt-0.5 text-[11px] text-text-light">
                  Carte interactive sur la page Contact. Peut d&eacute;poser des cookies Google.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.maps}
                onChange={(e) => setPrefs((p) => ({ ...p, maps: e.target.checked }))}
                className="h-5 w-5 rounded border-rose-soft text-primary accent-primary focus:ring-primary"
              />
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="flex-1 rounded-full border border-rose-soft px-4 py-2.5 text-xs font-semibold text-text-light transition-all duration-300 hover:bg-nude"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="flex-1 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-white transition-all duration-300 hover:bg-primary-dark"
              >
                Enregistrer mes choix
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
