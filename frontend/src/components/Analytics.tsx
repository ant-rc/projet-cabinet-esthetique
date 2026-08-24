import { useState, useEffect, useRef } from 'react';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import type { BeforeSendEvent } from '@vercel/analytics';
import { getCookieConsent } from '@/components/layout/CookieBanner';

/** Private areas: a page view there says who is logged in, not how the site performs. */
const PRIVATE_PREFIXES = ['/account', '/mes-rdv', '/prestataire'];

/** Declared at module level so the library does not re-register it on every render. */
function dropPrivateRoutes(event: BeforeSendEvent): BeforeSendEvent | null {
  const { pathname } = new URL(event.url);
  if (PRIVATE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;
  return event;
}

/**
 * Audience measurement, mounted only once the visitor has accepted it.
 *
 * Vercel Analytics is cookieless, but it is not on the CNIL exemption list, so
 * it is treated like any other measurement: nothing is loaded until the
 * analytics toggle is on.
 *
 * Withdrawal reloads the page. The library injects its script and patches
 * history from an effect that returns no teardown, so unmounting this
 * component leaves the script in place and collection running. A reload is the
 * only way to make withdrawal as effective as consent, which is what the CNIL
 * requires.
 */
export default function Analytics() {
  const [consent, setConsent] = useState(() => getCookieConsent().analytics);
  const wasInjected = useRef(consent);

  useEffect(() => {
    function handleConsentChange(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail.analytics === 'boolean') {
        setConsent(detail.analytics);
      }
    }
    window.addEventListener('cookie-consent-change', handleConsentChange);
    return () => window.removeEventListener('cookie-consent-change', handleConsentChange);
  }, []);

  useEffect(() => {
    if (wasInjected.current && !consent) {
      window.location.reload();
      return;
    }
    wasInjected.current = consent;
  }, [consent]);

  if (!consent) return null;

  return <VercelAnalytics beforeSend={dropPrivateRoutes} />;
}
