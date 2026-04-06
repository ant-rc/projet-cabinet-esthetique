import { useState, useEffect, useCallback, useMemo } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { getServiceById, servicesData } from '@/data/pricing';
import { formatDateKey, formatDateDisplay } from '@/utils/date';
import type { DbAppointment, DbProfile, AppointmentStatus } from '@/types';
import type { FitzpatrickType, TreatmentSession } from '@/types/medical';
import { sanitize } from '@/utils/sanitize';

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; classes: string }> = {
  pending: { label: 'En attente', classes: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmé', classes: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Annulé', classes: 'bg-red-100 text-red-700' },
  rescheduled: { label: 'Déplacé', classes: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Terminé', classes: 'bg-blue-100 text-blue-700' },
  no_show: { label: 'Absent', classes: 'bg-gray-100 text-gray-700' },
};

const SKIN_TYPES: FitzpatrickType[] = ['I', 'II', 'III', 'IV', 'V', 'VI'];

interface AppointmentRow extends DbAppointment {
  profile_name: string;
}

type Tab = 'planning' | 'appointments' | 'patients' | 'notifications';

// ─── Migration helper: old TreatmentNote -> TreatmentSession ───

function migrateLegacyNote(note: Record<string, unknown>): TreatmentSession {
  return {
    id: (note.id as string) ?? crypto.randomUUID(),
    patientId: '',
    appointmentId: null,
    date: (note.date as string) ?? '',
    zone: (note.zone as string) ?? '',
    spotSize: '',
    fluence: (note.intensity as string) ?? '',
    pulseDuration: '',
    coolingLevel: '',
    endpointObservation: '',
    adverseEffects: '',
    comments: (note.notes as string) ?? '',
    skinType: ((note.skinType as string) ?? 'II') as FitzpatrickType,
    createdBy: '',
    createdAt: (note.date as string) ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ─── localStorage helpers for treatment sessions ───

function getPatientSessions(userId: string): TreatmentSession[] {
  const newData = localStorage.getItem(`aa_laser_sessions_${userId}`);
  if (newData) {
    try {
      return JSON.parse(newData) as TreatmentSession[];
    } catch {
      return [];
    }
  }

  // Fallback: migrate old notes
  const oldData = localStorage.getItem(`aa_laser_notes_${userId}`);
  if (oldData) {
    try {
      const oldNotes = JSON.parse(oldData) as Record<string, unknown>[];
      const migrated = oldNotes.map(migrateLegacyNote);
      localStorage.setItem(`aa_laser_sessions_${userId}`, JSON.stringify(migrated));
      return migrated;
    } catch {
      return [];
    }
  }

  return [];
}

function savePatientSessions(userId: string, sessions: TreatmentSession[]): void {
  localStorage.setItem(`aa_laser_sessions_${userId}`, JSON.stringify(sessions));
}

// ─── Session form state ───

interface SessionFormState {
  zone: string;
  date: string;
  spotSize: string;
  fluence: string;
  pulseDuration: string;
  coolingLevel: string;
  skinType: FitzpatrickType;
  endpointObservation: string;
  adverseEffects: string;
  comments: string;
}

function emptyFormState(): SessionFormState {
  return {
    zone: '',
    date: formatDateKey(new Date()),
    spotSize: '',
    fluence: '',
    pulseDuration: '',
    coolingLevel: '',
    skinType: 'II',
    endpointObservation: '',
    adverseEffects: '',
    comments: '',
  };
}

// ─── Accordion card for a single session ───

function SessionCard({
  session,
  isOpen,
  onToggle,
  onEdit,
  onDelete,
}: {
  session: TreatmentSession;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl border border-rose-soft bg-white overflow-hidden transition-shadow hover:shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5"
      >
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
          <span className="font-medium text-text">{session.zone}</span>
          <span className="text-xs text-text-light">
            {formatDateDisplay(session.date, { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <svg
          className={`h-4 w-4 shrink-0 text-text-light transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="border-t border-rose-soft/60 px-4 py-4 sm:px-5">
            {/* Laser parameters grid */}
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary-dark">
              Paramètres laser
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
              <div>
                <span className="text-text-light">Spot size</span>
                <p className="font-medium text-text">{session.spotSize || '—'}</p>
              </div>
              <div>
                <span className="text-text-light">Fluence</span>
                <p className="font-medium text-text">{session.fluence || '—'}</p>
              </div>
              <div>
                <span className="text-text-light">Impulsion</span>
                <p className="font-medium text-text">{session.pulseDuration || '—'}</p>
              </div>
              <div>
                <span className="text-text-light">Refroidissement</span>
                <p className="font-medium text-text">{session.coolingLevel || '—'}</p>
              </div>
            </div>

            {/* Skin type */}
            <div className="mt-3 text-sm">
              <span className="text-text-light">Phototype : </span>
              <span className="font-medium text-text">{session.skinType}</span>
            </div>

            {/* Observations */}
            {(session.endpointObservation || session.adverseEffects || session.comments) && (
              <div className="mt-3 flex flex-col gap-1.5 text-sm">
                {session.endpointObservation && (
                  <div>
                    <span className="text-text-light">Endpoint : </span>
                    <span className="text-text">{session.endpointObservation}</span>
                  </div>
                )}
                {session.adverseEffects && (
                  <div>
                    <span className="text-text-light">Effets secondaires : </span>
                    <span className="text-text">{session.adverseEffects}</span>
                  </div>
                )}
                {session.comments && (
                  <div>
                    <span className="text-text-light">Commentaires : </span>
                    <span className="text-text">{session.comments}</span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={onEdit}
                className="rounded-full border border-primary-light px-4 py-1.5 text-xs font-semibold text-primary-dark transition-colors hover:bg-primary-light/30"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Session form (shared between add & edit) ───

function SessionForm({
  state,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  zoneNames,
  inputClasses,
}: {
  state: SessionFormState;
  onChange: (patch: Partial<SessionFormState>) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel?: () => void;
  submitLabel: string;
  zoneNames: string[];
  inputClasses: string;
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {/* Section 1 — General */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary-dark">
          Général
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            required
            className={inputClasses}
            value={state.zone}
            onChange={(e) => onChange({ zone: e.target.value })}
          >
            <option value="">Zone traitée</option>
            {zoneNames.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
          <input
            type="date"
            className={inputClasses}
            value={state.date}
            onChange={(e) => onChange({ date: e.target.value })}
          />
        </div>
      </div>

      {/* Section 2 — Laser parameters */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary-dark">
          Paramètres laser
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="text"
            placeholder="18mm"
            className={inputClasses}
            value={state.spotSize}
            onChange={(e) => onChange({ spotSize: e.target.value })}
          />
          <input
            type="text"
            placeholder="20 J/cm²"
            className={inputClasses}
            value={state.fluence}
            onChange={(e) => onChange({ fluence: e.target.value })}
          />
          <input
            type="text"
            placeholder="3ms"
            className={inputClasses}
            value={state.pulseDuration}
            onChange={(e) => onChange({ pulseDuration: e.target.value })}
          />
          <input
            type="text"
            placeholder="CryoAir max"
            className={inputClasses}
            value={state.coolingLevel}
            onChange={(e) => onChange({ coolingLevel: e.target.value })}
          />
        </div>
      </div>

      {/* Section 3 — Observations */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary-dark">
          Observations
        </p>
        <div className="flex flex-col gap-3">
          <select
            className={inputClasses}
            value={state.skinType}
            onChange={(e) => onChange({ skinType: e.target.value as FitzpatrickType })}
          >
            {SKIN_TYPES.map((st) => <option key={st} value={st}>Phototype {st}</option>)}
          </select>
          <textarea
            rows={2}
            placeholder="Érythème périfolliculaire, œdème..."
            className={inputClasses}
            value={state.endpointObservation}
            onChange={(e) => onChange({ endpointObservation: e.target.value })}
          />
          <textarea
            rows={2}
            placeholder="Aucun / Rougeur légère..."
            className={inputClasses}
            value={state.adverseEffects}
            onChange={(e) => onChange({ adverseEffects: e.target.value })}
          />
          <textarea
            rows={2}
            placeholder="Commentaires..."
            className={inputClasses}
            value={state.comments}
            onChange={(e) => onChange({ comments: e.target.value })}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-rose-soft px-5 py-2 text-sm text-text-light transition-colors hover:bg-white"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}

// ─── Main dashboard ───

export default function PrestataireDashboard() {
  const { isAuthenticated, isLoading: authLoading, role, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('planning');
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [profiles, setProfiles] = useState<DbProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendly events
  interface CalendlyEventItem {
    id: string;
    name: string;
    status: string;
    startTime: string;
    endTime: string;
    invitees: { name: string; email: string; status: string; zones: string | null; priceInfo: string | null }[];
  }
  const [calendlyEvents, setCalendlyEvents] = useState<CalendlyEventItem[]>([]);
  const [calendlyLoading, setCalendlyLoading] = useState(false);
  const [calendlyError, setCalendlyError] = useState<string | null>(null);

  const fetchCalendlyEvents = useCallback(async () => {
    setCalendlyLoading(true);
    setCalendlyError(null);
    try {
      const res = await fetch('/api/calendly/events?count=20');
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json() as { events: CalendlyEventItem[] };
      setCalendlyEvents(data.events);
    } catch (err) {
      setCalendlyError('Impossible de charger les rendez-vous Calendly. Vérifiez la configuration.');
      setCalendlyEvents([]);
    } finally {
      setCalendlyLoading(false);
    }
  }, []);

  // Appointments filters
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'all'>('all');
  const [filterDate, setFilterDate] = useState('');
  const [searchClient, setSearchClient] = useState('');

  // Patients
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [sessionsVersion, setSessionsVersion] = useState(0);

  // Session form (add new)
  const [sessionForm, setSessionForm] = useState<SessionFormState>(emptyFormState);

  // Edit session
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SessionFormState>(emptyFormState);

  // Accordion state
  const [openSessionIds, setOpenSessionIds] = useState<Set<string>>(new Set());

  const fetchAll = useCallback(async () => {
    const [apptResult, profilesResult] = await Promise.all([
      supabase.from('appointments').select('*').order('date', { ascending: false }),
      supabase.from('profiles').select('*'),
    ]);

    const profs = (profilesResult.data ?? []) as DbProfile[];
    setProfiles(profs);
    const profileMap = new Map(profs.map((p) => [p.user_id, p]));

    if (apptResult.data) {
      const rows: AppointmentRow[] = (apptResult.data as DbAppointment[]).map((appt) => {
        const prof = profileMap.get(appt.user_id);
        return { ...appt, profile_name: prof ? `${prof.first_name} ${prof.last_name}` : '—' };
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
      void fetchAll();
      void fetchCalendlyEvents();
    }
  }, [authLoading, isAuthenticated, role, navigate, fetchAll, fetchCalendlyEvents]);

  // ─── Appointments ───
  const filtered = useMemo(() => {
    let result = appointments;
    if (filterStatus !== 'all') result = result.filter((a) => a.status === filterStatus);
    if (filterDate) result = result.filter((a) => a.date === filterDate);
    if (searchClient) {
      const q = searchClient.toLowerCase();
      result = result.filter((a) => a.profile_name.toLowerCase().includes(q));
    }
    return result;
  }, [appointments, filterStatus, filterDate, searchClient]);

  async function handleUpdateStatus(id: string, newStatus: AppointmentStatus) {
    const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
    if (error) { toast.error('Erreur lors de la mise à jour.'); return; }
    setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status: newStatus } : a));
    toast.success('Statut mis à jour.');
  }

  // ─── Notifications (derived from appointments) ───
  const notifications = useMemo(() => {
    return [...appointments]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50)
      .map((a) => ({
        id: a.id,
        type: a.status === 'cancelled' ? 'cancellation' as const : 'new_appointment' as const,
        message: `${a.is_first_consultation ? 'Consultation' : (getServiceById(a.service_id ?? '')?.name ?? 'Séance')} — ${a.profile_name}`,
        date: a.date,
        time: a.time,
        status: a.status,
        createdAt: a.created_at,
      }));
  }, [appointments]);

  // ─── Patients ───
  const selectedPatient = profiles.find((p) => p.user_id === selectedPatientId);
  const patientAppointments = useMemo(
    () => selectedPatientId ? appointments.filter((a) => a.user_id === selectedPatientId) : [],
    [selectedPatientId, appointments],
  );
  const patientSessions = useMemo(
    () => selectedPatientId ? getPatientSessions(selectedPatientId) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedPatientId, sessionsVersion],
  );

  const zoneNames = servicesData.map((s) => s.name);

  // ─── Session CRUD ───

  function toggleSessionOpen(id: string) {
    setOpenSessionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAddSession(e: FormEvent) {
    e.preventDefault();
    if (!selectedPatientId || !sessionForm.zone) return;
    const now = new Date().toISOString();
    const session: TreatmentSession = {
      id: crypto.randomUUID(),
      patientId: selectedPatientId,
      appointmentId: null,
      date: sessionForm.date || formatDateKey(new Date()),
      zone: sanitize(sessionForm.zone),
      spotSize: sanitize(sessionForm.spotSize),
      fluence: sanitize(sessionForm.fluence),
      pulseDuration: sanitize(sessionForm.pulseDuration),
      coolingLevel: sanitize(sessionForm.coolingLevel),
      endpointObservation: sanitize(sessionForm.endpointObservation),
      adverseEffects: sanitize(sessionForm.adverseEffects),
      comments: sanitize(sessionForm.comments),
      skinType: sessionForm.skinType,
      createdBy: '',
      createdAt: now,
      updatedAt: now,
    };
    const sessions = getPatientSessions(selectedPatientId);
    sessions.push(session);
    savePatientSessions(selectedPatientId, sessions);
    setSessionForm(emptyFormState());
    setSessionsVersion((v) => v + 1);
    toast.success('Séance ajoutée.');
  }

  function startEditSession(session: TreatmentSession) {
    setEditingSessionId(session.id);
    setEditForm({
      zone: session.zone,
      date: session.date,
      spotSize: session.spotSize,
      fluence: session.fluence,
      pulseDuration: session.pulseDuration,
      coolingLevel: session.coolingLevel,
      skinType: session.skinType,
      endpointObservation: session.endpointObservation,
      adverseEffects: session.adverseEffects,
      comments: session.comments,
    });
  }

  function handleSaveEditSession(e: FormEvent) {
    e.preventDefault();
    if (!selectedPatientId || !editingSessionId || !editForm.zone) return;
    const sessions = getPatientSessions(selectedPatientId);
    const updated = sessions.map((s) =>
      s.id === editingSessionId
        ? {
            ...s,
            zone: sanitize(editForm.zone),
            date: editForm.date,
            spotSize: sanitize(editForm.spotSize),
            fluence: sanitize(editForm.fluence),
            pulseDuration: sanitize(editForm.pulseDuration),
            coolingLevel: sanitize(editForm.coolingLevel),
            endpointObservation: sanitize(editForm.endpointObservation),
            adverseEffects: sanitize(editForm.adverseEffects),
            comments: sanitize(editForm.comments),
            skinType: editForm.skinType,
            updatedAt: new Date().toISOString(),
          }
        : s,
    );
    savePatientSessions(selectedPatientId, updated);
    setEditingSessionId(null);
    setSessionsVersion((v) => v + 1);
    toast.success('Séance modifiée.');
  }

  function handleDeleteSession(sessionId: string) {
    if (!selectedPatientId) return;
    const sessions = getPatientSessions(selectedPatientId).filter((s) => s.id !== sessionId);
    savePatientSessions(selectedPatientId, sessions);
    setSessionsVersion((v) => v + 1);
  }

  const inputClasses = 'w-full rounded-lg border border-rose-soft bg-white px-3 py-2 text-sm text-text placeholder:text-text-light/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors';

  if (authLoading || loading) {
    return <section className="page-enter flex items-center justify-center px-4 py-24"><p className="text-text-light">Chargement...</p></section>;
  }

  const todayStr = formatDateKey(new Date());
  const todayCount = appointments.filter((a) => a.date === todayStr && a.status === 'confirmed').length;
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;
  const cancelledRecent = appointments.filter((a) => a.status === 'cancelled').length;

  return (
    <section className="page-enter px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-text md:text-4xl">Espace Prestataire</h1>
            <p className="mt-1 text-base text-text-light">Gérez vos rendez-vous et dossiers patients.</p>
          </div>
          <button
            type="button"
            onClick={() => { logout(); navigate('/'); }}
            className="rounded-full border border-rose-soft px-5 py-2.5 text-sm font-medium text-text-light transition-all duration-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          >
            Déconnexion
          </button>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-primary-light/50 bg-white p-5 text-center">
            <p className="text-2xl font-bold text-primary-dark">{todayCount}</p>
            <p className="mt-1 text-xs text-text-light">Aujourd&apos;hui</p>
          </div>
          <div className="rounded-2xl border border-primary-light/50 bg-white p-5 text-center">
            <p className="text-2xl font-bold text-primary-dark">{confirmedCount}</p>
            <p className="mt-1 text-xs text-text-light">Confirmés</p>
          </div>
          <div className="rounded-2xl border border-primary-light/50 bg-white p-5 text-center">
            <p className="text-2xl font-bold text-red-500">{cancelledRecent}</p>
            <p className="mt-1 text-xs text-text-light">Annulés</p>
          </div>
          <div className="rounded-2xl border border-primary-light/50 bg-white p-5 text-center">
            <p className="text-2xl font-bold text-primary-dark">{profiles.length}</p>
            <p className="mt-1 text-xs text-text-light">Patients</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-2 border-b border-rose-soft">
          {([
            { key: 'planning' as Tab, label: 'Planning' },
            { key: 'appointments' as Tab, label: 'Rendez-vous' },
            { key: 'patients' as Tab, label: 'Patients' },
            { key: 'notifications' as Tab, label: 'Notifications' },
          ]).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === key ? 'border-primary text-primary-dark' : 'border-transparent text-text-light hover:text-text'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* TAB: Planning */}
        {tab === 'planning' && (
          <div className="mt-6 flex flex-col gap-6">
            {/* Header + Calendly links */}
            <div className="flex flex-col gap-4 rounded-2xl border border-primary-light/50 bg-gradient-to-r from-nude to-rose-soft/30 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-serif text-lg font-semibold text-text">Planning</h2>
                <p className="mt-1 text-sm text-text-light">
                  Vos prochains rendez-vous Calendly en temps réel.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => { setCalendlyLoading(true); void fetchCalendlyEvents(); }}
                  className="rounded-full border border-primary-light px-5 py-2.5 text-center text-sm font-medium text-primary-dark transition-all duration-300 hover:bg-nude"
                >
                  Actualiser
                </button>
                <a
                  href="https://calendly.com/app/scheduled_events/user/me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-primary px-5 py-2.5 text-center text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-primary-dark"
                >
                  Ouvrir Calendly
                </a>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-primary-light/50 bg-white p-5 text-center">
                <p className="text-2xl font-bold text-primary-dark">{calendlyEvents.length}</p>
                <p className="mt-1 text-xs text-text-light">RDV Calendly à venir</p>
              </div>
              <div className="rounded-2xl border border-primary-light/50 bg-white p-5 text-center">
                <p className="text-2xl font-bold text-primary-dark">
                  {calendlyEvents.filter((e) => {
                    const d = new Date(e.startTime);
                    const today = new Date();
                    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
                  }).length}
                </p>
                <p className="mt-1 text-xs text-text-light">Aujourd&apos;hui</p>
              </div>
              <div className="rounded-2xl border border-primary-light/50 bg-white p-5 text-center">
                <p className="text-2xl font-bold text-primary-dark">{profiles.length}</p>
                <p className="mt-1 text-xs text-text-light">Patients</p>
              </div>
            </div>

            {/* Calendly events list */}
            <div>
              <h3 className="text-sm font-semibold text-text">Prochains rendez-vous</h3>

              {calendlyLoading ? (
                <p className="mt-3 text-sm text-text-light">Chargement...</p>
              ) : calendlyError ? (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {calendlyError}
                </div>
              ) : calendlyEvents.length === 0 ? (
                <p className="mt-3 text-sm text-text-light">Aucun rendez-vous à venir.</p>
              ) : (
                <div className="mt-3 flex flex-col gap-3">
                  {calendlyEvents.map((evt) => {
                    const start = new Date(evt.startTime);
                    const end = new Date(evt.endTime);
                    const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);
                    const invitee = evt.invitees[0];
                    const dateStr = start.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
                    const timeStr = start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div key={evt.id} className="card-hover flex flex-col gap-3 rounded-2xl border border-rose-soft bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-text">{evt.name}</span>
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                              {durationMin} min
                            </span>
                          </div>
                          {invitee && (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm text-text-light">
                                {invitee.name} — {invitee.email}
                              </span>
                              {invitee.zones && (
                                <span className="text-xs text-primary-dark">
                                  Zones : {invitee.zones}
                                </span>
                              )}
                              {invitee.priceInfo && (
                                <span className="text-xs text-text-light">
                                  {invitee.priceInfo}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <p className="text-sm font-semibold capitalize text-text">{dateStr}</p>
                            <p className="text-xs text-text-light">{timeStr}</p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            evt.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {evt.status === 'active' ? 'Confirmé' : 'Annulé'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: Rendez-vous */}
        {tab === 'appointments' && (
          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-3">
              <input type="text" placeholder="Rechercher un client..." value={searchClient} onChange={(e) => setSearchClient(e.target.value)}
                className="rounded-lg border border-rose-soft bg-white px-3 py-2 text-sm text-text placeholder:text-text-light/50" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as AppointmentStatus | 'all')}
                className="rounded-lg border border-rose-soft bg-white px-3 py-2 text-sm text-text">
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmés</option>
                <option value="cancelled">Annulés</option>
                <option value="rescheduled">Déplacés</option>
                <option value="completed">Terminés</option>
                <option value="no_show">Absents</option>
              </select>
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
                className="rounded-lg border border-rose-soft bg-white px-3 py-2 text-sm text-text" />
              {(filterDate || searchClient) && (
                <button type="button" onClick={() => { setFilterDate(''); setSearchClient(''); }}
                  className="rounded-lg border border-rose-soft px-3 py-2 text-xs text-text-light hover:bg-nude">Réinitialiser</button>
              )}
            </div>

            <div className="mt-4 overflow-x-auto">
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
                          <td className="px-3 py-3 font-medium">{appt.profile_name}</td>
                          <td className="px-3 py-3">{appt.is_first_consultation ? 'Consultation' : 'Séance'}</td>
                          <td className="px-3 py-3 text-text-light">{service?.name ?? '—'}</td>
                          <td className="px-3 py-3">{formatDateDisplay(appt.date, { day: 'numeric', month: 'short' })}</td>
                          <td className="px-3 py-3">{appt.time}</td>
                          <td className="px-3 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.classes}`}>{status.label}</span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex gap-1">
                              {appt.status === 'confirmed' && (
                                <>
                                  <button type="button" onClick={() => handleUpdateStatus(appt.id, 'completed')} className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50">Terminé</button>
                                  <button type="button" onClick={() => handleUpdateStatus(appt.id, 'cancelled')} className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Annuler</button>
                                </>
                              )}
                              <button type="button" onClick={() => { setSelectedPatientId(appt.user_id); setTab('patients'); }}
                                className="rounded px-2 py-1 text-xs font-medium text-primary-dark underline underline-offset-2 hover:text-primary">Fiche</button>
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
        )}

        {/* TAB: Patients */}
        {tab === 'patients' && (
          <div className="mt-6">
            {!selectedPatient ? (
              <div>
                <h2 className="font-serif text-lg font-semibold text-text">Liste des patients</h2>
                {profiles.length === 0 ? (
                  <p className="mt-4 text-sm text-text-light">Aucun patient enregistré.</p>
                ) : (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {profiles.map((p) => {
                      const apptCount = appointments.filter((a) => a.user_id === p.user_id).length;
                      return (
                        <button key={p.id} type="button" onClick={() => setSelectedPatientId(p.user_id)}
                          className="card-hover rounded-xl border border-rose-soft bg-white p-4 text-left">
                          <p className="font-semibold text-text">{p.first_name} {p.last_name}</p>
                          <p className="text-xs text-text-light">{p.phone || '—'}</p>
                          <p className="mt-2 text-xs text-text-light">{apptCount} rendez-vous</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => { setSelectedPatientId(null); setEditingSessionId(null); }}
                    className="rounded-lg border border-rose-soft px-3 py-1.5 text-sm text-text-light hover:bg-nude">&larr; Retour</button>
                  <h2 className="font-serif text-lg font-semibold text-text">{selectedPatient.first_name} {selectedPatient.last_name}</h2>
                </div>

                {/* Patient info */}
                <div className="rounded-xl border border-rose-soft bg-white p-5">
                  <h3 className="text-sm font-semibold text-text">Informations</h3>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <p><span className="text-text-light">Tél :</span> {selectedPatient.phone || '—'}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      to={`/prestataire/intake?patient=${selectedPatientId}`}
                      className="rounded-full bg-primary/10 px-5 py-2 text-xs font-semibold text-primary-dark transition-all duration-300 hover:bg-primary hover:text-white"
                    >
                      Formulaire d&apos;admission
                    </Link>
                    <Link
                      to={`/prestataire/consent?patient=${selectedPatientId}`}
                      className="rounded-full bg-primary/10 px-5 py-2 text-xs font-semibold text-primary-dark transition-all duration-300 hover:bg-primary hover:text-white"
                    >
                      Consentement éclairé
                    </Link>
                  </div>
                </div>

                {/* Appointment history */}
                <div className="rounded-xl border border-rose-soft bg-white p-5">
                  <h3 className="text-sm font-semibold text-text">Historique des rendez-vous</h3>
                  {patientAppointments.length === 0 ? (
                    <p className="mt-3 text-sm text-text-light">Aucun rendez-vous.</p>
                  ) : (
                    <div className="mt-3 flex flex-col gap-2">
                      {patientAppointments.map((a) => {
                        const service = a.service_id ? getServiceById(a.service_id) : null;
                        const status = STATUS_CONFIG[a.status];
                        return (
                          <div key={a.id} className="flex items-center justify-between rounded-lg bg-nude px-4 py-2.5 text-sm">
                            <div>
                              <span className="font-medium text-text">{a.is_first_consultation ? 'Consultation' : (service?.name ?? '—')}</span>
                              <span className="ml-2 text-text-light">{formatDateDisplay(a.date, { day: 'numeric', month: 'short' })} à {a.time}</span>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.classes}`}>{status.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Treatment sessions (feuille de suivi) */}
                <div className="rounded-xl border border-rose-soft bg-white p-5">
                  <h3 className="text-sm font-semibold text-text">Feuille de suivi</h3>

                  {/* Existing sessions as accordion cards */}
                  {patientSessions.length > 0 && (
                    <div className="mt-4 flex flex-col gap-3">
                      {patientSessions.map((session) => (
                        editingSessionId === session.id ? (
                          <div key={session.id} className="rounded-xl border border-primary-light bg-nude p-4">
                            <p className="mb-3 text-sm font-medium text-text">Modifier la séance</p>
                            <SessionForm
                              state={editForm}
                              onChange={(patch) => setEditForm((prev) => ({ ...prev, ...patch }))}
                              onSubmit={handleSaveEditSession}
                              onCancel={() => setEditingSessionId(null)}
                              submitLabel="Enregistrer"
                              zoneNames={zoneNames}
                              inputClasses={inputClasses}
                            />
                          </div>
                        ) : (
                          <SessionCard
                            key={session.id}
                            session={session}
                            isOpen={openSessionIds.has(session.id)}
                            onToggle={() => toggleSessionOpen(session.id)}
                            onEdit={() => startEditSession(session)}
                            onDelete={() => handleDeleteSession(session.id)}
                          />
                        )
                      ))}
                    </div>
                  )}

                  {/* Add session form */}
                  <div className="mt-5 rounded-xl border border-rose-soft bg-nude p-4 sm:p-5">
                    <p className="mb-4 text-sm font-medium text-text">Nouvelle séance de traitement</p>
                    <SessionForm
                      state={sessionForm}
                      onChange={(patch) => setSessionForm((prev) => ({ ...prev, ...patch }))}
                      onSubmit={handleAddSession}
                      submitLabel="Ajouter"
                      zoneNames={zoneNames}
                      inputClasses={inputClasses}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: Notifications */}
        {tab === 'notifications' && (
          <div className="mt-6">
            {notifications.length === 0 ? (
              <p className="text-sm text-text-light">Aucune notification.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-center justify-between gap-4 rounded-xl border px-5 py-4 text-sm transition-colors ${
                      n.status === 'cancelled'
                        ? 'border-red-200 bg-red-50/50 text-text'
                        : 'border-primary-light bg-rose-soft/30 text-text'
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs font-semibold uppercase tracking-wider ${
                        n.status === 'cancelled' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {n.status === 'cancelled' ? 'Annulation' : n.status === 'completed' ? 'Terminé' : 'Nouveau RDV'}
                      </span>
                      <span>{n.message}</span>
                      <span className="text-xs text-text-light">
                        {formatDateDisplay(n.date, { day: 'numeric', month: 'short' })} à {n.time}
                      </span>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CONFIG[n.status].classes}`}>
                      {STATUS_CONFIG[n.status].label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
