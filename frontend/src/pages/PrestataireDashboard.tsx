import { useState, useEffect, useCallback, useMemo } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { getServiceById, servicesData } from '@/data/pricing';
import type { DbAppointment, DbProfile, AppointmentStatus } from '@/types';

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; classes: string }> = {
  confirmed: { label: 'Confirmé', classes: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Annulé', classes: 'bg-red-100 text-red-700' },
  completed: { label: 'Terminé', classes: 'bg-blue-100 text-blue-700' },
};

type SkinType = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
const SKIN_TYPES: SkinType[] = ['I', 'II', 'III', 'IV', 'V', 'VI'];

interface TreatmentNote {
  id: string;
  date: string;
  zone: string;
  intensity: string;
  skinType: SkinType;
  notes: string;
}

interface AppointmentRow extends DbAppointment {
  profile_name: string;
}

type Tab = 'appointments' | 'patients' | 'notifications';

// ─── localStorage helpers for treatment notes ───
function getTreatmentNotes(userId: string): TreatmentNote[] {
  const stored = localStorage.getItem(`aa_laser_notes_${userId}`);
  return stored ? JSON.parse(stored) : [];
}

function saveTreatmentNotes(userId: string, notes: TreatmentNote[]) {
  localStorage.setItem(`aa_laser_notes_${userId}`, JSON.stringify(notes));
}

function sanitize(value: string): string {
  return value.replace(/[<>]/g, '').trim();
}

export default function PrestataireDashboard() {
  const { isAuthenticated, isLoading: authLoading, role, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('appointments');
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [profiles, setProfiles] = useState<DbProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Appointments filters
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'all'>('all');
  const [filterDate, setFilterDate] = useState('');
  const [searchClient, setSearchClient] = useState('');

  // Patients
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [notesVersion, setNotesVersion] = useState(0);

  // Treatment note form
  const [noteZone, setNoteZone] = useState('');
  const [noteIntensity, setNoteIntensity] = useState('');
  const [noteSkinType, setNoteSkinType] = useState<SkinType>('II');
  const [noteText, setNoteText] = useState('');

  // Edit note
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editZone, setEditZone] = useState('');
  const [editIntensity, setEditIntensity] = useState('');
  const [editSkinType, setEditSkinType] = useState<SkinType>('II');
  const [editText, setEditText] = useState('');

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
    }
  }, [authLoading, isAuthenticated, role, navigate, fetchAll]);

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
  const patientNotes = useMemo(
    () => selectedPatientId ? getTreatmentNotes(selectedPatientId) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedPatientId, notesVersion],
  );

  const zoneNames = servicesData.map((s) => s.name);

  function handleAddNote(e: FormEvent) {
    e.preventDefault();
    if (!selectedPatientId || !noteZone) return;
    const note: TreatmentNote = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      zone: sanitize(noteZone),
      intensity: sanitize(noteIntensity),
      skinType: noteSkinType,
      notes: sanitize(noteText),
    };
    const notes = getTreatmentNotes(selectedPatientId);
    notes.push(note);
    saveTreatmentNotes(selectedPatientId, notes);
    setNoteZone(''); setNoteIntensity(''); setNoteText('');
    setNotesVersion((v) => v + 1);
  }

  function startEditNote(note: TreatmentNote) {
    setEditingNoteId(note.id);
    setEditZone(note.zone); setEditIntensity(note.intensity);
    setEditSkinType(note.skinType); setEditText(note.notes);
  }

  function handleSaveEditNote(e: FormEvent) {
    e.preventDefault();
    if (!selectedPatientId || !editingNoteId || !editZone) return;
    const notes = getTreatmentNotes(selectedPatientId);
    const updated = notes.map((n) => n.id === editingNoteId
      ? { ...n, zone: sanitize(editZone), intensity: sanitize(editIntensity), skinType: editSkinType, notes: sanitize(editText) }
      : n,
    );
    saveTreatmentNotes(selectedPatientId, updated);
    setEditingNoteId(null);
    setNotesVersion((v) => v + 1);
  }

  function handleDeleteNote(noteId: string) {
    if (!selectedPatientId) return;
    const notes = getTreatmentNotes(selectedPatientId).filter((n) => n.id !== noteId);
    saveTreatmentNotes(selectedPatientId, notes);
    setNotesVersion((v) => v + 1);
  }

  const inputClasses = 'w-full rounded-lg border border-rose-soft bg-white px-3 py-2 text-sm text-text placeholder:text-text-light/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors';

  if (authLoading || loading) {
    return <section className="page-enter flex items-center justify-center px-4 py-24"><p className="text-text-light">Chargement...</p></section>;
  }

  const todayStr = new Date().toISOString().split('T')[0];
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

        {/* ═══ TAB: Rendez-vous ═══ */}
        {tab === 'appointments' && (
          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-3">
              <input type="text" placeholder="Rechercher un client..." value={searchClient} onChange={(e) => setSearchClient(e.target.value)}
                className="rounded-lg border border-rose-soft bg-white px-3 py-2 text-sm text-text placeholder:text-text-light/50" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as AppointmentStatus | 'all')}
                className="rounded-lg border border-rose-soft bg-white px-3 py-2 text-sm text-text">
                <option value="all">Tous les statuts</option>
                <option value="confirmed">Confirmés</option>
                <option value="cancelled">Annulés</option>
                <option value="completed">Terminés</option>
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
                          <td className="px-3 py-3">{new Date(appt.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</td>
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

        {/* ═══ TAB: Patients ═══ */}
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
                  <button type="button" onClick={() => { setSelectedPatientId(null); setEditingNoteId(null); }}
                    className="rounded-lg border border-rose-soft px-3 py-1.5 text-sm text-text-light hover:bg-nude">&larr; Retour</button>
                  <h2 className="font-serif text-lg font-semibold text-text">{selectedPatient.first_name} {selectedPatient.last_name}</h2>
                </div>

                {/* Patient info */}
                <div className="rounded-xl border border-rose-soft bg-white p-5">
                  <h3 className="text-sm font-semibold text-text">Informations</h3>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <p><span className="text-text-light">Tél :</span> {selectedPatient.phone || '—'}</p>
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
                              <span className="ml-2 text-text-light">{new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {a.time}</span>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.classes}`}>{status.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Treatment notes (feuille de suivi) */}
                <div className="rounded-xl border border-rose-soft bg-white p-5">
                  <h3 className="text-sm font-semibold text-text">Feuille de suivi</h3>

                  {patientNotes.length > 0 && (
                    <div className="mt-3 flex flex-col gap-2">
                      {patientNotes.map((note) => (
                        <div key={note.id} className="rounded-lg bg-nude px-4 py-3 text-sm">
                          {editingNoteId === note.id ? (
                            <form onSubmit={handleSaveEditNote} className="flex flex-col gap-2">
                              <div className="grid gap-2 sm:grid-cols-3">
                                <select required className={inputClasses} value={editZone} onChange={(e) => setEditZone(e.target.value)}>
                                  <option value="">Zone traitée</option>
                                  {zoneNames.map((z) => <option key={z} value={z}>{z}</option>)}
                                </select>
                                <input type="text" placeholder="Intensité (J/cm²)" className={inputClasses} value={editIntensity} onChange={(e) => setEditIntensity(e.target.value)} />
                                <select className={inputClasses} value={editSkinType} onChange={(e) => setEditSkinType(e.target.value as SkinType)}>
                                  {SKIN_TYPES.map((st) => <option key={st} value={st}>Phototype {st}</option>)}
                                </select>
                              </div>
                              <textarea rows={2} placeholder="Notes, observations..." className={inputClasses} value={editText} onChange={(e) => setEditText(e.target.value)} />
                              <div className="flex gap-2">
                                <button type="submit" className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark">Enregistrer</button>
                                <button type="button" onClick={() => setEditingNoteId(null)} className="rounded-full border border-rose-soft px-4 py-1.5 text-xs text-text-light hover:bg-white">Annuler</button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-text">{note.zone}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-text-light">{note.date}</span>
                                  <button type="button" onClick={() => startEditNote(note)} className="rounded px-1.5 py-0.5 text-xs text-primary-dark hover:bg-primary-light/30">Modifier</button>
                                  <button type="button" onClick={() => handleDeleteNote(note.id)} className="rounded px-1.5 py-0.5 text-xs text-red-500 hover:bg-red-50">Supprimer</button>
                                </div>
                              </div>
                              <div className="mt-1 flex gap-3 text-xs text-text-light">
                                <span>Intensité : {note.intensity || '—'}</span>
                                <span>Phototype : {note.skinType}</span>
                              </div>
                              {note.notes && <p className="mt-1 text-xs text-text-light">{note.notes}</p>}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add note form */}
                  <form onSubmit={handleAddNote} className="mt-4 rounded-lg border border-rose-soft bg-nude p-4">
                    <p className="mb-3 text-sm font-medium text-text">Nouvelle note de traitement</p>
                    <div className="flex flex-col gap-3">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <select required className={inputClasses} value={noteZone} onChange={(e) => setNoteZone(e.target.value)}>
                          <option value="">Zone traitée</option>
                          {zoneNames.map((z) => <option key={z} value={z}>{z}</option>)}
                        </select>
                        <input type="text" placeholder="Intensité (J/cm²)" className={inputClasses} value={noteIntensity} onChange={(e) => setNoteIntensity(e.target.value)} />
                        <select className={inputClasses} value={noteSkinType} onChange={(e) => setNoteSkinType(e.target.value as SkinType)}>
                          {SKIN_TYPES.map((st) => <option key={st} value={st}>Phototype {st}</option>)}
                        </select>
                      </div>
                      <textarea rows={2} placeholder="Notes, observations..." className={inputClasses} value={noteText} onChange={(e) => setNoteText(e.target.value)} />
                      <button type="submit" className="self-start rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark">Ajouter</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB: Notifications ═══ */}
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
                        {new Date(n.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {n.time}
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
