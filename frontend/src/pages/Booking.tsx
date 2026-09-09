import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { InlineWidget, useCalendlyEventListener } from 'react-calendly';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import Seo from '@/components/Seo';
import { staticMeta } from '@/lib/pageMeta';
import { supabase } from '@/lib/supabase';
import { getServicesByGender, getServicesByGenderAndCategory, getCategoriesForGender, getServiceById, centerInfo } from '@/data/pricing';
import { calculateTotalPrice, calculateTotalDuration, formatDuration } from '@/utils/booking';
import {
  getCalendlyEventUrl,
  buildCalendlyUtm,
  exceedsOnlineBooking,
  slotsForDuration,
  CONSULTATION_MINUTES,
} from '@/data/calendly';
import { HOURS_SUMMARY } from '@/data/openingHours';
import type { Gender, ServiceCategory } from '@/types';

const REASSURANCE_ITEMS = [
  {
    title: 'Consultation gratuite',
    description: 'Première consultation offerte pour évaluer votre peau.',
  },
  {
    title: 'Confirmation immédiate',
    description: 'Recevez un e-mail de confirmation dès votre réservation.',
  },
  {
    title: 'Rappels automatiques',
    description: 'Rappels par e-mail avant votre rendez-vous.',
  },
];

export default function Booking() {
  const { profile, dbUser, isAuthenticated, session } = useAuth();
  const { ref, isVisible } = useScrollReveal();
  const calendarRef = useRef<HTMLDivElement>(null);

  const [gender, setGender] = useState<Gender | null>(null);
  const [isConsultation, setIsConsultation] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

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
    () => isConsultation ? 0 : calculateTotalPrice(selectedServiceIds),
    [selectedServiceIds, isConsultation],
  );

  const totalDuration = useMemo(
    () => isConsultation ? CONSULTATION_MINUTES : calculateTotalDuration(selectedServiceIds),
    [selectedServiceIds, isConsultation],
  );

  /**
   * Créneaux réellement occupés, arrondis au pas supérieur de la grille.
   * C'est cette valeur qui détermine le type d'événement Calendly réservé.
   */
  const bookedSlots = useMemo(
    () => isConsultation ? 1 : slotsForDuration(totalDuration),
    [isConsultation, totalDuration],
  );

  const tooLongForOnline = useMemo(
    () => !isConsultation && selectedServiceIds.length > 0 && exceedsOnlineBooking(totalDuration),
    [isConsultation, selectedServiceIds, totalDuration],
  );

  const selectedServiceNames = useMemo(() => {
    return selectedServiceIds.map((id) => getServiceById(id)?.name ?? '').filter(Boolean);
  }, [selectedServiceIds]);

  const calendlyUrl = useMemo(
    () => getCalendlyEventUrl(totalDuration, isConsultation),
    [totalDuration, isConsultation],
  );

  /**
   * Préremplissage du formulaire Calendly.
   *
   * Les zones sélectionnées ne peuvent vivre ni dans le nom du type
   * d'événement ni dans son adresse : un même type sert toutes les
   * combinaisons de zones, et ces champs sont fixes. Le formulaire est le seul
   * endroit qui varie d'une réservation à l'autre, donc le seul qui puisse les
   * porter jusqu'à l'agenda.
   *
   * `customAnswers.aN` vise la **Nième question personnalisée** du type
   * réservé, dans l'ordre où elle apparaît dans le tableau de bord. L'ordre
   * n'est pas le même partout, et il fait partie du contrat :
   *
   *   consultation  a1 = téléphone
   *   seance-*      a1 = zones à traiter, a2 = téléphone
   *
   * L'API Calendly ne permet pas de créer ces questions — elle accepte la
   * requête et ignore le champ — elles se règlent donc dans le tableau de bord.
   * Déplacer ou supprimer l'une d'elles décale les réponses sans rien casser
   * de visible : la zone atterrirait dans le champ téléphone.
   *
   * Une réponse envoyée à une question inexistante est ignorée par Calendly,
   * sans erreur : préremplir a2 avant que le champ téléphone existe n'a donc
   * aucun effet, et n'attend rien d'autre que sa création.
   */
  const calendlyPrefill = useMemo(() => {
    const identity = profile && dbUser
      ? {
          name: `${profile.first_name} ${profile.last_name}`.trim(),
          email: dbUser.email,
          firstName: profile.first_name,
          lastName: profile.last_name,
        }
      : {};

    const phone = profile?.phone ?? '';
    const zones = selectedServiceNames.length > 0
      ? `Zones : ${selectedServiceNames.join(', ')} (${formatDuration(totalDuration)})`
      : '';

    const customAnswers: Record<string, string> = isConsultation
      ? (phone ? { a1: phone } : {})
      : {
          ...(zones ? { a1: zones } : {}),
          ...(phone ? { a2: phone } : {}),
        };

    return Object.keys(customAnswers).length > 0
      ? { ...identity, customAnswers }
      : identity;
  }, [profile, dbUser, isConsultation, selectedServiceNames, totalDuration]);

  const calendlyUtm = useMemo(
    () => buildCalendlyUtm(
      isConsultation ? ['Consultation'] : selectedServiceNames,
      totalPrice,
      totalDuration,
    ),
    [isConsultation, selectedServiceNames, totalPrice, totalDuration],
  );

  function toggleService(id: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  const canBook = isConsultation || selectedServiceIds.length > 0;

  // Scroll to calendar when shown
  useEffect(() => {
    if (showCalendar && calendarRef.current) {
      calendarRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showCalendar]);

  /**
   * Lit l'événement réellement créé côté Calendly, via l'Edge Function qui garde
   * le jeton d'accès côté serveur.
   *
   * L'heure de fin est la seule mesure fiable de ce que l'agenda a bloqué : la
   * durée théorique du panier peut différer du type d'événement réservé.
   */
  async function fetchEventDetails(
    eventUri: string,
  ): Promise<{ date: string; time: string; durationMinutes: number } | null> {
    if (!eventUri) return null;
    try {
      const eventId = eventUri.split('/').pop();
      const { data, error } = await supabase.functions.invoke(`calendly-events?eventId=${eventId}`, {
        method: 'GET',
      });
      if (error) return null;
      const evt = (data as { event?: { startTime?: string; endTime?: string } })?.event;
      if (!evt?.startTime) return null;
      const start = new Date(evt.startTime);
      const end = evt.endTime ? new Date(evt.endTime) : null;
      return {
        date: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`,
        time: `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
        durationMinutes: end ? Math.round((end.getTime() - start.getTime()) / 60000) : 0,
      };
    } catch {
      return null;
    }
  }

  // Listen for Calendly booking confirmation
  useCalendlyEventListener({
    onEventScheduled: useCallback(async (e: { data: { payload?: { event?: { uri?: string } } } }) => {
      toast.success(
        isConsultation
          ? 'Consultation réservée ! Vérifiez votre e-mail.'
          : 'Rendez-vous confirmé ! Vérifiez votre e-mail.',
      );

      // Fetch real date/time/duration from Calendly API
      const eventUri = e.data?.payload?.event?.uri ?? '';
      const slot = await fetchEventDetails(eventUri);

      const realDate = slot?.date ?? (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; })();
      const realTime = slot?.time ?? (() => { const n = new Date(); return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`; })();

      // Repli sur la durée du panier si l'appel à Calendly échoue : mieux vaut une
      // durée théorique qu'une colonne vide, qui rendrait le rendez-vous invisible
      // à tout calcul de chevauchement.
      const bookedDuration = slot?.durationMinutes || totalDuration;

      // Save to Supabase if authenticated
      if (isAuthenticated && session?.user) {
        if (isConsultation) {
          await supabase.from('appointments').insert({
            user_id: session.user.id,
            service_id: null,
            date: realDate,
            time: realTime,
            status: 'confirmed',
            is_first_consultation: true,
            notes: 'Booked via Calendly',
            duration_minutes: bookedDuration,
            calendly_event_uri: eventUri || null,
          });
        } else {
          // Une ligne par zone, mais un seul rendez-vous : la durée portée par
          // chaque ligne est celle du groupe entier, et calendly_event_uri permet
          // de les regrouper. Sommer les durées des lignes compterait double.
          const inserts = selectedServiceIds.map((serviceId) => ({
            user_id: session.user.id,
            service_id: serviceId,
            date: realDate,
            time: realTime,
            status: 'confirmed',
            is_first_consultation: false,
            notes: `Booked via Calendly: ${selectedServiceNames.join(', ')}`,
            duration_minutes: bookedDuration,
            calendly_event_uri: eventUri || null,
          }));
          await supabase.from('appointments').insert(inserts);
        }
      }

      // Reset
      setShowCalendar(false);
      setGender(null);
      setIsConsultation(false);
      setSelectedServiceIds([]);
      setSelectedCategory(null);
    }, [isAuthenticated, session, isConsultation, selectedServiceIds, selectedServiceNames, totalDuration]),
  });

  return (
    <section className="page-enter px-4 py-16 lg:px-8 lg:py-24">
      <Seo {...staticMeta('/reservation')} />
      <div className="mx-auto max-w-3xl">
        <h1 className="text-center font-serif text-3xl font-bold text-text md:text-4xl">
          Prendre rendez-vous
        </h1>
        <p className="mt-4 text-center text-base text-text-light">
          Choisissez votre prestation puis réservez votre créneau en quelques clics.
        </p>

        {/* Reassurance */}
        <div
          ref={ref}
          className={`reveal-stagger ${isVisible ? 'visible' : ''} mt-8 grid gap-4 sm:grid-cols-3`}
        >
          {REASSURANCE_ITEMS.map((item) => (
            <div key={item.title} className="card-hover rounded-2xl border border-primary-light/50 bg-white p-5 text-center">
              <h3 className="text-sm font-bold text-text">{item.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-text-light">{item.description}</p>
            </div>
          ))}
        </div>

        {!showCalendar ? (
          <>
            {/* Step 1: Type */}
            <div className="mt-10">
              <h2 className="font-serif text-xl font-semibold text-text">Type de rendez-vous</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => { setIsConsultation(true); setSelectedServiceIds([]); setGender(null); }}
                  className={`flex flex-col gap-2 rounded-xl p-5 text-left transition-all duration-300 ${
                    isConsultation
                      ? 'border-2 border-primary bg-rose-soft/50 shadow-lg shadow-primary/10'
                      : 'border border-rose-soft bg-white hover:-translate-y-0.5 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text">Consultation</span>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">Gratuit</span>
                  </div>
                  <p className="text-xs text-text-light">Première visite pour évaluer votre peau. 30 min.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setIsConsultation(false)}
                  className={`flex flex-col gap-2 rounded-xl p-5 text-left transition-all duration-300 ${
                    !isConsultation && gender
                      ? 'border-2 border-primary bg-rose-soft/50 shadow-lg shadow-primary/10'
                      : 'border border-rose-soft bg-white hover:-translate-y-0.5 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text">Séance laser</span>
                    <span className="rounded-full bg-nude px-3 py-1 text-xs font-bold text-primary-dark">Selon zones</span>
                  </div>
                  <p className="text-xs text-text-light">Choisissez une ou plusieurs zones à traiter.</p>
                </button>
              </div>
            </div>

            {/* Step 2: Gender + Services (laser only) */}
            {!isConsultation && (
              <div className="step-enter mt-8">
                <h2 className="font-serif text-xl font-semibold text-text">Homme ou Femme</h2>
                <div className="mt-4 flex gap-3">
                  {(['female', 'male'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => { setGender(g); setSelectedServiceIds([]); setSelectedCategory(null); }}
                      className={`flex-1 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-300 ${
                        gender === g
                          ? 'bg-primary text-white shadow-md'
                          : 'border border-rose-soft bg-white text-text-light hover:border-primary-light'
                      }`}
                    >
                      {g === 'female' ? 'Femme' : 'Homme'}
                    </button>
                  ))}
                </div>

                {gender && (
                  <div className="step-enter mt-6 flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCategory(null)}
                        className={`rounded-full px-4 py-2 text-xs font-medium transition-all duration-300 ${
                          !selectedCategory ? 'bg-primary text-white shadow-md' : 'border border-rose-soft bg-white text-text-light'
                        }`}
                      >
                        Toutes
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`rounded-full px-4 py-2 text-xs font-medium capitalize transition-all duration-300 ${
                            selectedCategory === cat.id ? 'bg-primary text-white shadow-md' : 'border border-rose-soft bg-white text-text-light'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {services.map((s) => {
                        const selected = selectedServiceIds.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggleService(s.id)}
                            className={`flex items-center justify-between rounded-xl px-5 py-4 text-left transition-all duration-300 ${
                              selected
                                ? 'border-2 border-primary bg-rose-soft/50 shadow-lg shadow-primary/10'
                                : 'border border-rose-soft bg-white hover:-translate-y-0.5 hover:shadow-md'
                            }`}
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-semibold text-text">{s.name}</span>
                              <span className="text-xs text-text-light">{s.duration} min</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-nude px-3 py-1 text-sm font-bold text-primary-dark">{s.price}&euro;</span>
                              {selected && (
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white">✓</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Summary + Book button */}
            {canBook && (
              <div className="step-enter mt-8 rounded-2xl border border-primary-light/50 bg-gradient-to-r from-nude to-rose-soft/30 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text">
                      {isConsultation
                        ? `Consultation gratuite · ${CONSULTATION_MINUTES} min`
                        : `${selectedServiceIds.length} zone${selectedServiceIds.length > 1 ? 's' : ''} · ${formatDuration(totalDuration)}`}
                    </p>
                    {!tooLongForOnline && (
                      <p className="mt-1 text-xs text-text-light">
                        {bookedSlots > 1
                          ? `${bookedSlots} créneaux consécutifs réservés pour vous`
                          : 'Un créneau réservé pour vous'}
                      </p>
                    )}
                    {!isConsultation && selectedServiceNames.length > 0 && (
                      <p className="mt-1 text-xs text-text-light">{selectedServiceNames.join(', ')}</p>
                    )}
                  </div>
                  <span className="text-xl font-bold text-primary-dark">
                    {isConsultation ? 'Gratuit' : `${totalPrice}\u20ac`}
                  </span>
                </div>

                {tooLongForOnline && (
                  <p className="mt-4 rounded-xl bg-white/70 p-3 text-xs leading-relaxed text-text-light">
                    Cette sélection dépasse ce que nous pouvons réserver en ligne. Appelez-nous
                    au <a href={`tel:${centerInfo.phone.replace(/\s/g, '')}`} className="font-semibold text-primary-dark underline">{centerInfo.phone}</a>,
                    nous organiserons la séance sur mesure.
                  </p>
                )}

                <button
                  type="button"
                  disabled={tooLongForOnline}
                  onClick={() => {
                    if (!calendlyUrl) {
                      toast.error('Le calendrier n\'est pas encore configuré.');
                      return;
                    }
                    setShowCalendar(true);
                  }}
                  className="mt-4 w-full rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                >
                  Choisir un créneau
                </button>
              </div>
            )}
          </>
        ) : (
          /* Calendly inline widget */
          <div ref={calendarRef} className="step-enter mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold text-text">
                Choisissez votre créneau
              </h2>
              <button
                type="button"
                onClick={() => setShowCalendar(false)}
                className="rounded-full border border-rose-soft px-4 py-2 text-xs font-medium text-text-light transition-all duration-300 hover:bg-nude"
              >
                &larr; Modifier ma sélection
              </button>
            </div>

            {/* Recap */}
            <div className="mb-4 rounded-xl bg-nude p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-text">
                  {isConsultation ? 'Consultation gratuite' : selectedServiceNames.join(', ')}
                </span>
                <span className="font-bold text-primary-dark">
                  {isConsultation ? 'Gratuit' : `${totalPrice}\u20ac`} · {formatDuration(totalDuration)}
                </span>
              </div>
            </div>

            {/* Calendly embed */}
            <div className="overflow-hidden rounded-2xl border border-rose-soft">
              <InlineWidget
                key={calendlyUrl}
                url={calendlyUrl}
                prefill={calendlyPrefill}
                utm={calendlyUtm}
                pageSettings={{
                  backgroundColor: 'faf5f2',
                  primaryColor: 'c9a494',
                  textColor: '3d2e27',
                  hideEventTypeDetails: true,
                  hideLandingPageDetails: true,
                  hideGdprBanner: true,
                }}
                styles={{
                  height: '660px',
                  minWidth: '280px',
                }}
              />
            </div>
          </div>
        )}

        {/* Horaires */}
        <div className="mt-8 rounded-xl border border-primary-light/50 bg-white p-5 text-center">
          <p className="text-sm text-text-light">
            <strong className="text-text">Horaires :</strong> {HOURS_SUMMARY}
          </p>
        </div>
      </div>
    </section>
  );
}
