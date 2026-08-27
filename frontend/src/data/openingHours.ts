/**
 * Horaires d'ouverture — source unique de vérité.
 *
 * Ils étaient écrits en dur à sept endroits qui ne se lisaient pas entre eux :
 * la grille de créneaux, le bloc contact, la page réservation, les mentions
 * légales, deux descriptions SEO et les données structurées de index.html.
 * Chaque correction en oubliait au moins un, et le site a annoncé pendant des
 * mois des horaires que l'agenda ne servait pas.
 *
 * Toute modification se fait ici et se propage partout, y compris dans le HTML
 * prérendu au build.
 */

export interface OpeningHours {
  /** 0 = dimanche, 1 = lundi, ... 6 = samedi — convention Date.getDay(). */
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
}

const WEEKDAY = { opensAt: '10:00', closesAt: '19:00' };
const SATURDAY = { opensAt: '10:00', closesAt: '18:00' };
const SUNDAY = { opensAt: '10:00', closesAt: '13:00' };

/**
 * Le centre est ouvert sept jours sur sept. Un jour absent de cette liste est
 * fermé : la grille de créneaux ne génère alors aucun horaire.
 */
export const OPENING_HOURS: OpeningHours[] = [
  { dayOfWeek: 1, ...WEEKDAY },
  { dayOfWeek: 2, ...WEEKDAY },
  { dayOfWeek: 3, ...WEEKDAY },
  { dayOfWeek: 4, ...WEEKDAY },
  { dayOfWeek: 5, ...WEEKDAY },
  { dayOfWeek: 6, ...SATURDAY },
  { dayOfWeek: 0, ...SUNDAY },
];

/**
 * Pas de la grille : une heure pleine.
 *
 * `closesAt` est bien une heure de fermeture, pas une heure de dernier départ.
 * Une séance doit tenir entièrement avant, donc le dernier créneau d'une séance
 * d'une heure est 18h00 en semaine et 12h00 le dimanche.
 */
export const SLOT_STEP_MINUTES = 60;

/** '10:00' -> '10h00', pour l'affichage. */
export function displayTime(time: string): string {
  return time.replace(':', 'h');
}

function range(hours: { opensAt: string; closesAt: string }): string {
  return `${displayTime(hours.opensAt)} – ${displayTime(hours.closesAt)}`;
}

/** Horaires groupés pour l'affichage, dérivés des mêmes constantes. */
export const HOURS_DISPLAY = [
  { label: 'Lundi – Vendredi', value: range(WEEKDAY) },
  { label: 'Samedi', value: range(SATURDAY) },
  { label: 'Dimanche', value: range(SUNDAY) },
];

/** Version d'une ligne, pour les encarts et les mentions légales. */
export const HOURS_SUMMARY = HOURS_DISPLAY.map((h) => `${h.label} ${h.value}`).join(' · ');

/** '19:00' -> '19h', '18:30' -> '18h30' — forme courte pour le texte courant. */
function shortTime(time: string): string {
  const [hours, minutes] = time.split(':');
  return minutes === '00' ? `${Number(hours)}h` : `${Number(hours)}h${minutes}`;
}

/** Heures citées dans les descriptions SEO et les textes courants. */
export const WEEKDAY_CLOSING = shortTime(WEEKDAY.closesAt);
export const SUNDAY_OPENING = shortTime(SUNDAY.opensAt);
export const SUNDAY_CLOSING = shortTime(SUNDAY.closesAt);
