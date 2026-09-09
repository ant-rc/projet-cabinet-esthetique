import { SLOT_STEP_MINUTES } from '@/data/openingHours';

/**
 * Choix du type d'événement Calendly en fonction de la durée réelle de la séance.
 *
 * C'est Calendly qui fait autorité sur l'agenda : le créneau bloqué est celui du
 * type d'événement réservé, pas celui que le site affiche. Tant que toutes les
 * réservations pointaient vers un unique événement de 30 minutes, une séance de
 * trois zones bloquait 30 minutes et les créneaux suivants restaient ouverts,
 * d'où des chevauchements réels.
 *
 * L'URL de base est lue depuis VITE_CALENDLY_URL (ex. https://calendly.com/aalasermed).
 */

const CALENDLY_BASE = (import.meta.env.VITE_CALENDLY_URL as string | undefined) ?? '';

/** Durée de la première consultation, gratuite et obligatoire. */
export const CONSULTATION_MINUTES = 30;

/**
 * Nombre maximum de créneaux consécutifs réservables en ligne.
 *
 * Huit demi-heures, soit quatre heures. Au-delà, la séance dépasse l'amplitude
 * d'ouverture du dimanche et représente un panier inhabituel : la prise de
 * rendez-vous passe alors par téléphone.
 */
export const MAX_SESSION_SLOTS = 8;

/**
 * Nombre de créneaux occupés par une séance.
 *
 * La durée est arrondie au pas supérieur : sur une grille d'une demi-heure, une
 * séance de 1h25 occupe trois créneaux, pas deux et demi. C'est ce qui empêche
 * le créneau suivant d'être réservé par quelqu'un d'autre.
 */
export function slotsForDuration(durationMinutes: number): number {
  return Math.max(1, Math.ceil(durationMinutes / SLOT_STEP_MINUTES));
}

/** Durée réellement bloquée dans l'agenda, en minutes. */
export function reservedMinutes(durationMinutes: number): number {
  return slotsForDuration(durationMinutes) * SLOT_STEP_MINUTES;
}

/** Vrai si la séance dépasse ce qui est réservable en ligne. */
export function exceedsOnlineBooking(durationMinutes: number): boolean {
  return slotsForDuration(durationMinutes) > MAX_SESSION_SLOTS;
}

/**
 * URL de l'événement Calendly correspondant à la durée.
 *
 * Renvoie une chaîne vide si Calendly n'est pas configuré ou si la séance
 * dépasse la réservation en ligne ; l'appelant doit traiter les deux cas.
 *
 * Le slug porte la durée en minutes, convention déjà en place côté tableau de
 * bord. Types attendus, tous avec un incrément de départ d'une demi-heure :
 *   consultation   30 min
 *   seance-30      30 min
 *   seance-60      60 min
 *   seance-90      90 min
 *   seance-120    120 min
 *   seance-150    150 min
 *   seance-180    180 min
 *   seance-210    210 min
 *   seance-240    240 min
 *
 * Un type manquant ne produit pas d'erreur ici : l'iframe Calendly affiche une
 * page 404. Toute modification de MAX_SESSION_SLOTS ou de SLOT_STEP_MINUTES
 * suppose donc de créer les types correspondants avant de déployer.
 */
export function getCalendlyEventUrl(durationMinutes: number, isConsultation: boolean): string {
  if (!CALENDLY_BASE) return '';
  if (isConsultation) return `${CALENDLY_BASE}/consultation`;
  if (exceedsOnlineBooking(durationMinutes)) return '';

  return `${CALENDLY_BASE}/seance-${reservedMinutes(durationMinutes)}`;
}

/**
 * Paramètres UTM transmis à Calendly, présents ensuite dans le webhook sous `tracking`.
 *
 * Ce sont des métadonnées de suivi : elles n'ont aucun effet sur la durée
 * réservée, qui dépend uniquement du type d'événement choisi ci-dessus.
 */
export function buildCalendlyUtm(zones: string[], totalPrice: number, totalDuration: number): Record<string, string> {
  return {
    utmSource: 'aalasermed-website',
    utmMedium: 'booking',
    utmContent: zones.join(' | '),
    utmTerm: `${totalPrice}€ - ${totalDuration}min`,
    utmCampaign: 'reservation',
  };
}
