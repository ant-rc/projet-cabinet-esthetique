import { useState, useMemo } from 'react';
import type { ProviderNotification, TreatmentNote, SkinType } from '@/types';
import type { FormEvent } from 'react';
import { zones as allZones } from '@/data/pricing';

// Read all users from localStorage (simulated backend)
function getAllPatients() {
  const stored = localStorage.getItem('aa_laser_user');
  if (!stored) return [];
  const user = JSON.parse(stored);
  return [user]; // In real app, this would be all users from the backend
}

function getNotifications(): ProviderNotification[] {
  const stored = localStorage.getItem('aa_laser_notifications');
  return stored ? JSON.parse(stored) : [];
}

function markNotificationRead(id: string) {
  const notifications = getNotifications();
  const updated = notifications.map((n) =>
    n.id === id ? { ...n, read: true } : n,
  );
  localStorage.setItem('aa_laser_notifications', JSON.stringify(updated));
}

function markAllNotificationsRead() {
  const notifications = getNotifications();
  const updated = notifications.map((n) => ({ ...n, read: true }));
  localStorage.setItem('aa_laser_notifications', JSON.stringify(updated));
}

function deleteNotification(id: string) {
  const notifications = getNotifications();
  const updated = notifications.filter((n) => n.id !== id);
  localStorage.setItem('aa_laser_notifications', JSON.stringify(updated));
}

function clearAllNotifications() {
  localStorage.setItem('aa_laser_notifications', JSON.stringify([]));
}

function getTreatmentNotes(userId: string): TreatmentNote[] {
  const stored = localStorage.getItem(`aa_laser_notes_${userId}`);
  return stored ? JSON.parse(stored) : [];
}

function saveTreatmentNotes(userId: string, notes: TreatmentNote[]) {
  localStorage.setItem(`aa_laser_notes_${userId}`, JSON.stringify(notes));
}

type Tab = 'appointments' | 'patients' | 'notifications';

const STATUS_LABELS: Record<string, { label: string; classes: string }> = {
  requested: { label: 'Demandé', classes: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmé', classes: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Annulé', classes: 'bg-red-100 text-red-700' },
  completed: { label: 'Terminé', classes: 'bg-blue-100 text-blue-700' },
};

const SKIN_TYPES: SkinType[] = ['I', 'II', 'III', 'IV', 'V', 'VI'];

export default function Pro() {
  const [tab, setTab] = useState<Tab>('appointments');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(getNotifications);
  const [notesVersion, setNotesVersion] = useState(0); // force re-read after edit

  // Treatment note form
  const [noteZone, setNoteZone] = useState('');
  const [noteIntensity, setNoteIntensity] = useState('');
  const [noteSkinType, setNoteSkinType] = useState<SkinType>('II');
  const [noteText, setNoteText] = useState('');

  // Edit note state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editZone, setEditZone] = useState('');
  const [editIntensity, setEditIntensity] = useState('');
  const [editSkinType, setEditSkinType] = useState<SkinType>('II');
  const [editText, setEditText] = useState('');

  const patients = useMemo(() => getAllPatients(), []);
  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  // Re-read notes when notesVersion changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const patientNotes = useMemo(
    () => selectedPatientId ? getTreatmentNotes(selectedPatientId) : [],
    [selectedPatientId, notesVersion],
  );

  // All zones from pricing data for the dropdown
  const dropdownZones = allZones;

  const allAppointments = useMemo(() => {
    return patients.flatMap((p) =>
      (p.appointments ?? []).map((a: Record<string, unknown>) => ({
        ...a,
        patientName: `${p.firstName} ${p.lastName}`,
        patientEmail: p.email,
        patientId: p.id,
      })),
    ).sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime());
  }, [patients]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleMarkRead(id: string) {
    markNotificationRead(id);
    setNotifications(getNotifications());
  }

  function handleMarkAllRead() {
    markAllNotificationsRead();
    setNotifications(getNotifications());
  }

  function handleDeleteNotification(id: string) {
    deleteNotification(id);
    setNotifications(getNotifications());
  }

  function handleClearAll() {
    clearAllNotifications();
    setNotifications([]);
  }

  function handleAddNote(e: FormEvent) {
    e.preventDefault();
    if (!selectedPatientId || !noteZone) return;

    const note: TreatmentNote = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      zone: noteZone.replace(/[<>]/g, '').trim(),
      intensity: noteIntensity.replace(/[<>]/g, '').trim(),
      skinType: noteSkinType,
      notes: noteText.replace(/[<>]/g, '').trim(),
    };

    const notes = getTreatmentNotes(selectedPatientId);
    notes.push(note);
    saveTreatmentNotes(selectedPatientId, notes);
    setNoteZone('');
    setNoteIntensity('');
    setNoteText('');
    setNotesVersion((v) => v + 1);
  }

  function startEditNote(note: TreatmentNote) {
    setEditingNoteId(note.id);
    setEditZone(note.zone);
    setEditIntensity(note.intensity);
    setEditSkinType(note.skinType);
    setEditText(note.notes);
  }

  function cancelEditNote() {
    setEditingNoteId(null);
  }

  function handleSaveEditNote(e: FormEvent) {
    e.preventDefault();
    if (!selectedPatientId || !editingNoteId || !editZone) return;

    const notes = getTreatmentNotes(selectedPatientId);
    const updated = notes.map((n) =>
      n.id === editingNoteId
        ? {
            ...n,
            zone: editZone.replace(/[<>]/g, '').trim(),
            intensity: editIntensity.replace(/[<>]/g, '').trim(),
            skinType: editSkinType,
            notes: editText.replace(/[<>]/g, '').trim(),
          }
        : n,
    );
    saveTreatmentNotes(selectedPatientId, updated);
    setEditingNoteId(null);
    setNotesVersion((v) => v + 1);
  }

  function handleDeleteNote(noteId: string) {
    if (!selectedPatientId) return;
    const notes = getTreatmentNotes(selectedPatientId);
    const updated = notes.filter((n) => n.id !== noteId);
    saveTreatmentNotes(selectedPatientId, updated);
    setNotesVersion((v) => v + 1);
  }

  const inputClasses =
    'w-full rounded-lg border border-rose-soft bg-white px-3 py-2 text-sm text-text placeholder:text-text-light/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors';

  return (
    <section className="page-enter px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-serif text-3xl font-bold text-text md:text-4xl">
          Espace Prestataire
        </h1>
        <p className="mt-2 text-base text-text-light">
          Gérez vos rendez-vous et dossiers patients.
        </p>

        {/* Tabs */}
        <div className="mt-8 flex gap-2 border-b border-rose-soft">
          {([
            { key: 'appointments' as Tab, label: 'Rendez-vous' },
            { key: 'patients' as Tab, label: 'Patients' },
            { key: 'notifications' as Tab, label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
          ]).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === key
                  ? 'border-primary text-primary-dark'
                  : 'border-transparent text-text-light hover:text-text'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Appointments tab */}
        {tab === 'appointments' && (
          <div className="mt-6">
            {allAppointments.length === 0 ? (
              <p className="text-sm text-text-light">Aucun rendez-vous pour le moment.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-rose-soft">
                      <th className="px-3 py-3 font-semibold text-text">Patient</th>
                      <th className="px-3 py-3 font-semibold text-text">Type</th>
                      <th className="px-3 py-3 font-semibold text-text">Zones</th>
                      <th className="px-3 py-3 font-semibold text-text">Date</th>
                      <th className="px-3 py-3 font-semibold text-text">Heure</th>
                      <th className="px-3 py-3 font-semibold text-text">Statut</th>
                      <th className="px-3 py-3 font-semibold text-text">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAppointments.map((appt) => {
                      const status = STATUS_LABELS[appt.status as string] ?? STATUS_LABELS.requested;
                      return (
                        <tr key={appt.id as string} className="border-b border-rose-soft/50 hover:bg-nude/50">
                          <td className="px-3 py-3 font-medium">{appt.patientName as string}</td>
                          <td className="px-3 py-3">
                            {(appt.appointmentType as string) === 'consultation' ? 'Consultation' : 'Séance'}
                          </td>
                          <td className="px-3 py-3 text-text-light">
                            {Array.isArray(appt.services) ? (appt.services as string[]).join(', ') : '—'}
                          </td>
                          <td className="px-3 py-3">
                            {new Date(appt.date as string).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-3 py-3">{appt.time as string}</td>
                          <td className="px-3 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.classes}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPatientId(appt.patientId as string);
                                setTab('patients');
                              }}
                              className="text-xs font-medium text-primary-dark underline underline-offset-2 hover:text-primary"
                            >
                              Fiche
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Patients tab */}
        {tab === 'patients' && (
          <div className="mt-6">
            {!selectedPatient ? (
              <div>
                <h2 className="font-serif text-lg font-semibold text-text">Liste des patients</h2>
                {patients.length === 0 ? (
                  <p className="mt-4 text-sm text-text-light">Aucun patient enregistré.</p>
                ) : (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {patients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPatientId(p.id)}
                        className="card-hover rounded-xl border border-rose-soft bg-white p-4 text-left"
                      >
                        <p className="font-semibold text-text">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-text-light">{p.email}</p>
                        <p className="mt-2 text-xs text-text-light">
                          {(p.appointments ?? []).length} rendez-vous
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => { setSelectedPatientId(null); setEditingNoteId(null); }}
                    className="rounded-lg border border-rose-soft px-3 py-1.5 text-sm text-text-light hover:bg-nude"
                  >
                    &larr; Retour
                  </button>
                  <h2 className="font-serif text-lg font-semibold text-text">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </h2>
                </div>

                {/* Patient info */}
                <div className="rounded-xl border border-rose-soft bg-white p-5">
                  <h3 className="text-sm font-semibold text-text">Informations</h3>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <p><span className="text-text-light">Email :</span> {selectedPatient.email}</p>
                    <p><span className="text-text-light">Tél :</span> {selectedPatient.phone || '—'}</p>
                  </div>
                </div>

                {/* Appointment history */}
                <div className="rounded-xl border border-rose-soft bg-white p-5">
                  <h3 className="text-sm font-semibold text-text">Historique des rendez-vous</h3>
                  {(selectedPatient.appointments ?? []).length === 0 ? (
                    <p className="mt-3 text-sm text-text-light">Aucun rendez-vous.</p>
                  ) : (
                    <div className="mt-3 flex flex-col gap-2">
                      {[...(selectedPatient.appointments ?? [])].sort((a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime(),
                      ).map((a) => {
                        const status = STATUS_LABELS[a.status] ?? STATUS_LABELS.requested;
                        return (
                          <div key={a.id} className="flex items-center justify-between rounded-lg bg-nude px-4 py-2.5 text-sm">
                            <div>
                              <span className="font-medium text-text">
                                {a.appointmentType === 'consultation' ? 'Consultation' : (a.services ?? []).join(', ')}
                              </span>
                              <span className="ml-2 text-text-light">
                                {new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {a.time}
                              </span>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.classes}`}>
                              {status.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Treatment notes */}
                <div className="rounded-xl border border-rose-soft bg-white p-5">
                  <h3 className="text-sm font-semibold text-text">Feuille de suivi</h3>

                  {patientNotes.length > 0 && (
                    <div className="mt-3 flex flex-col gap-2">
                      {patientNotes.map((note) => (
                        <div key={note.id} className="rounded-lg bg-nude px-4 py-3 text-sm">
                          {editingNoteId === note.id ? (
                            /* Inline edit form */
                            <form onSubmit={handleSaveEditNote} className="flex flex-col gap-2">
                              <div className="grid gap-2 sm:grid-cols-3">
                                <select
                                  required
                                  className={inputClasses}
                                  value={editZone}
                                  onChange={(e) => setEditZone(e.target.value)}
                                >
                                  <option value="">Zone traitée</option>
                                  {dropdownZones.map((zone) => (
                                    <option key={zone} value={zone}>{zone}</option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  placeholder="Intensité (J/cm²)"
                                  className={inputClasses}
                                  value={editIntensity}
                                  onChange={(e) => setEditIntensity(e.target.value)}
                                />
                                <select
                                  className={inputClasses}
                                  value={editSkinType}
                                  onChange={(e) => setEditSkinType(e.target.value as SkinType)}
                                >
                                  {SKIN_TYPES.map((st) => (
                                    <option key={st} value={st}>Phototype {st}</option>
                                  ))}
                                </select>
                              </div>
                              <textarea
                                rows={2}
                                placeholder="Notes, observations..."
                                className={inputClasses}
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                              />
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
                                >
                                  Enregistrer
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditNote}
                                  className="rounded-full border border-rose-soft px-4 py-1.5 text-xs text-text-light hover:bg-white"
                                >
                                  Annuler
                                </button>
                              </div>
                            </form>
                          ) : (
                            /* Read-only display */
                            <>
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-text">{note.zone}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-text-light">{note.date}</span>
                                  <button
                                    type="button"
                                    onClick={() => startEditNote(note)}
                                    className="rounded px-1.5 py-0.5 text-xs text-primary-dark transition-colors hover:bg-primary-light/30"
                                  >
                                    Modifier
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="rounded px-1.5 py-0.5 text-xs text-red-500 transition-colors hover:bg-red-50"
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              </div>
                              <div className="mt-1 flex gap-3 text-xs text-text-light">
                                <span>Intensité : {note.intensity || '—'}</span>
                                <span>Phototype : {note.skinType}</span>
                              </div>
                              {note.notes && (
                                <p className="mt-1 text-xs text-text-light">{note.notes}</p>
                              )}
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
                        <select
                          required
                          className={inputClasses}
                          value={noteZone}
                          onChange={(e) => setNoteZone(e.target.value)}
                        >
                          <option value="">Zone traitée</option>
                          {dropdownZones.map((zone) => (
                            <option key={zone} value={zone}>{zone}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Intensité (J/cm²)"
                          className={inputClasses}
                          value={noteIntensity}
                          onChange={(e) => setNoteIntensity(e.target.value)}
                        />
                        <select
                          className={inputClasses}
                          value={noteSkinType}
                          onChange={(e) => setNoteSkinType(e.target.value as SkinType)}
                        >
                          {SKIN_TYPES.map((st) => (
                            <option key={st} value={st}>Phototype {st}</option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Notes, observations..."
                        className={inputClasses}
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="self-start rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                      >
                        Ajouter
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notifications tab */}
        {tab === 'notifications' && (
          <div className="mt-6">
            {notifications.length === 0 ? (
              <p className="text-sm text-text-light">Aucune notification.</p>
            ) : (
              <>
                {/* Bulk actions */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="rounded-full border border-primary-light px-4 py-2 text-xs font-medium text-primary-dark transition-all duration-200 hover:bg-nude hover:shadow-sm"
                    >
                      Tout marquer comme lu
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="rounded-full border border-red-200 px-4 py-2 text-xs font-medium text-red-600 transition-all duration-200 hover:bg-red-50"
                  >
                    Supprimer toutes les notifications
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {[...notifications].reverse().map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-center justify-between gap-4 rounded-xl border px-5 py-4 text-sm transition-colors ${
                        n.read
                          ? 'border-rose-soft/50 bg-white text-text-light'
                          : 'border-primary-light bg-rose-soft/30 text-text'
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs font-semibold uppercase tracking-wider ${
                          n.type === 'cancellation' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {n.type === 'cancellation' ? 'Annulation' : 'Nouveau RDV'}
                        </span>
                        <span>{n.message}</span>
                        <span className="text-xs text-text-light">
                          {new Date(n.createdAt).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        {!n.read && (
                          <button
                            type="button"
                            onClick={() => handleMarkRead(n.id)}
                            className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary-dark transition-colors hover:bg-primary hover:text-white"
                          >
                            Marquer lu
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteNotification(n.id)}
                          className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                          aria-label="Supprimer la notification"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
