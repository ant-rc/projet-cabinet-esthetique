import { useState, useMemo } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { getServicesByGender, getServicesByGenderAndCategory, getCategoriesForGender } from '@/data/pricing';
import { calculateTotalPrice, calculateTotalDuration, formatDuration } from '@/utils/booking';
import { formatDateDisplay } from '@/utils/date';
import type { Gender, ServiceCategory, BookingMode } from '@/types';
import BookingCalendar from '@/components/booking/BookingCalendar';

type Step = 'gender' | 'service' | 'datetime' | 'info' | 'confirm';

const ALL_STEPS: { key: Step; label: string }[] = [
  { key: 'gender', label: 'Profil' },
  { key: 'service', label: 'Zones' },
  { key: 'datetime', label: 'Créneau' },
  { key: 'info', label: 'Coordonnées' },
  { key: 'confirm', label: 'Confirmation' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(?:(?:\+|00)33[\s.-]?|0)[1-9](?:[\s.-]?\d{2}){4}$/;

function sanitize(value: string): string {
  return value.replace(/[<>]/g, '').trim();
}

export default function BookingForm() {
  const { isAuthenticated, session } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('gender');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Booking mode
  const [bookingMode, setBookingMode] = useState<BookingMode | null>(
    isAuthenticated ? 'authenticated' : null,
  );

  // Gender & type
  const [gender, setGender] = useState<Gender | null>(null);
  const [isFirstConsultation, setIsFirstConsultation] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // Guest info
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestMessage, setGuestMessage] = useState('');
  const [infoErrors, setInfoErrors] = useState<Record<string, string>>({});

  const categories = useMemo(
    () => gender ? getCategoriesForGender(gender) : [],
    [gender],
  );

  const services = useMemo(() => {
    if (!gender) return [];
    if (selectedCategory) return getServicesByGenderAndCategory(gender, selectedCategory);
    return getServicesByGender(gender);
  }, [gender, selectedCategory]);

  const totalPrice = useMemo(
    () => isFirstConsultation ? 0 : calculateTotalPrice(selectedServiceIds),
    [selectedServiceIds, isFirstConsultation],
  );

  const totalDuration = useMemo(
    () => isFirstConsultation ? 30 : calculateTotalDuration(selectedServiceIds),
    [selectedServiceIds, isFirstConsultation],
  );

  // Build visible steps based on mode
  const visibleSteps = useMemo(() => {
    let steps = ALL_STEPS;
    if (isFirstConsultation) steps = steps.filter((s) => s.key !== 'service');
    if (bookingMode !== 'guest') steps = steps.filter((s) => s.key !== 'info');
    return steps;
  }, [isFirstConsultation, bookingMode]);

  const stepIndex = visibleSteps.findIndex((s) => s.key === currentStep);

  function nextStep() {
    const idx = visibleSteps.findIndex((s) => s.key === currentStep);
    if (idx < visibleSteps.length - 1) setCurrentStep(visibleSteps[idx + 1].key);
  }

  function prevStep() {
    const idx = visibleSteps.findIndex((s) => s.key === currentStep);
    if (idx > 0) setCurrentStep(visibleSteps[idx - 1].key);
  }

  function toggleService(id: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  const selectedServiceNames = useMemo(() => {
    if (!gender) return [];
    const all = getServicesByGender(gender);
    return selectedServiceIds.map((id) => all.find((s) => s.id === id)?.name ?? id);
  }, [gender, selectedServiceIds]);

  function validateGuestInfo(): boolean {
    const errors: Record<string, string> = {};
    const firstName = sanitize(guestFirstName);
    const lastName = sanitize(guestLastName);
    const phone = sanitize(guestPhone);
    const email = sanitize(guestEmail);

    if (!firstName) errors.firstName = 'Le prénom est requis.';
    if (!lastName) errors.lastName = 'Le nom est requis.';
    if (!phone) {
      errors.phone = 'Le téléphone est requis.';
    } else if (!PHONE_REGEX.test(phone)) {
      errors.phone = 'Format de téléphone invalide.';
    }
    if (!email) {
      errors.email = 'L\'e-mail est requis.';
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = 'Format d\'e-mail invalide.';
    }

    setInfoErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleInfoNext() {
    if (validateGuestInfo()) {
      nextStep();
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const isGuest = bookingMode === 'guest';

    if (!isGuest && (!isAuthenticated || !session?.user)) {
      toast.error('Veuillez vous connecter pour réserver.');
      return;
    }

    setIsSubmitting(true);
    try {
      const guestNotes = isGuest
        ? JSON.stringify({
          booking_mode: 'guest',
          guest_first_name: sanitize(guestFirstName),
          guest_last_name: sanitize(guestLastName),
          guest_phone: sanitize(guestPhone),
          guest_email: sanitize(guestEmail),
          guest_message: sanitize(guestMessage),
        })
        : null;

      if (isFirstConsultation) {
        const { error } = await supabase.from('appointments').insert({
          user_id: isGuest ? null : session!.user.id,
          service_id: null,
          date,
          time,
          status: 'confirmed',
          is_first_consultation: true,
          notes: guestNotes,
        });
        if (error) throw error;
      } else {
        const inserts = selectedServiceIds.map((serviceId) => ({
          user_id: isGuest ? null : session!.user.id,
          service_id: serviceId,
          date,
          time,
          status: 'confirmed',
          is_first_consultation: false,
          notes: guestNotes,
        }));
        const { error } = await supabase.from('appointments').insert(inserts);
        if (error) throw error;
      }

      toast.success(
        isFirstConsultation
          ? 'Votre consultation a été réservée !'
          : 'Votre rendez-vous a été confirmé !',
      );

      // Reset form
      setCurrentStep('gender');
      setBookingMode(isAuthenticated ? 'authenticated' : null);
      setGender(null);
      setIsFirstConsultation(false);
      setSelectedServiceIds([]);
      setSelectedCategory(null);
      setDate('');
      setTime('');
      setGuestFirstName('');
      setGuestLastName('');
      setGuestPhone('');
      setGuestEmail('');
      setGuestMessage('');
      setInfoErrors({});
    } catch {
      toast.error('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClasses = 'w-full rounded-xl border border-rose-soft bg-white px-4 py-3 text-sm text-text placeholder:text-text-light/50 transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

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
                  {isDone ? '✓' : i + 1}
                </div>
                <span className="hidden text-[10px] font-semibold text-text-light sm:block">{step.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step: Gender + Type */}
      {currentStep === 'gender' && (
        <div className="step-enter flex flex-col gap-6">
          {/* Auth choice for non-authenticated users */}
          {!isAuthenticated && bookingMode === null && (
            <div className="flex flex-col gap-4">
              <h3 className="font-serif text-xl font-semibold text-text">Comment souhaitez-vous réserver ?</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Link
                  to="/login"
                  className="flex flex-col gap-2 rounded-xl border border-rose-soft bg-white p-6 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-light hover:shadow-md"
                >
                  <span className="font-serif text-lg font-semibold text-text">Se connecter / S&apos;inscrire</span>
                  <p className="text-sm text-text-light">
                    Suivez vos rendez-vous et gérez votre historique.
                  </p>
                </Link>
                <button
                  type="button"
                  onClick={() => setBookingMode('guest')}
                  className="flex flex-col gap-2 rounded-xl border border-rose-soft bg-white p-6 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-light hover:shadow-md"
                >
                  <span className="font-serif text-lg font-semibold text-text">Continuer sans compte</span>
                  <p className="text-sm text-text-light">
                    Réservez rapidement en renseignant vos coordonnées.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Gender + Type selection (shown when mode is chosen or user is authenticated) */}
          {(isAuthenticated || bookingMode !== null) && (
            <>
              <h3 className="font-serif text-xl font-semibold text-text">Votre profil</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`flex flex-col gap-2 rounded-xl p-6 text-left transition-all duration-300 ${
                    gender === 'female'
                      ? 'border-2 border-primary bg-rose-soft/50 shadow-lg shadow-primary/10'
                      : 'border border-rose-soft bg-white hover:-translate-y-0.5 hover:border-primary-light hover:shadow-md'
                  }`}
                >
                  <span className="font-serif text-lg font-semibold text-text">Femme</span>
                  <p className="text-sm text-text-light">Tarifs et zones adaptés</p>
                </button>
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`flex flex-col gap-2 rounded-xl p-6 text-left transition-all duration-300 ${
                    gender === 'male'
                      ? 'border-2 border-primary bg-rose-soft/50 shadow-lg shadow-primary/10'
                      : 'border border-rose-soft bg-white hover:-translate-y-0.5 hover:border-primary-light hover:shadow-md'
                  }`}
                >
                  <span className="font-serif text-lg font-semibold text-text">Homme</span>
                  <p className="text-sm text-text-light">Tarifs et zones adaptés</p>
                </button>
              </div>

              {gender && (
                <div className="step-enter">
                  <h3 className="font-serif text-xl font-semibold text-text">Type de rendez-vous</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setIsFirstConsultation(true)}
                      className={`flex flex-col gap-2 rounded-xl p-6 text-left transition-all duration-300 ${
                        isFirstConsultation
                          ? 'border-2 border-primary bg-rose-soft/50 shadow-lg shadow-primary/10'
                          : 'border border-rose-soft bg-white hover:-translate-y-0.5 hover:border-primary-light hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-serif text-lg font-semibold text-text">Consultation</span>
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">Gratuit</span>
                      </div>
                      <p className="text-sm text-text-light">
                        Première visite : évaluation de peau + tir d&apos;essai. Durée : 30 min.
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFirstConsultation(false)}
                      className={`flex flex-col gap-2 rounded-xl p-6 text-left transition-all duration-300 ${
                        !isFirstConsultation && gender
                          ? 'border-2 border-primary bg-rose-soft/50 shadow-lg shadow-primary/10'
                          : 'border border-rose-soft bg-white hover:-translate-y-0.5 hover:border-primary-light hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-serif text-lg font-semibold text-text">Séance laser</span>
                        <span className="rounded-full bg-nude px-3 py-1 text-xs font-bold text-primary-dark">Selon zones</span>
                      </div>
                      <p className="text-sm text-text-light">
                        Sélectionnez une ou plusieurs zones à traiter.
                      </p>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                {!isAuthenticated && bookingMode === 'guest' && (
                  <button
                    type="button"
                    onClick={() => { setBookingMode(null); setGender(null); }}
                    className="rounded-full border border-rose-soft px-6 py-3 text-sm font-medium text-text-light transition-all duration-300 hover:bg-nude hover:shadow-sm"
                  >
                    Retour
                  </button>
                )}
                <button
                  type="button"
                  disabled={!gender}
                  onClick={nextStep}
                  className="ml-auto rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continuer
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step: Service (multi-zone) */}
      {currentStep === 'service' && gender && (
        <div className="step-enter flex flex-col gap-6">
          <h3 className="font-serif text-xl font-semibold text-text">Choisissez vos zones</h3>

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
            {categories.map((cat) => (
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
                {cat.label}
              </button>
            ))}
          </div>

          {/* Zone selection */}
          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((item) => {
              const isSelected = selectedServiceIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleService(item.id)}
                  className={`flex items-center justify-between rounded-xl px-5 py-4 text-left transition-all duration-300 ${
                    isSelected
                      ? 'border-2 border-primary bg-rose-soft/50 shadow-lg shadow-primary/10'
                      : 'border border-rose-soft bg-white hover:-translate-y-0.5 hover:border-primary-light hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-text">{item.name}</span>
                    <span className="text-xs text-text-light">{item.duration} min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-nude px-3 py-1 text-sm font-bold text-primary-dark">{item.price}&euro;</span>
                    {isSelected && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white">{'✓'}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Live total */}
          {selectedServiceIds.length > 0 && (
            <div className="rounded-xl border border-primary-light/50 bg-gradient-to-r from-nude to-rose-soft/30 p-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-text">
                    {selectedServiceIds.length} zone{selectedServiceIds.length > 1 ? 's' : ''} sélectionnée{selectedServiceIds.length > 1 ? 's' : ''}
                  </span>
                  <span className="text-text-light">Durée estimée : {formatDuration(totalDuration)}</span>
                </div>
                <span className="text-xl font-bold text-primary-dark">{totalPrice}&euro;</span>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button type="button" onClick={prevStep} className="rounded-full border border-rose-soft px-6 py-3 text-sm font-medium text-text-light transition-all duration-300 hover:bg-nude hover:shadow-sm">
              Retour
            </button>
            <button
              type="button"
              disabled={selectedServiceIds.length === 0}
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
            <h3 className="font-serif text-xl font-semibold text-text">Choisissez votre créneau</h3>
            <span className="rounded-full bg-gradient-to-r from-nude to-rose-soft/50 px-4 py-1.5 text-sm font-semibold text-primary-dark shadow-sm">
              {isFirstConsultation ? 'Consultation — Gratuit' : `${formatDuration(totalDuration)} — ${totalPrice}€`}
            </span>
          </div>

          <BookingCalendar
            selectedDate={date}
            selectedTime={time}
            durationMinutes={totalDuration}
            onSelectDate={setDate}
            onSelectTime={setTime}
          />

          <div className="flex justify-between">
            <button type="button" onClick={prevStep} className="rounded-full border border-rose-soft px-6 py-3 text-sm font-medium text-text-light transition-all duration-300 hover:bg-nude hover:shadow-sm">
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

      {/* Step: Guest info */}
      {currentStep === 'info' && bookingMode === 'guest' && (
        <div className="step-enter flex flex-col gap-6">
          <h3 className="font-serif text-xl font-semibold text-text">Vos coordonnées</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="guest-first-name" className="text-sm font-medium text-text">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                id="guest-first-name"
                type="text"
                value={guestFirstName}
                onChange={(e) => setGuestFirstName(e.target.value)}
                placeholder="Votre prénom"
                className={inputClasses}
              />
              {infoErrors.firstName && (
                <span className="text-xs text-red-500">{infoErrors.firstName}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="guest-last-name" className="text-sm font-medium text-text">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                id="guest-last-name"
                type="text"
                value={guestLastName}
                onChange={(e) => setGuestLastName(e.target.value)}
                placeholder="Votre nom"
                className={inputClasses}
              />
              {infoErrors.lastName && (
                <span className="text-xs text-red-500">{infoErrors.lastName}</span>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="guest-phone" className="text-sm font-medium text-text">
                Téléphone <span className="text-red-500">*</span>
              </label>
              <input
                id="guest-phone"
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="06 12 34 56 78"
                className={inputClasses}
              />
              {infoErrors.phone && (
                <span className="text-xs text-red-500">{infoErrors.phone}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="guest-email" className="text-sm font-medium text-text">
                E-mail <span className="text-red-500">*</span>
              </label>
              <input
                id="guest-email"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="votre@email.com"
                className={inputClasses}
              />
              {infoErrors.email && (
                <span className="text-xs text-red-500">{infoErrors.email}</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="guest-message" className="text-sm font-medium text-text">
              Message <span className="text-xs text-text-light">(optionnel)</span>
            </label>
            <textarea
              id="guest-message"
              value={guestMessage}
              onChange={(e) => setGuestMessage(e.target.value)}
              placeholder="Informations complémentaires..."
              rows={3}
              className={inputClasses}
            />
          </div>

          <div className="flex justify-between">
            <button type="button" onClick={prevStep} className="rounded-full border border-rose-soft px-6 py-3 text-sm font-medium text-text-light transition-all duration-300 hover:bg-nude hover:shadow-sm">
              Retour
            </button>
            <button
              type="button"
              onClick={handleInfoNext}
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
          <h3 className="font-serif text-xl font-semibold text-text">Récapitulatif</h3>

          <div className="overflow-hidden rounded-2xl border border-primary-light/50 bg-gradient-to-br from-nude to-rose-soft/30">
            <div className="flex flex-col gap-0 divide-y divide-primary-light/30">
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-text-light">Type</span>
                <span className="font-semibold text-text">
                  {isFirstConsultation ? 'Consultation (gratuite)' : 'Séance laser'}
                </span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-text-light">Profil</span>
                <span className="font-semibold text-text">{gender === 'female' ? 'Femme' : 'Homme'}</span>
              </div>
              {!isFirstConsultation && (
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="text-sm text-text-light">Zones</span>
                  <span className="text-right font-semibold text-text">{selectedServiceNames.join(', ')}</span>
                </div>
              )}
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-text-light">Durée estimée</span>
                <span className="font-semibold text-text">{formatDuration(totalDuration)}</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-text-light">Tarif</span>
                <span className="rounded-full bg-primary/10 px-3 py-0.5 font-bold text-primary-dark">
                  {isFirstConsultation ? 'Gratuit' : `${totalPrice}€`}
                </span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-text-light">Date</span>
                <span className="font-semibold text-text">
                  {formatDateDisplay(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-text-light">Heure</span>
                <span className="font-semibold text-text">{time}</span>
              </div>
              {bookingMode === 'guest' && (
                <>
                  <div className="flex items-center justify-between px-6 py-4">
                    <span className="text-sm text-text-light">Nom</span>
                    <span className="font-semibold text-text">{sanitize(guestFirstName)} {sanitize(guestLastName)}</span>
                  </div>
                  <div className="flex items-center justify-between px-6 py-4">
                    <span className="text-sm text-text-light">Téléphone</span>
                    <span className="font-semibold text-text">{sanitize(guestPhone)}</span>
                  </div>
                  <div className="flex items-center justify-between px-6 py-4">
                    <span className="text-sm text-text-light">E-mail</span>
                    <span className="font-semibold text-text">{sanitize(guestEmail)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-between">
            <button type="button" onClick={prevStep} className="rounded-full border border-rose-soft px-6 py-3 text-sm font-medium text-text-light transition-all duration-300 hover:bg-nude hover:shadow-sm">
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
