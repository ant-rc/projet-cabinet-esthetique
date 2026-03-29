import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { getServiceById } from '@/data/pricing';
import { formatDuration } from '@/utils/booking';
import type { DbAppointment, AppointmentStatus } from '@/types';

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  confirmed: 'Confirmé',
  cancelled: 'Annulé',
  completed: 'Terminé',
};

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
};

export default function MesRdv() {
  const { isAuthenticated, isLoading: authLoading, session } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<DbAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    if (!session?.user) return;
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false });

    if (data) setAppointments(data as DbAppointment[]);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    if (session?.user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
      void fetchAppointments();
    }
  }, [authLoading, isAuthenticated, session, navigate, fetchAppointments]);

  async function handleCancel() {
    if (!cancelConfirmId) return;
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', cancelConfirmId);

    if (error) {
      toast.error('Erreur lors de l\'annulation.');
    } else {
      toast.info('Rendez-vous annulé.');
      setAppointments((prev) =>
        prev.map((a) => a.id === cancelConfirmId ? { ...a, status: 'cancelled' } : a),
      );
    }
    setCancelConfirmId(null);
  }

  if (authLoading || loading) {
    return (
      <section className="page-enter flex items-center justify-center px-4 py-24">
        <p className="text-text-light">Chargement...</p>
      </section>
    );
  }

  const cancelTarget = cancelConfirmId ? appointments.find((a) => a.id === cancelConfirmId) : null;

  return (
    <section className="page-enter px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-3xl font-bold text-text md:text-4xl">Mes rendez-vous</h1>
          <Link
            to="/reservation"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-primary-dark"
          >
            Nouveau rendez-vous
          </Link>
        </div>

        {appointments.length === 0 ? (
          <p className="mt-8 text-base text-text-light">
            Vous n&apos;avez pas encore de rendez-vous.
          </p>
        ) : (
          <div className="mt-8 flex flex-col gap-4">
            {appointments.map((apt) => {
              const service = apt.service_id ? getServiceById(apt.service_id) : null;
              const canCancel = apt.status === 'confirmed';

              return (
                <article key={apt.id} className="card-hover flex flex-col gap-4 rounded-2xl border border-rose-soft bg-white p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-light">
                          {apt.is_first_consultation ? 'Consultation' : 'Séance laser'}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[apt.status]}`}>
                          {STATUS_LABELS[apt.status]}
                        </span>
                      </div>
                      <p className="font-semibold text-text">
                        {apt.is_first_consultation ? 'Consultation initiale' : (service?.name ?? '—')}
                      </p>
                      <p className="text-sm text-text-light">
                        {new Date(apt.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}{' '}
                        à {apt.time}
                      </p>
                      {service && (
                        <div className="flex gap-4 text-xs text-text-light">
                          <span>Durée : {formatDuration(service.duration)}</span>
                          <span>{apt.is_first_consultation ? 'Gratuit' : `${service.price}€`}</span>
                        </div>
                      )}
                    </div>
                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => setCancelConfirmId(apt.id)}
                        className="self-start rounded-full border border-red-200 px-4 py-1.5 text-xs font-medium text-red-600 transition-all duration-200 hover:bg-red-50"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {cancelConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
          onClick={() => setCancelConfirmId(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Confirmer l'annulation"
        >
          <div className="step-enter w-full max-w-md rounded-2xl border border-rose-soft bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-semibold text-text">Confirmer l&apos;annulation</h3>
            {cancelTarget && (
              <div className="mt-4 rounded-xl bg-nude p-4 text-sm">
                <p className="font-medium text-text">
                  {cancelTarget.is_first_consultation ? 'Consultation initiale' : (getServiceById(cancelTarget.service_id ?? '')?.name ?? '—')}
                </p>
                <p className="mt-1 text-text-light">
                  {new Date(cancelTarget.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {cancelTarget.time}
                </p>
              </div>
            )}
            <p className="mt-4 text-sm text-text-light">
              Êtes-vous sûr(e) de vouloir annuler ce rendez-vous ?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setCancelConfirmId(null)} className="rounded-full border border-rose-soft px-5 py-2.5 text-sm font-medium text-text-light transition-all duration-300 hover:bg-nude">
                Non, garder
              </button>
              <button type="button" onClick={handleCancel} className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-red-700">
                Oui, annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
