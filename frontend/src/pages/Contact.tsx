import { useState, useEffect } from 'react';
import { centerInfo } from '@/data/pricing';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { getCookieConsent } from '@/components/layout/CookieBanner';

export default function Contact() {
  const { ref, isVisible } = useScrollReveal();
  const [mapsConsent, setMapsConsent] = useState(() => getCookieConsent().maps);

  useEffect(() => {
    function handleConsentChange(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail.maps === 'boolean') {
        setMapsConsent(detail.maps);
      }
    }
    window.addEventListener('cookie-consent-change', handleConsentChange);
    return () => window.removeEventListener('cookie-consent-change', handleConsentChange);
  }, []);

  return (
    <section className="page-enter px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-center font-serif text-3xl font-bold text-text md:text-4xl">
          Contact &amp; Accès
        </h1>
        <p className="mt-4 text-center text-base text-text-light">
          Retrouvez toutes les informations pour nous contacter et venir au centre.
        </p>

        <div ref={ref} className={`reveal ${isVisible ? 'visible' : ''} mt-12 grid gap-8 lg:grid-cols-2`}>
          <div className="flex flex-col gap-6">
            <div className="card-hover rounded-2xl border border-primary-light/50 bg-white p-6">
              <h2 className="font-serif text-lg font-semibold text-text">Adresse</h2>
              <p className="mt-2 text-sm text-text-light">
                {centerInfo.address}<br />
                {centerInfo.city}
              </p>
              <a
                href={centerInfo.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary-dark transition-all duration-300 hover:bg-primary hover:text-white"
              >
                Ouvrir dans Google Maps
              </a>
            </div>

            <div className="card-hover rounded-2xl border border-primary-light/50 bg-white p-6">
              <h2 className="font-serif text-lg font-semibold text-text">Nous contacter</h2>
              <div className="mt-3 flex flex-col gap-2 text-sm text-text-light">
                <p>
                  <span className="font-medium text-text">Téléphone :</span>{' '}
                  <a href={`tel:${centerInfo.phone.replace(/\s/g, '')}`} className="text-primary-dark underline underline-offset-2">
                    {centerInfo.phone}
                  </a>
                </p>
                <p>
                  <span className="font-medium text-text">E-mail :</span>{' '}
                  <a href={`mailto:${centerInfo.email}`} className="text-primary-dark underline underline-offset-2">
                    {centerInfo.email}
                  </a>
                </p>
              </div>
            </div>

            <div className="card-hover rounded-2xl border border-primary-light/50 bg-white p-6">
              <h2 className="font-serif text-lg font-semibold text-text">Accès</h2>
              <div className="mt-3 flex flex-col gap-2 text-sm text-text-light">
                <p><span className="font-medium text-text">Gare :</span> {centerInfo.access.gare}</p>
                <p><span className="font-medium text-text">Bus :</span> {centerInfo.access.bus}</p>
                <p><span className="font-medium text-text">Parking :</span> {centerInfo.access.parking}</p>
              </div>
            </div>

            <div className="card-hover rounded-2xl border border-primary-light/50 bg-white p-6">
              <h2 className="font-serif text-lg font-semibold text-text">Horaires</h2>
              <div className="mt-3 flex flex-col gap-1.5 text-sm text-text-light">
                <p><span className="font-medium text-text">Mardi — Samedi :</span> {centerInfo.hours.tuesday_saturday}</p>
                <p><span className="font-medium text-text">Dimanche :</span> {centerInfo.hours.sunday}</p>
                <p><span className="font-medium text-text">Lundi :</span> {centerInfo.hours.monday}</p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-primary-light/50 bg-nude">
            {mapsConsent ? (
              <iframe
                title="Localisation AA Laser Med"
                src={centerInfo.googleMapsEmbed}
                className="h-full min-h-[400px] w-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center">
                <p className="text-sm font-medium text-text">Carte Google Maps</p>
                <p className="text-xs text-text-light">
                  L&apos;affichage de la carte n&eacute;cessite votre consentement pour les cookies Google Maps.
                </p>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}
                  className="rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-white transition-all duration-300 hover:bg-primary-dark"
                >
                  G&eacute;rer mes cookies
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
