import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { getServiceById } from '@/data/pricing';
import { formatDateDisplay } from '@/utils/date';
import type { DbAppointment, DbProfile, AppointmentStatus } from '@/types';

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; classes: string }> = {
  pending: { label: 'En attente', classes: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmé', classes: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Annulé', classes: 'bg-red-100 text-red-700' },
  rescheduled: { label: 'Déplacé', classes: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Terminé', classes: 'bg-blue-100 text-blue-700' },
  no_show: { label: 'Absent', classes: 'bg-gray-100 text-gray-700' },
};

interface AppointmentRow extends DbAppointment {
  profile_name: string;
  profile_phone: string;
}

export default function PrestataireRdv() {
  const { isAuthenticated, isLoading: authLoading, role, logout } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'all'>('all');
  const [filterDate, setFilterDate] = useState('');
  const [searchClient, setSearchClient] = useState('');

  const fetchAll = useCallback(async () => {
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
          profile_phone: prof?.phone ?? '',
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

  async function handleUpdateStatus(id: string, newStatus: AppointmentStatus) {
    const { error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast.error('Erreur lors de la mise à jour.');
    } else {
      setAppointments((prev) =>
        prev.map((a) => a.id === id ? { ...a, status: newStatus } : a),
      );
      toast.success('Statut mis à jour.');
    }
  }

  const filtered = useMemo(() => {
    let result = appointments;
    if (filterStatus !== 'all') {
      result = result.filter((a) => a.status === filterStatus);
    }
    if (filterDate) {
      result = result.filter((a) => a.date === filterDate);
    }
    if (searchClient) {
      const q = searchClient.toLowerCase();
      result = result.filter((a) => a.profile_name.toLowerCase().includes(q));
    }
    return result;
  }, [appointments, filterStatus, filterDate, searchClient]);

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
          <h1 className="font-serif text-3xl font-bold text-text md:text-4xl">Tous les rendez-vous</h1>
          <div className="flex gap-2">
            <Link
              to="/prestataire/dashboard"
              className="rounded-full border border-primary px-5 py-2.5 text-sm font-medium text-primary-dark transition-all duration-300 hover:bg-primary hover:text-white"
            >
              Dashboard
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

        {/* Filters */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={searchClient}
            onChange={(e) => setSearchClient(e.target.value)}
            className="rounded-lg border border-rose-soft bg-white px-3 py-2 text-sm text-text placeholder:text-text-light/50"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as AppointmentStatus | 'all')}
            className="rounded-lg border border-rose-soft bg-white px-3 py-2 text-sm text-text"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmés</option>
            <option value="cancelled">Annulés</option>
            <option value="rescheduled">Déplacés</option>
            <option value="completed">Terminés</option>
            <option value="no_show">Absents</option>
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="rounded-lg border border-rose-soft bg-white px-3 py-2 text-sm text-text"
          />
          {(filterDate || searchClient) && (
            <button
              type="button"
              onClick={() => { setFilterDate(''); setSearchClient(''); }}
              className="rounded-lg border border-rose-soft px-3 py-2 text-xs text-text-light hover:bg-nude"
            >
              Réinitialiser
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
                  <th className="px-3 py-3 font-semibold text-text">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((appt) => {
                  const service = appt.service_id ? getServiceById(appt.service_id) : null;
                  const status = STATUS_CONFIG[appt.status];
                  return (
                    <tr key={appt.id} className="border-b border-rose-soft/50 hover:bg-nude/50">
                      <td className="px-3 py-3">
                        <div className="font-medium">{appt.profile_name}</div>
                        {appt.profile_phone && (
                          <div className="text-xs text-text-light">{appt.profile_phone}</div>
                        )}
                      </td>
                      <td className="px-3 py-3">{appt.is_first_consultation ? 'Consultation' : 'Séance'}</td>
                      <td className="px-3 py-3 text-text-light">{service?.name ?? '—'}</td>
                      <td className="px-3 py-3">
                        {formatDateDisplay(appt.date, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-3 py-3">{appt.time}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.classes}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1">
                          {appt.status === 'confirmed' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(appt.id, 'completed')}
                                className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                              >
                                Terminé
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                                className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                              >
                                Annuler
                              </button>
                            </>
                          )}
                        </div>
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
