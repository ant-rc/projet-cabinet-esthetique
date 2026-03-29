import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { getServiceById } from '@/data/pricing';
import type { DbAppointment, DbProfile, AppointmentStatus } from '@/types';

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; classes: string }> = {
  confirmed: { label: 'Confirmé', classes: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Annulé', classes: 'bg-red-100 text-red-700' },
  completed: { label: 'Terminé', classes: 'bg-blue-100 text-blue-700' },
};

interface AppointmentRow extends DbAppointment {
  profile_name: string;
}

export default function PrestataireDashboard() {
  const { isAuthenticated, isLoading: authLoading, role, logout } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'all'>('all');
  const [filterDate, setFilterDate] = useState('');

  const fetchAll = useCallback(async () => {
    // Fetch appointments and profiles separately to avoid FK join issues
    const [apptResult, profilesResult] = await Promise.all([
      supabase.from('appointments').select('*').order('date', { ascending: false }),
      supabase.from('profiles').select('*'),
    ]);

    const profiles = (profilesResult.data ?? []) as DbProfile[];
    const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

    if (apptResult.data) {
      const rows: AppointmentRow[] = (apptResult.data as DbAppointment[]).map((appt) => {
        const prof = profileMap.get(appt.user_id);
        return {
          ...appt,
          profile_name: prof ? `${prof.first_name} ${prof.last_name}` : '—',
        };
      });
      setAppointments(rows);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || role !== 'prestataire')) {
      navigate('/login', { replace: true });
      return;
    }
    if (isAuthenticated && role === 'prestataire') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
      void fetchAll();
    }
  }, [authLoading, isAuthenticated, role, navigate, fetchAll]);

  const filtered = useMemo(() => {
    let result = appointments;
    if (filterStatus !== 'all') {
      result = result.filter((a) => a.status === filterStatus);
    }
    if (filterDate) {
      result = result.filter((a) => a.date === filterDate);
    }
    return result;
  }, [appointments, filterStatus, filterDate]);

  const todayCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter((a) => a.date === today && a.status === 'confirmed').length;
  }, [appointments]);

  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;

  if (authLoading || loading) {
    return (
      <section className="page-enter flex items-center justify-center px-4 py-24">
        <p className="text-text-light">Chargement...</p>
      </section>
    );
  }

  return (
    <section className="page-enter px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-text md:text-4xl">Dashboard</h1>
            <p className="mt-1 text-base text-text-light">Vue d&apos;ensemble des rendez-vous</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/prestataire/rdv"
              className="rounded-full border border-primary px-5 py-2.5 text-sm font-medium text-primary-dark transition-all duration-300 hover:bg-primary hover:text-white"
            >
              Voir tous les RDV
            </Link>
            <button
              type="button"
              onClick={() => { logout(); navigate('/'); }}
              className="rounded-full border border-rose-soft px-5 py-2.5 text-sm font-medium text-text-light transition-all duration-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-primary-light/50 bg-white p-6 text-center">
            <p className="text-3xl font-bold text-primary-dark">{todayCount}</p>
            <p className="mt-1 text-sm text-text-light">Aujourd&apos;hui</p>
          </div>
          <div className="rounded-2xl border border-primary-light/50 bg-white p-6 text-center">
            <p className="text-3xl font-bold text-primary-dark">{confirmedCount}</p>
            <p className="mt-1 text-sm text-text-light">Confirmés</p>
          </div>
          <div className="rounded-2xl border border-primary-light/50 bg-white p-6 text-center">
            <p className="text-3xl font-bold text-primary-dark">{appointments.length}</p>
            <p className="mt-1 text-sm text-text-light">Total</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as AppointmentStatus | 'all')}
            className="rounded-lg border border-rose-soft bg-white px-3 py-2 text-sm text-text"
          >
            <option value="all">Tous les statuts</option>
            <option value="confirmed">Confirmés</option>
            <option value="cancelled">Annulés</option>
            <option value="completed">Terminés</option>
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="rounded-lg border border-rose-soft bg-white px-3 py-2 text-sm text-text"
          />
          {filterDate && (
            <button
              type="button"
              onClick={() => setFilterDate('')}
              className="rounded-lg border border-rose-soft px-3 py-2 text-xs text-text-light hover:bg-nude"
            >
              Effacer date
            </button>
          )}
        </div>

        {/* Table */}
        <div className="mt-6 overflow-x-auto">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-light">Aucun rendez-vous trouvé.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-rose-soft">
                  <th className="px-3 py-3 font-semibold text-text">Patient</th>
                  <th className="px-3 py-3 font-semibold text-text">Type</th>
                  <th className="px-3 py-3 font-semibold text-text">Zone</th>
                  <th className="px-3 py-3 font-semibold text-text">Date</th>
                  <th className="px-3 py-3 font-semibold text-text">Heure</th>
                  <th className="px-3 py-3 font-semibold text-text">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((appt) => {
                  const service = appt.service_id ? getServiceById(appt.service_id) : null;
                  const status = STATUS_CONFIG[appt.status];
                  return (
                    <tr key={appt.id} className="border-b border-rose-soft/50 hover:bg-nude/50">
                      <td className="px-3 py-3 font-medium">{appt.profile_name}</td>
                      <td className="px-3 py-3">{appt.is_first_consultation ? 'Consultation' : 'Séance'}</td>
                      <td className="px-3 py-3 text-text-light">{service?.name ?? '—'}</td>
                      <td className="px-3 py-3">
                        {new Date(appt.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-3 py-3">{appt.time}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.classes}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
