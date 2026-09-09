import { lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import Analytics from '@/components/Analytics';
import Home from '@/pages/Home';

/**
 * Toutes les routes sauf l'accueil sont chargées à la demande.
 *
 * Avant ce découpage, une visiteuse arrivant sur la page d'accueil téléchargeait
 * aussi le tableau de bord praticienne, le questionnaire médical et le
 * consentement éclairé, soit un tiers du poids pour des pages qu'elle ne verra
 * jamais.
 *
 * L'accueil reste chargé d'emblée : c'est la page d'arrivée, lui imposer un
 * aller-retour supplémentaire retarderait le premier rendu de tout le monde
 * pour n'économiser que sur elle-même.
 */
const Pricing = lazy(() => import('@/pages/Pricing'));
const ServiceDetail = lazy(() => import('@/pages/ServiceDetail'));
const Booking = lazy(() => import('@/pages/Booking'));
const Faq = lazy(() => import('@/pages/Faq'));
const FaqDetail = lazy(() => import('@/pages/FaqDetail'));
const Login = lazy(() => import('@/pages/Login'));
const Contact = lazy(() => import('@/pages/Contact'));
const Legal = lazy(() => import('@/pages/Legal'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const Account = lazy(() => import('@/pages/Account'));
const MesRdv = lazy(() => import('@/pages/MesRdv'));

const PrestataireDashboard = lazy(() => import('@/pages/PrestataireDashboard'));
const PrestataireRdv = lazy(() => import('@/pages/PrestataireRdv'));
const MedicalIntake = lazy(() => import('@/pages/MedicalIntake'));
const ConsentFormPage = lazy(() => import('@/pages/ConsentFormPage'));

/**
 * Private areas share a single noindex directive: they must never surface in
 * search results, and their titles carry no ranking value.
 */
function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <>
      <Seo
        noindex
        path="/account"
        title="Espace patient | AA Laser Med"
        description="Espace patient AA Laser Med."
      />
      {children}
    </>
  );
}

function RequirePrestataire({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, role } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role !== 'prestataire') return <Navigate to="/" replace />;
  return (
    <>
      <Seo
        noindex
        path="/prestataire/dashboard"
        title="Espace praticienne | AA Laser Med"
        description="Interface de gestion AA Laser Med."
      />
      {children}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Analytics />
        <Routes>
          <Route element={<Layout />}>
            {/* Public */}
            <Route index element={<Home />} />
            <Route path="tarifs" element={<Pricing />} />
            {/* Gender is part of the path: names collide between catalogues. */}
            <Route path="tarifs/:gender/:slug" element={<ServiceDetail />} />
            <Route path="reservation" element={<Booking />} />
            <Route path="faq" element={<Faq />} />
            <Route path="faq/:slug" element={<FaqDetail />} />
            <Route path="login" element={<Login />} />
            <Route path="contact" element={<Contact />} />
            <Route path="mentions-legales" element={<Legal />} />

            {/* Client */}
            <Route path="account" element={<RequireAuth><Account /></RequireAuth>} />
            <Route path="mes-rdv" element={<RequireAuth><MesRdv /></RequireAuth>} />

            {/* Prestataire */}
            <Route path="prestataire/dashboard" element={<RequirePrestataire><PrestataireDashboard /></RequirePrestataire>} />
            <Route path="prestataire/rdv" element={<RequirePrestataire><PrestataireRdv /></RequirePrestataire>} />
            <Route path="prestataire/intake" element={<RequirePrestataire><MedicalIntake /></RequirePrestataire>} />
            <Route path="prestataire/consent" element={<RequirePrestataire><ConsentFormPage /></RequirePrestataire>} />

            {/* Fallback — a real page, not a redirect: redirecting every typo to
                the home page presented it to crawlers as duplicate content. */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
