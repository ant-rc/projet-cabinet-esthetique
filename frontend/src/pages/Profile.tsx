import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';
import type { SSOProvider } from '@/context/AuthContext';
import type { AppointmentStatus } from '@/types';
import { formatDuration } from '@/utils/booking';

type AuthTab = 'login' | 'register';

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  requested: 'Demandé',
  confirmed: 'Confirmé',
  cancelled: 'Annulé',
  completed: 'Terminé',
};

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  requested: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
};

function sanitize(value: string): string {
  return value.replace(/[<>]/g, '').trim();
}

export default function Profile() {
  const { user, isAuthenticated, login, loginWithSSO, register, logout, updateUser, cancelAppointment, removeProfile } = useAuth();
  const [ssoLoading, setSsoLoading] = useState<SSOProvider | null>(null);

  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Edit profile fields
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Pre-fill edit fields when opening edit mode
  useEffect(() => {
    if (isEditing && user) {
      setEditFirstName(user.firstName);
      setEditLastName(user.lastName);
      setEditEmail(user.email);
      setEditPhone(user.phone);
    }
  }, [isEditing, user]);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error('Veuillez remplir tous les champs.');
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(sanitize(loginEmail), loginPassword);
      if (success) toast.success('Connexion réussie.');
      else toast.error('Identifiants incorrects.');
    } catch {
      toast.error('Erreur lors de la connexion.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!regFirstName || !regLastName || !regEmail || !regPhone || !regPassword) {
      toast.error('Veuillez remplir tous les champs.');
      return;
    }

    setIsLoading(true);
    try {
      const success = await register(
        {
          firstName: sanitize(regFirstName),
          lastName: sanitize(regLastName),
          email: sanitize(regEmail),
          phone: sanitize(regPhone),
        },
        regPassword,
      );
      if (success) toast.success('Compte créé avec succès.');
    } catch {
      toast.error('Erreur lors de l\'inscription.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSSO(provider: SSOProvider) {
    setSsoLoading(provider);
    try {
      const success = await loginWithSSO(provider);
      if (success) toast.success('Connexion réussie.');
      else toast.error('Erreur lors de la connexion.');
    } catch {
      toast.error('Erreur lors de la connexion.');
    } finally {
      setSsoLoading(null);
    }
  }

  function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    const fn = sanitize(editFirstName);
    const ln = sanitize(editLastName);
    const em = sanitize(editEmail);
    const ph = sanitize(editPhone);

    if (!fn || !ln || !em) {
      toast.error('Prénom, nom et e-mail sont requis.');
      return;
    }

    updateUser({ firstName: fn, lastName: ln, email: em, phone: ph });
    setIsEditing(false);
    toast.success('Profil mis à jour.');
  }

  function handleConfirmCancel() {
    if (!cancelConfirmId) return;
    cancelAppointment(cancelConfirmId);
    setCancelConfirmId(null);
    toast.info('Rendez-vous annulé.');
  }

  const inputClasses =
    'w-full rounded-xl border border-rose-soft bg-white px-4 py-3 text-sm text-text placeholder:text-text-light/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200';

  if (!isAuthenticated) {
    return (
      <section className="page-enter px-4 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-md">
          <h1 className="text-center font-serif text-3xl font-bold text-text md:text-4xl">
            Mon Compte
          </h1>

          <div className="mt-8 flex rounded-xl border border-rose-soft overflow-hidden">
            <button
              type="button"
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-300 ${
                activeTab === 'login'
                  ? 'bg-primary text-white'
                  : 'bg-white text-text-light hover:bg-nude'
              }`}
              onClick={() => setActiveTab('login')}
            >
              Connexion
            </button>
            <button
              type="button"
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-300 ${
                activeTab === 'register'
                  ? 'bg-primary text-white'
                  : 'bg-white text-text-light hover:bg-nude'
              }`}
              onClick={() => setActiveTab('register')}
            >
              Inscription
            </button>
          </div>

          {/* SSO Buttons */}
          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              disabled={ssoLoading !== null}
              onClick={() => handleSSO('google')}
              className="flex items-center justify-center gap-3 rounded-xl border border-rose-soft bg-white px-4 py-3 text-sm font-medium text-text shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {ssoLoading === 'google' ? 'Connexion...' : 'Continuer avec Google'}
            </button>

            <button
              type="button"
              disabled={ssoLoading !== null}
              onClick={() => handleSSO('facebook')}
              className="flex items-center justify-center gap-3 rounded-xl border border-rose-soft bg-white px-4 py-3 text-sm font-medium text-text shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" />
              </svg>
              {ssoLoading === 'facebook' ? 'Connexion...' : 'Continuer avec Facebook'}
            </button>

            <button
              type="button"
              disabled={ssoLoading !== null}
              onClick={() => handleSSO('apple')}
              className="flex items-center justify-center gap-3 rounded-xl border border-rose-soft bg-white px-4 py-3 text-sm font-medium text-text shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="#000" />
              </svg>
              {ssoLoading === 'apple' ? 'Connexion...' : 'Continuer avec Apple'}
            </button>
          </div>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-rose-soft" />
            <span className="text-xs font-medium text-text-light">ou par e-mail</span>
            <div className="h-px flex-1 bg-rose-soft" />
          </div>

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4" noValidate>
              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-text">E-mail</label>
                <input id="login-email" type="email" required autoComplete="email" className={inputClasses} value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
              </div>
              <div>
                <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-text">Mot de passe</label>
                <input id="login-password" type="password" required autoComplete="current-password" className={inputClasses} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
              </div>
              <button type="submit" disabled={isLoading} className="mt-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-lg disabled:opacity-60">
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="mt-6 flex flex-col gap-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="reg-firstName" className="mb-1.5 block text-sm font-medium text-text">Prénom</label>
                  <input id="reg-firstName" type="text" required autoComplete="given-name" className={inputClasses} value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="reg-lastName" className="mb-1.5 block text-sm font-medium text-text">Nom</label>
                  <input id="reg-lastName" type="text" required autoComplete="family-name" className={inputClasses} value={regLastName} onChange={(e) => setRegLastName(e.target.value)} />
                </div>
              </div>
              <div>
                <label htmlFor="reg-email" className="mb-1.5 block text-sm font-medium text-text">E-mail</label>
                <input id="reg-email" type="email" required autoComplete="email" className={inputClasses} value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
              </div>
              <div>
                <label htmlFor="reg-phone" className="mb-1.5 block text-sm font-medium text-text">Téléphone</label>
                <input id="reg-phone" type="tel" required autoComplete="tel" className={inputClasses} placeholder="06 12 34 56 78" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} />
              </div>
              <div>
                <label htmlFor="reg-password" className="mb-1.5 block text-sm font-medium text-text">Mot de passe</label>
                <input id="reg-password" type="password" required autoComplete="new-password" className={inputClasses} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
              </div>
              <button type="submit" disabled={isLoading} className="mt-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-lg disabled:opacity-60">
                {isLoading ? 'Inscription...' : 'Créer mon compte'}
              </button>
            </form>
          )}
        </div>
      </section>
    );
  }

  const sortedAppointments = [...(user?.appointments ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const cancelTarget = cancelConfirmId
    ? sortedAppointments.find((a) => a.id === cancelConfirmId)
    : null;

  return (
    <section className="page-enter px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-text md:text-4xl">
              Mon Compte
            </h1>
            <p className="mt-2 text-base text-text-light">
              {user?.firstName} {user?.lastName} — {user?.email}
            </p>
            {user?.hasCompletedConsultation && (
              <span className="mt-1 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Consultation effectuée
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-full border border-primary-light px-5 py-2.5 text-sm font-medium text-primary-dark transition-all duration-300 hover:bg-nude hover:shadow-sm"
            >
              Modifier mon profil
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-primary px-6 py-2.5 text-sm font-medium text-primary transition-all duration-300 hover:bg-primary hover:text-white"
            >
              Se déconnecter
            </button>
          </div>
        </div>

        {/* Edit profile form */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="step-enter mt-8 rounded-2xl border border-primary-light/50 bg-gradient-to-br from-nude to-rose-soft/30 p-6">
            <h2 className="font-serif text-lg font-semibold text-text">Modifier mes informations</h2>
            <div className="mt-4 flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="edit-firstName" className="mb-1.5 block text-sm font-medium text-text">Prénom</label>
                  <input
                    id="edit-firstName"
                    type="text"
                    required
                    autoComplete="given-name"
                    className={inputClasses}
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="edit-lastName" className="mb-1.5 block text-sm font-medium text-text">Nom</label>
                  <input
                    id="edit-lastName"
                    type="text"
                    required
                    autoComplete="family-name"
                    className={inputClasses}
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="edit-email" className="mb-1.5 block text-sm font-medium text-text">E-mail</label>
                <input
                  id="edit-email"
                  type="email"
                  required
                  autoComplete="email"
                  className={inputClasses}
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="edit-phone" className="mb-1.5 block text-sm font-medium text-text">Téléphone</label>
                <input
                  id="edit-phone"
                  type="tel"
                  autoComplete="tel"
                  className={inputClasses}
                  placeholder="06 12 34 56 78"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-lg"
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-full border border-rose-soft px-6 py-2.5 text-sm font-medium text-text-light transition-all duration-300 hover:bg-nude"
                >
                  Annuler
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Profiles */}
        {user && (user.profiles?.length ?? 0) > 0 && (
          <div className="mt-10">
            <h2 className="font-serif text-xl font-bold text-text">Mes profils</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {user.profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="card-hover flex items-center gap-3 rounded-xl border border-rose-soft bg-white px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-text">
                      {profile.firstName} {profile.lastName}
                    </p>
                    <p className="text-xs text-text-light">{profile.relation}</p>
                  </div>
                  {profile.id !== 'self' && (
                    <button
                      type="button"
                      onClick={() => removeProfile(profile.id)}
                      className="text-xs text-text-light transition-colors hover:text-red-500"
                      aria-label={`Supprimer le profil de ${profile.firstName}`}
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Appointments */}
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-text">Mes rendez-vous</h2>
            <Link
              to="/rendez-vous"
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-primary-dark"
            >
              Nouveau rendez-vous
            </Link>
          </div>

          {sortedAppointments.length === 0 ? (
            <p className="mt-6 text-base text-text-light">
              Vous n&apos;avez pas encore de rendez-vous.
            </p>
          ) : (
            <div className="mt-6 flex flex-col gap-4">
              {sortedAppointments.map((apt) => {
                const canCancel = apt.status === 'requested' || apt.status === 'confirmed';
                return (
                  <article
                    key={apt.id}
                    className="card-hover flex flex-col gap-4 rounded-2xl border border-rose-soft bg-white p-5"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-text-light">
                            {apt.appointmentType === 'consultation' ? 'Consultation' : 'Séance laser'}
                          </span>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[apt.status]}`}>
                            {STATUS_LABELS[apt.status]}
                          </span>
                        </div>
                        <p className="font-semibold text-text">
                          {apt.appointmentType === 'consultation'
                            ? 'Consultation initiale'
                            : (apt.services ?? []).join(', ')}
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
                        <div className="flex gap-4 text-xs text-text-light">
                          <span>Patient : {apt.profileName}</span>
                          {apt.totalDuration > 0 && (
                            <span>Durée : {formatDuration(apt.totalDuration)}</span>
                          )}
                          <span>
                            {apt.appointmentType === 'consultation'
                              ? 'Gratuit'
                              : `${apt.totalPrice}\u20ac`}
                          </span>
                        </div>
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
      </div>

      {/* Cancel confirmation modal */}
      {cancelConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
          onClick={() => setCancelConfirmId(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Confirmer l'annulation"
        >
          <div
            className="step-enter w-full max-w-md rounded-2xl border border-rose-soft bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-lg font-semibold text-text">
              Confirmer l&apos;annulation
            </h3>
            {cancelTarget && (
              <div className="mt-4 rounded-xl bg-nude p-4 text-sm">
                <p className="font-medium text-text">
                  {cancelTarget.appointmentType === 'consultation'
                    ? 'Consultation initiale'
                    : (cancelTarget.services ?? []).join(', ')}
                </p>
                <p className="mt-1 text-text-light">
                  {new Date(cancelTarget.date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}{' '}
                  à {cancelTarget.time}
                </p>
              </div>
            )}
            <p className="mt-4 text-sm text-text-light">
              Êtes-vous sûr(e) de vouloir annuler ce rendez-vous&nbsp;? Cette action est irréversible.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancelConfirmId(null)}
                className="rounded-full border border-rose-soft px-5 py-2.5 text-sm font-medium text-text-light transition-all duration-300 hover:bg-nude"
              >
                Non, garder
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-red-700"
              >
                Oui, annuler le rendez-vous
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
