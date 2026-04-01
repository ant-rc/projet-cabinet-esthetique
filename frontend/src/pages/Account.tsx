import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

function sanitize(value: string): string {
  return value.replace(/[<>]/g, '').trim();
}

export default function Account() {
  const { isAuthenticated, isLoading, profile, dbUser, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isEditing && profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync form state when editing starts
      setEditFirstName(profile.first_name);
      setEditLastName(profile.last_name);
      setEditPhone(profile.phone ?? '');
    }
  }, [isEditing, profile]);

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;

    const fn = sanitize(editFirstName);
    const ln = sanitize(editLastName);
    if (!fn || !ln) {
      toast.error('Prénom et nom sont requis.');
      return;
    }

    const { error } = await supabase.from('profiles').update({
      first_name: fn,
      last_name: ln,
      phone: sanitize(editPhone) || null,
    }).eq('id', profile.id);

    if (error) {
      toast.error('Erreur lors de la mise à jour.');
      return;
    }

    await refreshProfile();
    setIsEditing(false);
    toast.success('Profil mis à jour.');
  }

  if (isLoading) {
    return (
      <section className="page-enter flex items-center justify-center px-4 py-24">
        <p className="text-text-light">Chargement...</p>
      </section>
    );
  }

  if (!isAuthenticated || !profile) return null;

  const inputClasses =
    'w-full rounded-xl border border-rose-soft bg-white px-4 py-3 text-sm text-text placeholder:text-text-light/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200';

  return (
    <section className="page-enter px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-text md:text-4xl">Mon Compte</h1>
            <p className="mt-2 text-base text-text-light">
              {profile.first_name} {profile.last_name} — {dbUser?.email}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="w-full rounded-full border border-primary-light px-5 py-2.5 text-sm font-medium text-primary-dark transition-all duration-300 hover:bg-nude hover:shadow-sm sm:w-auto"
            >
              Modifier
            </button>
            <Link
              to="/mes-rdv"
              className="w-full rounded-full bg-primary px-5 py-2.5 text-center text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-primary-dark sm:w-auto"
            >
              Mes rendez-vous
            </Link>
          </div>
        </div>

        {isEditing && (
          <form onSubmit={handleSaveProfile} className="step-enter mt-8 rounded-2xl border border-primary-light/50 bg-gradient-to-br from-nude to-rose-soft/30 p-6">
            <h2 className="font-serif text-lg font-semibold text-text">Modifier mes informations</h2>
            <div className="mt-4 flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="edit-firstName" className="mb-1.5 block text-sm font-medium text-text">Prénom</label>
                  <input id="edit-firstName" type="text" required className={inputClasses} value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="edit-lastName" className="mb-1.5 block text-sm font-medium text-text">Nom</label>
                  <input id="edit-lastName" type="text" required className={inputClasses} value={editLastName} onChange={(e) => setEditLastName(e.target.value)} />
                </div>
              </div>
              <div>
                <label htmlFor="edit-phone" className="mb-1.5 block text-sm font-medium text-text">Téléphone</label>
                <input id="edit-phone" type="tel" className={inputClasses} value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-lg">
                  Enregistrer
                </button>
                <button type="button" onClick={() => setIsEditing(false)} className="rounded-full border border-rose-soft px-6 py-2.5 text-sm font-medium text-text-light transition-all duration-300 hover:bg-nude">
                  Annuler
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="mt-10 rounded-2xl border border-primary-light/50 bg-white p-6">
          <h2 className="font-serif text-lg font-semibold text-text">Informations</h2>
          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <span className="text-text-light">Prénom :</span>{' '}
              <span className="font-medium text-text">{profile.first_name}</span>
            </div>
            <div>
              <span className="text-text-light">Nom :</span>{' '}
              <span className="font-medium text-text">{profile.last_name}</span>
            </div>
            <div>
              <span className="text-text-light">E-mail :</span>{' '}
              <span className="font-medium text-text">{dbUser?.email}</span>
            </div>
            <div>
              <span className="text-text-light">Téléphone :</span>{' '}
              <span className="font-medium text-text">{profile.phone || '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
