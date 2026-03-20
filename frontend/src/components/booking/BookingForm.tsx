import { useState, useMemo, useEffect } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';
import { pricingData, epilationCategories, getPricingByCategory } from '@/data/pricing';
import { sendPatientConfirmation, sendOwnerNotification } from '@/services/email';
import { calculateTotalPrice, calculateTotalDuration, formatDuration } from '@/utils/booking';
import type { BookingFormData, PatientProfile, EpilationCategory, AppointmentType } from '@/types';
import BookingCalendar from '@/components/booking/BookingCalendar';
import ProfileSelector from '@/components/booking/ProfileSelector';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(?:\+33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;

function sanitize(value: string): string {
  return value.replace(/[<>]/g, '').trim();
}

type Step = 'type' | 'service' | 'datetime' | 'info' | 'confirm';

const ALL_STEPS: { key: Step; label: string }[] = [
  { key: 'type', label: 'Type' },
  { key: 'service', label: 'Zones' },
  { key: 'datetime', label: 'Créneau' },
  { key: 'info', label: 'Coordonnées' },
  { key: 'confirm', label: 'Confirmation' },
];

export default function BookingForm() {
  const { user, isAuthenticated, addAppointment } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('type');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [appointmentType, setAppointmentType] = useState<AppointmentType | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<PatientProfile | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<EpilationCategory | null>(null);

  // Guest fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-select "Moi-même" profile + pre-fill guest fields
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    setFirstName((prev) => prev || user.firstName);
    setLastName((prev) => prev || user.lastName);
    setEmail((prev) => prev || user.email);
    setPhone((prev) => prev || user.phone);

    if (!selectedProfile && user.profiles?.length) {
      const selfProfile = user.profiles.find((p) => p.id === 'self' || p.relation === 'Moi-même');
      if (selfProfile) setSelectedProfile(selfProfile);
    }
  }, [isAuthenticated, user]);

  const skipInfoStep = isAuthenticated && selectedProfile !== null;
  const isConsultation = appointmentType === 'consultation';
  const needsConsultation = isAuthenticated && user && !user.hasCompletedConsultation;

  // Dynamic step list
  const visibleSteps = useMemo(() => {
    let steps = [...ALL_STEPS];
    // Skip service step for consultation
    if (isConsultation) steps = steps.filter((s) => s.key !== 'service');
    // Skip info step for authenticated users with profile
    if (skipInfoStep) steps = steps.filter((s) => s.key !== 'info');
    return steps;
  }, [isConsultation, skipInfoStep]);

  const totalPrice = useMemo(() => calculateTotalPrice(selectedServices), [selectedServices]);
  const totalDuration = useMemo(() => {
    if (isConsultation) return 30; // consultation = 30 min
    return calculateTotalDuration(selectedServices);
  }, [selectedServices, isConsultation]);

  const categoryItems = useMemo(
    () => selectedCategory ? getPricingByCategory(selectedCategory) : [],
    [selectedCategory],
  );

  const stepIndex = visibleSteps.findIndex((s) => s.key === currentStep);

  function goTo(step: Step) {
    setCurrentStep(step);
  }

  function nextStep() {
    const idx = visibleSteps.findIndex((s) => s.key === currentStep);
    if (idx < visibleSteps.length - 1) {
      setCurrentStep(visibleSteps[idx + 1].key);
    }
  }

  function prevStep() {
    const idx = visibleSteps.findIndex((s) => s.key === currentStep);
    if (idx > 0) {
      setCurrentStep(visibleSteps[idx - 1].key);
    }
  }

  function toggleService(zone: string) {
    setSelectedServices((prev) =>
      prev.includes(zone) ? prev.filter((s) => s !== zone) : [...prev, zone],
    );
  }

  function validateInfo(): boolean {
    if (skipInfoStep) return true;

    const newErrors: Record<string, string> = {};
    if (!sanitize(firstName)) newErrors.firstName = 'Prénom requis.';
    if (!sanitize(lastName)) newErrors.lastName = 'Nom requis.';
    if (!sanitize(email)) {
      newErrors.email = 'E-mail requis.';
    } else if (!EMAIL_REGEX.test(email)) {
      newErrors.email = 'E-mail invalide.';
    }
    if (!sanitize(phone)) {
      newErrors.phone = 'Téléphone requis.';
    } else if (!PHONE_REGEX.test(phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Format français attendu.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (currentStep === 'info' && !validateInfo()) return;

    setIsSubmitting(true);

    const bookingFirstName = skipInfoStep && selectedProfile
      ? selectedProfile.firstName
      : sanitize(firstName);
    const bookingLastName = skipInfoStep && selectedProfile
      ? selectedProfile.lastName
      : sanitize(lastName);

    const data: BookingFormData = {
      firstName: bookingFirstName,
      lastName: bookingLastName,
      email: isAuthenticated ? user?.email ?? '' : sanitize(email),
      phone: skipInfoStep && selectedProfile
        ? selectedProfile.phone
        : sanitize(phone),
      appointmentType: appointmentType ?? 'seance',
      services: isConsultation ? ['Consultation'] : selectedServices,
      date,
      time,
      message: sanitize(message),
      profileId: selectedProfile?.id ?? 'guest',
      totalPrice: isConsultation ? 0 : totalPrice,
      totalDuration,
    };

    try {
      if (isAuthenticated) {
        addAppointment(data);
      }

      await Promise.all([
        sendPatientConfirmation(data),
        sendOwnerNotification(data),
      ]);

      toast.success(
        isConsultation
          ? 'Votre demande de consultation a bien été envoyée !'
          : 'Votre rendez-vous a bien été demandé !',
      );
      goTo('type');
      setAppointmentType(null);
      setSelectedServices([]);
      setDate('');
      setTime('');
      setSelectedProfile(null);
      setSelectedCategory(null);
      setMessage('');
    } catch {
      toast.error('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClasses =
    'w-full rounded-xl border border-rose-soft bg-white px-4 py-3 text-sm text-text placeholder:text-text-light/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200';

  return (
    <div className="flex flex-col gap-8">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {visibleSteps.map((step, i) => {
          const isActive = step.key === currentStep;
          const isDone = i < stepIndex;

          return (
            <div key={step.key} className="flex items-center gap-2">
              {i > 0 && (
                <div className={`h-px w-6 transition-all duration-500 sm:w-10 ${isDone ? 'bg-primary' : 'bg-rose-soft'}`} />
              )}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-500 ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-110'
                      : isDone
                        ? 'bg-primary-light text-primary-dark'
                        : 'bg-nude text-text-light'
                  }`}
                >
                  {isDone ? '\u2713' : i + 1}
                </div>
                <span className="hidden text-[10px] font-semibold text-text-light sm:block">
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {!isAuthenticated && (
        <div className="rounded-xl border border-primary-light/50 bg-gradient-to-r from-nude to-rose-soft/50 p-4 text-sm text-text-light">
          <Link to="/mon-compte" className="font-semibold text-primary-dark underline underline-offset-2">
            Connectez-vous
          </Link>{' '}
          pour réserver plus rapidement et suivre vos rendez-vous.
        </div>
      )}

      {/* Step: Type */}
      {currentStep === 'type' && (
        <div className="step-enter flex flex-col gap-6">
          <h3 className="font-serif text-xl font-semibold text-text">
            Type de rendez-vous
          </h3>

          {isAuthenticated && user && (user.profiles?.length ?? 0) > 0 && (
            <ProfileSelector
              selectedProfileId={selectedProfile?.id ?? ''}
              onSelect={setSelectedProfile}
            />
          )}

          {needsConsultation && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <strong>Première visite&nbsp;?</strong> Une consultation gratuite est obligatoire
              avant toute séance laser. Elle permet d&apos;évaluer votre peau et de définir
              un protocole adapté.
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setAppointmentType('consultation')}
              className={`flex flex-col gap-2 rounded-xl p-6 text-left transition-all duration-300 ${
                appointmentType === 'consultation'
                  ? 'border-2 border-primary bg-rose-soft/50 shadow-lg shadow-primary/10'
                  : 'border border-rose-soft bg-white hover:-translate-y-0.5 hover:border-primary-light hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-serif text-lg font-semibold text-text">Consultation</span>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                  Gratuit
                </span>
              </div>
              <p className="text-sm text-text-light">
                Première visite pour évaluer votre peau et définir un protocole adapté.
                Durée : environ 30 min.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                if (needsConsultation) {
                  toast.info('Une consultation est recommandée avant votre première séance.');
                }
                setAppointmentType('seance');
              }}
              className={`flex flex-col gap-2 rounded-xl p-6 text-left transition-all duration-300 ${
                appointmentType === 'seance'
                  ? 'border-2 border-primary bg-rose-soft/50 shadow-lg shadow-primary/10'
                  : 'border border-rose-soft bg-white hover:-translate-y-0.5 hover:border-primary-light hover:shadow-md'
              } ${needsConsultation ? 'relative' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-serif text-lg font-semibold text-text">Séance laser</span>
                <span className="rounded-full bg-nude px-3 py-1 text-xs font-bold text-primary-dark">
                  Selon zones
                </span>
              </div>
              <p className="text-sm text-text-light">
                Séance d&apos;épilation laser. Sélectionnez une ou plusieurs zones à traiter.
              </p>
              {needsConsultation && (
                <span className="text-xs text-amber-600">
                  * Consultation recommandée avant première séance
                </span>
              )}
            </button>
          </div>

          <button
            type="button"
            disabled={!appointmentType}
            onClick={nextStep}
            className="self-end rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continuer
          </button>
        </div>
      )}

      {/* Step: Service (multi-zone) — skipped for consultation */}
      {currentStep === 'service' && (
        <div className="step-enter flex flex-col gap-6">
          <h3 className="font-serif text-xl font-semibold text-text">
            Choisissez vos zones
          </h3>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                selectedCategory === null
                  ? 'bg-primary text-white shadow-md'
                  : 'border border-rose-soft bg-white text-text-light hover:border-primary-light'
              }`}
            >
              Toutes
            </button>
            {epilationCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white shadow-md'
                    : 'border border-rose-soft bg-white text-text-light hover:border-primary-light'
                }`}
              >
                <span className="mr-1.5" aria-hidden="true">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Zone selection (multi) */}
          <div className="grid gap-3 sm:grid-cols-2">
            {(selectedCategory ? categoryItems : pricingData).map((item) => {
              const isSelected = selectedServices.includes(item.zone);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleService(item.zone)}
                  className={`flex items-center justify-between rounded-xl px-5 py-4 text-left transition-all duration-300 ${
                    isSelected
                      ? 'border-2 border-primary bg-rose-soft/50 shadow-lg shadow-primary/10'
                      : 'border border-rose-soft bg-white hover:-translate-y-0.5 hover:border-primary-light hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-text">{item.zone}</span>
                    <span className="text-xs text-text-light">
                      {item.duration} min
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-nude px-3 py-1 text-sm font-bold text-primary-dark">
                      {item.price}&euro;
                    </span>
                    {isSelected && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white">
                        ✓
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Live total */}
          {selectedServices.length > 0 && (
            <div className="rounded-xl border border-primary-light/50 bg-gradient-to-r from-nude to-rose-soft/30 p-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-text">
                    {selectedServices.length} zone{selectedServices.length > 1 ? 's' : ''} sélectionnée{selectedServices.length > 1 ? 's' : ''}
                  </span>
                  <span className="text-text-light">
                    Durée estimée : {formatDuration(totalDuration)}
                  </span>
                </div>
                <span className="text-xl font-bold text-primary-dark">
                  {totalPrice}&euro;
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={prevStep}
              className="rounded-full border border-rose-soft px-6 py-3 text-sm font-medium text-text-light transition-all duration-300 hover:bg-nude hover:shadow-sm"
            >
              Retour
            </button>
            <button
              type="button"
              disabled={selectedServices.length === 0}
              onClick={nextStep}
              className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continuer
            </button>
          </div>
        </div>
      )}

      {/* Step: Date & Time */}
      {currentStep === 'datetime' && (
        <div className="step-enter flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl font-semibold text-text">
              Choisissez votre créneau
            </h3>
            <span className="rounded-full bg-gradient-to-r from-nude to-rose-soft/50 px-4 py-1.5 text-sm font-semibold text-primary-dark shadow-sm">
              {isConsultation ? 'Consultation — Gratuit' : `${formatDuration(totalDuration)} — ${totalPrice}\u20ac`}
            </span>
          </div>

          <BookingCalendar
            selectedDate={date}
            selectedTime={time}
            onSelectDate={setDate}
            onSelectTime={setTime}
          />

          <div className="flex justify-between">
            <button
              type="button"
              onClick={prevStep}
              className="rounded-full border border-rose-soft px-6 py-3 text-sm font-medium text-text-light transition-all duration-300 hover:bg-nude hover:shadow-sm"
            >
              Retour
            </button>
            <button
              type="button"
              disabled={!date || !time}
              onClick={nextStep}
              className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continuer
            </button>
          </div>
        </div>
      )}

      {/* Step: Info (guests only) */}
      {currentStep === 'info' && (
        <div className="step-enter flex flex-col gap-6">
          <h3 className="font-serif text-xl font-semibold text-text">
            Vos coordonnées
          </h3>

          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="book-firstName" className="mb-1.5 block text-sm font-medium text-text">
                  Prénom
                </label>
                <input
                  id="book-firstName"
                  type="text"
                  required
                  autoComplete="given-name"
                  className={inputClasses}
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); setErrors((p) => ({ ...p, firstName: '' })); }}
                />
                {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
              </div>
              <div>
                <label htmlFor="book-lastName" className="mb-1.5 block text-sm font-medium text-text">
                  Nom
                </label>
                <input
                  id="book-lastName"
                  type="text"
                  required
                  autoComplete="family-name"
                  className={inputClasses}
                  value={lastName}
                  onChange={(e) => { setLastName(e.target.value); setErrors((p) => ({ ...p, lastName: '' })); }}
                />
                {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="book-email" className="mb-1.5 block text-sm font-medium text-text">
                E-mail
              </label>
              <input
                id="book-email"
                type="email"
                required
                autoComplete="email"
                className={inputClasses}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="book-phone" className="mb-1.5 block text-sm font-medium text-text">
                Téléphone
              </label>
              <input
                id="book-phone"
                type="tel"
                required
                autoComplete="tel"
                className={inputClasses}
                placeholder="06 12 34 56 78"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: '' })); }}
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
            </div>

            <div>
              <label htmlFor="book-message" className="mb-1.5 block text-sm font-medium text-text">
                Message <span className="font-normal text-text-light">(optionnel)</span>
              </label>
              <textarea
                id="book-message"
                rows={3}
                className={inputClasses}
                placeholder="Informations complémentaires..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={prevStep}
              className="rounded-full border border-rose-soft px-6 py-3 text-sm font-medium text-text-light transition-all duration-300 hover:bg-nude hover:shadow-sm"
            >
              Retour
            </button>
            <button
              type="button"
              onClick={() => { if (validateInfo()) goTo('confirm'); }}
              className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-lg"
            >
              Continuer
            </button>
          </div>
        </div>
      )}

      {/* Step: Confirm */}
      {currentStep === 'confirm' && (
        <form onSubmit={handleSubmit} className="step-enter flex flex-col gap-6">
          <h3 className="font-serif text-xl font-semibold text-text">
            Récapitulatif
          </h3>

          <div className="overflow-hidden rounded-2xl border border-primary-light/50 bg-gradient-to-br from-nude to-rose-soft/30">
            <div className="flex flex-col gap-0 divide-y divide-primary-light/30">
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-text-light">Type</span>
                <span className="font-semibold text-text">
                  {isConsultation ? 'Consultation (gratuite)' : 'Séance laser'}
                </span>
              </div>
              {!isConsultation && (
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="text-sm text-text-light">Zones</span>
                  <span className="font-semibold text-text text-right">
                    {selectedServices.join(', ')}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-text-light">Durée estimée</span>
                <span className="font-semibold text-text">{formatDuration(totalDuration)}</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-text-light">Tarif</span>
                <span className="rounded-full bg-primary/10 px-3 py-0.5 font-bold text-primary-dark">
                  {isConsultation ? 'Gratuit' : `${totalPrice}\u20ac`}
                </span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-text-light">Date</span>
                <span className="font-semibold text-text">
                  {new Date(date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-text-light">Heure</span>
                <span className="font-semibold text-text">{time}</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-text-light">Patient</span>
                <span className="font-semibold text-text">
                  {skipInfoStep && selectedProfile
                    ? `${selectedProfile.firstName} ${selectedProfile.lastName}`
                    : `${firstName} ${lastName}`}
                  {skipInfoStep && selectedProfile && selectedProfile.relation !== 'Moi-même' && (
                    <span className="ml-1.5 text-xs font-normal text-text-light">
                      ({selectedProfile.relation})
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {isAuthenticated && (
            <div>
              <label htmlFor="confirm-message" className="mb-1.5 block text-sm font-medium text-text">
                Message <span className="font-normal text-text-light">(optionnel)</span>
              </label>
              <textarea
                id="confirm-message"
                rows={2}
                className={inputClasses}
                placeholder="Informations complémentaires..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          )}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={prevStep}
              className="rounded-full border border-rose-soft px-6 py-3 text-sm font-medium text-text-light transition-all duration-300 hover:bg-nude hover:shadow-sm"
            >
              Retour
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Envoi en cours...' : 'Confirmer le rendez-vous'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
