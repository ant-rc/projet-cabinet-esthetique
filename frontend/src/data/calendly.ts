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
 * Au-delà, la séance dépasse l'amplitude d'ouverture du dimanche et représente
 * un panier inhabituel : la prise de rendez-vous passe alors par téléphone.
 */
export const MAX_SESSION_SLOTS = 4;

/**
 * Nombre de créneaux d'une heure occupés par une séance.
 *
 * La durée est arrondie à l'heure supérieure : sur une grille horaire, une
 * séance de 1h25 occupe deux créneaux, pas un et demi. C'est ce qui empêche le
 * créneau suivant d'être réservé par quelqu'un d'autre.
 */
export function slotsForDuration(durationMinutes: number): number {
  return Math.max(1, Math.ceil(durationMinutes / SLOT_STEP_MINUTES));
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
 * Types d'événements attendus côté tableau de bord Calendly, avec un incrément
 * de départ d'une heure pour tous :
 *   consultation  30 min
 *   seance-1h     60 min
 *   seance-2h    120 min
 *   seance-3h    180 min
 *   seance-4h    240 min
 */
export function getCalendlyEventUrl(durationMinutes: number, isConsultation: boolean): string {
  if (!CALENDLY_BASE) return '';
  if (isConsultation) return `${CALENDLY_BASE}/consultation`;
  if (exceedsOnlineBooking(durationMinutes)) return '';

  return `${CALENDLY_BASE}/seance-${slotsForDuration(durationMinutes)}h`;
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
