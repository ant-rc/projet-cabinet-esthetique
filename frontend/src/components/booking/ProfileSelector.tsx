import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { PatientProfile } from '@/types';

interface ProfileSelectorProps {
  selectedProfileId: string;
  onSelect: (profile: PatientProfile) => void;
}

function sanitize(value: string): string {
  return value.replace(/[<>]/g, '').trim();
}

export default function ProfileSelector({ selectedProfileId, onSelect }: ProfileSelectorProps) {
  const { user, addProfile } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('');

  if (!user) return null;

  const profiles = user.profiles;

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    const sanitizedFirstName = sanitize(firstName);
    const sanitizedLastName = sanitize(lastName);
    if (!sanitizedFirstName || !sanitizedLastName) return;

    const newProfile = addProfile({
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
      phone: sanitize(phone) || (user?.phone ?? ''),
      relation: sanitize(relation) || 'Proche',
    });

    onSelect(newProfile);
    setShowAddForm(false);
    setFirstName('');
    setLastName('');
    setPhone('');
    setRelation('');
  }

  const inputClasses =
    'w-full rounded-lg border border-rose-soft bg-white px-4 py-2.5 text-sm text-text placeholder:text-text-light/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-text">Pour qui est ce rendez-vous&nbsp;?</p>

      <div className="flex flex-wrap gap-2">
        {profiles.map((profile) => (
          <button
            key={profile.id}
            type="button"
            onClick={() => onSelect(profile)}
            className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
              selectedProfileId === profile.id
                ? 'bg-primary text-white shadow-md'
                : 'border border-rose-soft bg-white text-text hover:border-primary'
            }`}
          >
            {profile.firstName} {profile.lastName}
            {profile.relation !== 'Moi-même' && (
              <span className="ml-1.5 text-xs opacity-70">({profile.relation})</span>
            )}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="rounded-full border border-dashed border-primary-light px-5 py-2.5 text-sm font-medium text-primary-dark transition-colors hover:border-primary hover:bg-nude"
        >
          + Ajouter un proche
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="rounded-xl border border-rose-soft bg-nude p-5">
          <p className="mb-4 text-sm font-medium text-text">Nouveau profil</p>
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                required
                placeholder="Prénom"
                autoComplete="given-name"
                className={inputClasses}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                type="text"
                required
                placeholder="Nom"
                autoComplete="family-name"
                className={inputClasses}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="tel"
                placeholder="Téléphone (optionnel)"
                autoComplete="tel"
                className={inputClasses}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <input
                type="text"
                placeholder="Lien (ex: Fille, Conjoint...)"
                className={inputClasses}
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                Ajouter
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded-full border border-rose-soft px-5 py-2 text-sm text-text-light transition-colors hover:bg-white"
              >
                Annuler
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
