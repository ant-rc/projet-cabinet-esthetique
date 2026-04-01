import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  MEDICAL_FLAG_CODES,
  type FitzpatrickType,
  type MedicalIntakeForm,
  type MedicalHistoryFlag,
} from '@/types/medical';

const FITZPATRICK_OPTIONS: { value: FitzpatrickType; label: string; description: string }[] = [
  { value: 'I', label: 'Type I', description: 'Peau très claire, brûle toujours, ne bronze jamais' },
  { value: 'II', label: 'Type II', description: 'Peau claire, brûle facilement, bronze peu' },
  { value: 'III', label: 'Type III', description: 'Peau intermédiaire, brûle parfois, bronze progressivement' },
  { value: 'IV', label: 'Type IV', description: 'Peau mate, brûle rarement, bronze facilement' },
  { value: 'V', label: 'Type V', description: 'Peau foncée, brûle très rarement, bronze intensément' },
  { value: 'VI', label: 'Type VI', description: 'Peau très foncée, ne brûle jamais' },
];

const FORM_VERSION = '1.0.0';

function sanitize(value: string): string {
  return value.replace(/[<>]/g, '').trim();
}

function getStorageKey(patientId: string): string {
  return `aa_laser_intake_${patientId}`;
}

function loadForm(patientId: string): MedicalIntakeForm | null {
  const stored = localStorage.getItem(getStorageKey(patientId));
  if (!stored) return null;
  return JSON.parse(stored) as MedicalIntakeForm;
}

function saveForm(patientId: string, data: MedicalIntakeForm): void {
  localStorage.setItem(getStorageKey(patientId), JSON.stringify(data));
}

function buildDefaultFlags(): MedicalHistoryFlag[] {
  return MEDICAL_FLAG_CODES.map(({ code, label }) => ({
    code,
    label,
    value: false,
    details: '',
  }));
}

const inputClasses =
  'w-full rounded-lg border border-rose-soft bg-white px-3 py-2.5 text-sm text-text placeholder:text-text-light/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors';

const labelClasses = 'block text-sm font-medium text-text';

export default function MedicalIntake() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const patientId = searchParams.get('patient') ?? '';

  // Personal info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('female');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');

  // Skin evaluation
  const [fitzpatrickType, setFitzpatrickType] = useState<FitzpatrickType>('II');
  const [naturalTan, setNaturalTan] = useState(false);
  const [selfTanningCream, setSelfTanningCream] = useState(false);
  const [lastUvExposureDate, setLastUvExposureDate] = useState('');

  // Medical
  const [medicalFlags, setMedicalFlags] = useState<MedicalHistoryFlag[]>(buildDefaultFlags);
  const [medicationList, setMedicationList] = useState('');
  const [allergyList, setAllergyList] = useState('');
  const [medicalDetails, setMedicalDetails] = useState('');
  const [remarks, setRemarks] = useState('');

  // Existing form id (for updates)
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;
    const existing = loadForm(patientId);
    if (!existing) return;

    setExistingId(existing.id);
    setFirstName(existing.firstName);
    setLastName(existing.lastName);
    setBirthDate(existing.birthDate);
    setGender(existing.gender);
    setPhone(existing.phone);
    setEmail(existing.email);
    setAddress(existing.address);
    setPostalCode(existing.postalCode);
    setCity(existing.city);
    setFitzpatrickType(existing.fitzpatrickType);
    setNaturalTan(existing.naturalTan);
    setSelfTanningCream(existing.selfTanningCream);
    setLastUvExposureDate(existing.lastUvExposureDate);
    setMedicalFlags(existing.medicalFlags);
    setMedicationList(existing.medicationList);
    setAllergyList(existing.allergyList);
    setMedicalDetails(existing.medicalDetails);
    setRemarks(existing.remarks);
  }, [patientId]);

  if (!patientId) {
    return (
      <section className="page-enter flex items-center justify-center px-4 py-24">
        <p className="text-text-light">Patient non spécifié.</p>
      </section>
    );
  }

  function toggleFlag(code: string) {
    setMedicalFlags((prev) =>
      prev.map((f) => (f.code === code ? { ...f, value: !f.value } : f)),
    );
  }

  function updateFlagDetails(code: string, details: string) {
    setMedicalFlags((prev) =>
      prev.map((f) => (f.code === code ? { ...f, details } : f)),
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const now = new Date().toISOString();
    const formData: MedicalIntakeForm = {
      id: existingId ?? crypto.randomUUID(),
      patientId,
      formVersion: FORM_VERSION,
      firstName: sanitize(firstName),
      lastName: sanitize(lastName),
      birthDate,
      gender,
      phone: sanitize(phone),
      email: sanitize(email),
      address: sanitize(address),
      postalCode: sanitize(postalCode),
      city: sanitize(city),
      fitzpatrickType,
      naturalTan,
      selfTanningCream,
      lastUvExposureDate,
      medicalFlags,
      medicationList: sanitize(medicationList),
      allergyList: sanitize(allergyList),
      medicalDetails: sanitize(medicalDetails),
      remarks: sanitize(remarks),
      createdAt: existingId ? (loadForm(patientId)?.createdAt ?? now) : now,
      updatedAt: now,
    };

    saveForm(patientId, formData);
    if (!existingId) setExistingId(formData.id);
    toast.success('Formulaire d\u2019admission enregistré.');
  }

  return (
    <section className="page-enter px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-rose-soft px-3 py-1.5 text-sm text-text-light hover:bg-nude"
          >
            &larr; Retour
          </button>
          <h1 className="font-serif text-2xl font-bold text-text md:text-3xl">
            Formulaire d&apos;admission
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-8">
          {/* ── Section 1: Personal Info ── */}
          <div className="rounded-2xl border border-rose-soft bg-white p-6">
            <h2 className="font-serif text-lg font-semibold text-text">
              1. Informations personnelles
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="intake-lastName" className={labelClasses}>Nom</label>
                <input
                  id="intake-lastName"
                  type="text"
                  required
                  className={inputClasses}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="intake-firstName" className={labelClasses}>Prénom</label>
                <input
                  id="intake-firstName"
                  type="text"
                  required
                  className={inputClasses}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="intake-birthDate" className={labelClasses}>Date de naissance</label>
                <input
                  id="intake-birthDate"
                  type="date"
                  required
                  className={inputClasses}
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="intake-gender" className={labelClasses}>Genre</label>
                <select
                  id="intake-gender"
                  className={inputClasses}
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other')}
                >
                  <option value="female">Femme</option>
                  <option value="male">Homme</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div>
                <label htmlFor="intake-phone" className={labelClasses}>Téléphone</label>
                <input
                  id="intake-phone"
                  type="tel"
                  required
                  className={inputClasses}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="intake-email" className={labelClasses}>E-mail</label>
                <input
                  id="intake-email"
                  type="email"
                  required
                  className={inputClasses}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="intake-address" className={labelClasses}>Adresse</label>
                <input
                  id="intake-address"
                  type="text"
                  className={inputClasses}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="intake-postalCode" className={labelClasses}>Code postal</label>
                <input
                  id="intake-postalCode"
                  type="text"
                  inputMode="numeric"
                  className={inputClasses}
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="intake-city" className={labelClasses}>Ville</label>
                <input
                  id="intake-city"
                  type="text"
                  className={inputClasses}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ── Section 2: Skin Evaluation ── */}
          <div className="rounded-2xl border border-rose-soft bg-white p-6">
            <h2 className="font-serif text-lg font-semibold text-text">
              2. Évaluation de la peau
            </h2>

            <div className="mt-5 flex flex-col gap-5">
              {/* Fitzpatrick */}
              <div>
                <p className={labelClasses}>Phototype Fitzpatrick</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {FITZPATRICK_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                        fitzpatrickType === opt.value
                          ? 'border-primary bg-primary/5'
                          : 'border-rose-soft hover:border-primary-light'
                      }`}
                    >
                      <input
                        type="radio"
                        name="fitzpatrick"
                        value={opt.value}
                        checked={fitzpatrickType === opt.value}
                        onChange={() => setFitzpatrickType(opt.value)}
                        className="mt-0.5 h-5 w-5 shrink-0 accent-primary"
                      />
                      <div>
                        <span className="text-sm font-semibold text-text">{opt.label}</span>
                        <p className="text-xs text-text-light">{opt.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tan / UV */}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-rose-soft p-3 transition-colors hover:border-primary-light">
                  <input
                    type="checkbox"
                    checked={naturalTan}
                    onChange={(e) => setNaturalTan(e.target.checked)}
                    className="h-5 w-5 shrink-0 rounded accent-primary"
                  />
                  <span className="text-sm text-text">Bronzage naturel récent</span>
                </label>

                <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-rose-soft p-3 transition-colors hover:border-primary-light">
                  <input
                    type="checkbox"
                    checked={selfTanningCream}
                    onChange={(e) => setSelfTanningCream(e.target.checked)}
                    className="h-5 w-5 shrink-0 rounded accent-primary"
                  />
                  <span className="text-sm text-text">Crème autobronzante</span>
                </label>
              </div>

              <div className="max-w-xs">
                <label htmlFor="intake-uvDate" className={labelClasses}>
                  Dernière exposition UV
                </label>
                <input
                  id="intake-uvDate"
                  type="date"
                  className={inputClasses}
                  value={lastUvExposureDate}
                  onChange={(e) => setLastUvExposureDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ── Section 3: Medical History ── */}
          <div className="rounded-2xl border border-rose-soft bg-white p-6">
            <h2 className="font-serif text-lg font-semibold text-text">
              3. Antécédents médicaux
            </h2>
            <p className="mt-1 text-xs text-text-light">
              Cochez les éléments qui s&apos;appliquent au patient.
            </p>

            <div className="mt-4 flex flex-col gap-2">
              {medicalFlags.map((flag) => (
                <div key={flag.code}>
                  <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-rose-soft p-3 transition-colors hover:border-primary-light">
                    <input
                      type="checkbox"
                      checked={flag.value}
                      onChange={() => toggleFlag(flag.code)}
                      className="h-5 w-5 shrink-0 rounded accent-primary"
                    />
                    <span className="text-sm text-text">{flag.label}</span>
                  </label>

                  {flag.value && (
                    <div className="ml-8 mt-1 mb-1">
                      <input
                        type="text"
                        placeholder="Précisions (optionnel)..."
                        className={inputClasses}
                        value={flag.details}
                        onChange={(e) => updateFlagDetails(flag.code, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Section 4: Medications & Allergies ── */}
          <div className="rounded-2xl border border-rose-soft bg-white p-6">
            <h2 className="font-serif text-lg font-semibold text-text">
              4. Médicaments et allergies
            </h2>

            <div className="mt-5 flex flex-col gap-4">
              <div>
                <label htmlFor="intake-meds" className={labelClasses}>
                  Médicaments en cours
                </label>
                <textarea
                  id="intake-meds"
                  rows={3}
                  placeholder="Liste des médicaments..."
                  className={inputClasses}
                  value={medicationList}
                  onChange={(e) => setMedicationList(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="intake-allergies" className={labelClasses}>
                  Allergies connues
                </label>
                <textarea
                  id="intake-allergies"
                  rows={3}
                  placeholder="Liste des allergies..."
                  className={inputClasses}
                  value={allergyList}
                  onChange={(e) => setAllergyList(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="intake-medDetails" className={labelClasses}>
                  Détails médicaux supplémentaires
                </label>
                <textarea
                  id="intake-medDetails"
                  rows={3}
                  placeholder="Autres informations médicales pertinentes..."
                  className={inputClasses}
                  value={medicalDetails}
                  onChange={(e) => setMedicalDetails(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ── Section 5: Remarks ── */}
          <div className="rounded-2xl border border-rose-soft bg-white p-6">
            <h2 className="font-serif text-lg font-semibold text-text">
              5. Remarques
            </h2>

            <div className="mt-5">
              <textarea
                id="intake-remarks"
                rows={4}
                placeholder="Remarques, observations..."
                className={inputClasses}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-primary-dark"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
