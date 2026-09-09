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

/**
 * Pas de la grille : une heure pleine.
 */
export const SLOT_STEP_MINUTES = 60;

export interface OpeningHours {
  /** 0 = dimanche, 1 = lundi, ... 6 = samedi — convention Date.getDay(). */
  dayOfWeek: number;
  opensAt: string;
  /**
   * Heure de début du **dernier créneau réservable**, pas heure de fermeture.
   *
   * C'est la valeur que la cliente donne quand elle dit « 10h-19h », et c'est
   * celle qui est affichée sur le site et publiée en données structurées.
   */
  lastSlotAt: string;
  /**
   * Heure de fin de la dernière séance d'une heure : `lastSlotAt` + le pas.
   *
   * Dérivée, jamais saisie. Elle ne sert qu'au calcul de tenue de séance —
   * une séance de deux heures doit finir avant, son dernier départ recule donc
   * d'une heure. Volontairement absente de l'affichage : annoncer 20h alors que
   * plus rien n'est réservable à cette heure enverrait des patientes pour rien.
   */
  closesAt: string;
}

/** '19:00' + 60 -> '20:00'. */
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hours = Math.floor(total / 60).toString().padStart(2, '0');
  const mins = (total % 60).toString().padStart(2, '0');
  return `${hours}:${mins}`;
}

function day(opensAt: string, lastSlotAt: string) {
  return { opensAt, lastSlotAt, closesAt: addMinutes(lastSlotAt, SLOT_STEP_MINUTES) };
}

const WEEKDAY = day('10:00', '19:00');
const SATURDAY = day('10:00', '18:00');
const SUNDAY = day('10:00', '13:00');

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

/** '10:00' -> '10h00', pour l'affichage. */
export function displayTime(time: string): string {
  return time.replace(':', 'h');
}

function range(hours: { opensAt: string; lastSlotAt: string }): string {
  return `${displayTime(hours.opensAt)} – ${displayTime(hours.lastSlotAt)}`;
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
export const WEEKDAY_CLOSING = shortTime(WEEKDAY.lastSlotAt);
export const SUNDAY_OPENING = shortTime(SUNDAY.opensAt);
export const SUNDAY_CLOSING = shortTime(SUNDAY.lastSlotAt);
