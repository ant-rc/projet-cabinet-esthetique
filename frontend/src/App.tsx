import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import Home from '@/pages/Home';
import Pricing from '@/pages/Pricing';
import Booking from '@/pages/Booking';
import Profile from '@/pages/Profile';
import Contact from '@/pages/Contact';
import Pro from '@/pages/Pro';
import Legal from '@/pages/Legal';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="tarifs" element={<Pricing />} />
            <Route path="rendez-vous" element={<Booking />} />
            <Route path="mon-compte" element={<Profile />} />
            <Route path="contact" element={<Contact />} />
            <Route path="pro" element={<Pro />} />
            <Route path="mentions-legales" element={<Legal />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
