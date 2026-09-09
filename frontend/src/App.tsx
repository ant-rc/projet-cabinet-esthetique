import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import Analytics from '@/components/Analytics';
import Home from '@/pages/Home';
import Pricing from '@/pages/Pricing';
import Booking from '@/pages/Booking';
import Login from '@/pages/Login';
import Account from '@/pages/Account';
import MesRdv from '@/pages/MesRdv';
import PrestataireDashboard from '@/pages/PrestataireDashboard';
import PrestataireRdv from '@/pages/PrestataireRdv';
import MedicalIntake from '@/pages/MedicalIntake';
import ConsentFormPage from '@/pages/ConsentFormPage';
import Contact from '@/pages/Contact';
import Legal from '@/pages/Legal';
import ServiceDetail from '@/pages/ServiceDetail';
import Faq from '@/pages/Faq';
import FaqDetail from '@/pages/FaqDetail';
import NotFound from '@/pages/NotFound';

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
