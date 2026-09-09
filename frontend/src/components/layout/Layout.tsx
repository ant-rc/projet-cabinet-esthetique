import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CookieBanner from '@/components/layout/CookieBanner';

/**
 * Écran d'attente pendant le chargement d'une route.
 *
 * Hauteur minimale volontaire : sans elle, le pied de page remonterait le temps
 * du chargement puis redescendrait, ce qui fait sauter la page sous le curseur.
 */
function ChargementPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4" role="status" aria-live="polite">
      <p className="text-sm text-text-light">Chargement...</p>
    </div>
  );
}

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {/*
        La frontière Suspense est ici, autour du seul Outlet, et non autour du
        routeur. Plus haut, l'en-tête et le pied de page disparaîtraient à chaque
        navigation vers une route pas encore téléchargée.
      */}
      <main className="flex-1">
        <Suspense fallback={<ChargementPage />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CookieBanner />
      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable={false}
        pauseOnHover
      />
    </div>
  );
}
