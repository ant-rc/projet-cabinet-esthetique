import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
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

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequirePrestataire({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, role } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role !== 'prestataire') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            {/* Public */}
            <Route index element={<Home />} />
            <Route path="tarifs" element={<Pricing />} />
            <Route path="reservation" element={<Booking />} />
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

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
