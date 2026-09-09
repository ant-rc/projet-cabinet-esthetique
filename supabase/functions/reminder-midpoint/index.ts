// Supabase Edge Function: reminder-midpoint
//
// Calcule quelles patientes doivent recevoir le rappel à mi-parcours, celui qui
// tombe à la moitié du délai entre la réservation et le rendez-vous.
//
// Calendly ne sait pas déclencher ce rappel : ses Workflows ne se déclenchent
// que par rapport à l'heure du rendez-vous, jamais par rapport à la date de
// réservation. Le point médian dépend des deux.
//
// Source de vérité : Calendly. La base ne sert qu'à mémoriser les envois déjà
// faits, voir migration 20260909213000_reminders_sent.sql. Cadrage complet dans
// dossier_cadrage/CADRAGE-RAPPEL-MI-PARCOURS.md.
//
// Déploiement :
//   supabase functions deploy reminder-midpoint
//
// Secrets nécessaires :
//   CALENDLY_PAT               déjà posé pour calendly-events
//   SUPABASE_URL               fourni par la plateforme
//   SUPABASE_SERVICE_ROLE_KEY  fourni par la plateforme
//
// Appel. `dryRun` vaut true par défaut : il faut demander explicitement l'envoi
// réel, jamais l'inverse.
//   curl -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
//        "$SUPABASE_URL/functions/v1/reminder-midpoint?dryRun=true"

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

// @ts-expect-error external module (Deno)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const CALENDLY_API = 'https://api.calendly.com';

/**
 * Délai minimum entre la réservation et le rendez-vous.
 *
 * Ce n'est pas un réglage indépendant : il découle de MIN_GAP_BEFORE_HOURS.
 * Le point médian étant à la moitié du délai, exiger qu'il tombe au moins 4
 * jours avant le rendez-vous impose un délai d'au moins 8 jours. Modifier l'un
 * sans l'autre casserait cette cohérence.
 *
 * Mesuré sur les 58 rendez-vous de l'historique : 28 % des réservations passent
 * ce seuil. Les autres ont réservé à moins de huit jours et sont déjà couvertes
 * par la confirmation, le J-2 et le jour J.
 */
const MIN_GAP_BEFORE_HOURS = 4 * 24;
const MIN_LEAD_HOURS = MIN_GAP_BEFORE_HOURS * 2;

/**
 * Au-delà de ce retard, on n'envoie plus.
 *
 * Si le job n'a pas tourné pendant deux jours, rattraper est utile. Rattraper
 * une semaine plus tard désoriente : la patiente reçoit un rappel « à
 * mi-parcours » alors que le rendez-vous est proche.
 */
const MAX_OVERDUE_HOURS = 48;

/** Le point médian tombe à une heure quelconque, souvent la nuit. */
const SEND_HOUR_PARIS = 10;

const KIND = 'midpoint';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HEURE = 60 * 60 * 1000;

interface CalendlyEvent {
  uri: string;
  name: string;
  status: string;
  start_time: string;
  created_at: string;
}

interface CalendlyInvitee {
  name: string;
  email: string;
  status: string;
}

type Verdict =
  | 'a_envoyer'
  | 'deja_envoye'
  | 'a_venir'
  | 'delai_trop_court'
  | 'trop_tard'
  | 'trop_proche_du_rdv'
  | 'sans_destinataire'
  | 'exclu';

interface Ligne {
  evenement: string;
  type: string;
  reserveLe: string;
  rendezVous: string;
  delaiJours: number;
  envoiPrevu: string | null;
  joursAvantRdv: number | null;
  destinataire: string | null;
  verdict: Verdict;
}

/**
 * Décalage de Paris par rapport à UTC, en minutes, à un instant donné.
 *
 * Passe par Intl plutôt que par une constante : le décalage vaut +1h ou +2h
 * selon l'heure d'été, et un rappel calculé en mars ou en octobre tomberait
 * sinon une heure à côté.
 */
function decalageParis(instant: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(instant);

  const p: Record<string, string> = {};
  for (const part of parts) p[part.type] = part.value;

  const murUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return (murUtc - instant.getTime()) / 60000;
}

/** L'instant correspondant à SEND_HOUR_PARIS le jour parisien du point médian. */
function heureDEnvoi(pointMedian: Date): Date {
  const decalage = decalageParis(pointMedian);
  const mur = new Date(pointMedian.getTime() + decalage * 60000);

  const cible = Date.UTC(mur.getUTCFullYear(), mur.getUTCMonth(), mur.getUTCDate(), SEND_HOUR_PARIS);
  let instant = new Date(cible - decalage * 60000);

  // Le décalage peut différer entre le point médian et l'heure visée, la nuit
  // du changement d'heure. On recalcule alors avec le bon.
  const decalageCible = decalageParis(instant);
  if (decalageCible !== decalage) instant = new Date(cible - decalageCible * 60000);

  return instant;
}

/**
 * Envoi réel du rappel.
 *
 * Volontairement non implémenté : le fournisseur d'e-mail n'est pas tranché et
 * le domaine n'est pas encore authentifié. Échouer bruyamment vaut mieux que
 * renvoyer un succès silencieux qui laisserait croire que les rappels partent.
 */
function envoyer(_destinataire: string, _evenement: CalendlyEvent): never {
  throw new Error(
    "Aucun fournisseur d'e-mail configuré. Utilisez dryRun=true tant que le " +
    'domaine aa-lasermed.com n\'est pas authentifié (SPF et DKIM).',
  );
}

async function calendly<T>(chemin: string, pat: string): Promise<T> {
  const res = await fetch(chemin, { headers: { Authorization: `Bearer ${pat}` } });
  if (!res.ok) throw new Error(`Calendly ${res.status} sur ${chemin}`);
  return await res.json() as T;
}

/** Tous les rendez-vous à venir, pagination suivie jusqu'au bout. */
async function evenementsAVenir(pat: string, utilisateur: string): Promise<CalendlyEvent[]> {
  const tous: CalendlyEvent[] = [];
  let token: string | null = null;

  do {
    const url = new URL(`${CALENDLY_API}/scheduled_events`);
    url.searchParams.set('user', utilisateur);
    url.searchParams.set('status', 'active');
    url.searchParams.set('min_start_time', new Date().toISOString());
    url.searchParams.set('count', '100');
    url.searchParams.set('sort', 'start_time:asc');
    if (token) url.searchParams.set('page_token', token);

    const page = await calendly<{
      collection: CalendlyEvent[];
      pagination: { next_page_token: string | null };
    }>(url.toString(), pat);

    tous.push(...page.collection);
    token = page.pagination.next_page_token;
  } while (token);

  return tous;
}

// @ts-expect-error Deno global
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const json = (corps: unknown, status = 200) =>
    new Response(JSON.stringify(corps, null, 2), {
      status,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  // @ts-expect-error Deno global
  const env = (cle: string) => Deno.env.get(cle) ?? '';

  const cleService = env('SUPABASE_SERVICE_ROLE_KEY');
  const pat = env('CALENDLY_PAT');

  // La réponse contient des adresses de patientes : réservée à la clé de
  // service, celle que le planificateur présentera.
  if (req.headers.get('Authorization') !== `Bearer ${cleService}`) {
    return json({ error: 'Réservé à la clé de service.' }, 401);
  }
  if (!pat) return json({ error: 'CALENDLY_PAT absent.' }, 500);

  const url = new URL(req.url);
  const dryRun = url.searchParams.get('dryRun') !== 'false';

  try {
    const moi = await calendly<{ resource: { uri: string; email: string } }>(
      `${CALENDLY_API}/users/me`, pat,
    );
    const utilisateur = moi.resource.uri;
    // La cliente ne doit pas recevoir les rappels de ses propres essais.
    const adressesExclues = new Set([moi.resource.email.toLowerCase()]);

    const evenements = await evenementsAVenir(pat, utilisateur);

    // Envois déjà faits. La table peut ne pas encore exister : dans ce cas on
    // continue en simulation plutôt que d'échouer, pour permettre un premier
    // essai avant la migration.
    const supabase = createClient(env('SUPABASE_URL'), cleService);
    let dejaEnvoyes = new Set<string>();
    let avertissement: string | null = null;

    const { data: journal, error: erreurJournal } = await supabase
      .from('reminders_sent')
      .select('calendly_event_uri')
      .eq('kind', KIND);

    if (erreurJournal) {
      avertissement = `Table reminders_sent illisible (${erreurJournal.message}). ` +
        'Aucun antidoublon appliqué : lancez la migration avant tout envoi réel.';
      if (!dryRun) return json({ error: avertissement }, 500);
    } else {
      dejaEnvoyes = new Set((journal ?? []).map((l: { calendly_event_uri: string }) => l.calendly_event_uri));
    }

    const maintenant = Date.now();
    const lignes: Ligne[] = [];

    for (const ev of evenements) {
      const reserve = new Date(ev.created_at);
      const debut = new Date(ev.start_time);
      const delaiH = (debut.getTime() - reserve.getTime()) / HEURE;

      const base = {
        evenement: ev.uri.split('/').pop() ?? ev.uri,
        type: ev.name,
        reserveLe: ev.created_at,
        rendezVous: ev.start_time,
        delaiJours: Math.round((delaiH / 24) * 10) / 10,
        envoiPrevu: null as string | null,
        joursAvantRdv: null as number | null,
        destinataire: null as string | null,
      };

      if (delaiH < MIN_LEAD_HOURS) {
        lignes.push({ ...base, verdict: 'delai_trop_court' });
        continue;
      }

      const pointMedian = new Date(reserve.getTime() + (debut.getTime() - reserve.getTime()) / 2);
      const envoi = heureDEnvoi(pointMedian);
      const avantRdvH = (debut.getTime() - envoi.getTime()) / HEURE;

      base.envoiPrevu = envoi.toISOString();
      base.joursAvantRdv = Math.round((avantRdvH / 24) * 10) / 10;

      if (avantRdvH < MIN_GAP_BEFORE_HOURS) {
        lignes.push({ ...base, verdict: 'trop_proche_du_rdv' });
        continue;
      }
      if (envoi.getTime() > maintenant) {
        lignes.push({ ...base, verdict: 'a_venir' });
        continue;
      }
      if ((maintenant - envoi.getTime()) / HEURE > MAX_OVERDUE_HOURS) {
        lignes.push({ ...base, verdict: 'trop_tard' });
        continue;
      }
      if (dejaEnvoyes.has(ev.uri)) {
        lignes.push({ ...base, verdict: 'deja_envoye' });
        continue;
      }

      // L'invité n'est lu que pour les rendez-vous qui passent toutes les
      // bornes : un appel par rendez-vous éligible, pas par rendez-vous connu.
      const uuid = ev.uri.split('/').pop();
      const invites = await calendly<{ collection: CalendlyInvitee[] }>(
        `${CALENDLY_API}/scheduled_events/${uuid}/invitees?status=active`, pat,
      );
      const invite = invites.collection[0] ?? null;

      if (!invite?.email) {
        lignes.push({ ...base, verdict: 'sans_destinataire' });
        continue;
      }
      if (adressesExclues.has(invite.email.toLowerCase())) {
        lignes.push({ ...base, destinataire: invite.email, verdict: 'exclu' });
        continue;
      }

      base.destinataire = invite.email;

      if (!dryRun) {
        envoyer(invite.email, ev);
        await supabase.from('reminders_sent').insert({
          calendly_event_uri: ev.uri,
          kind: KIND,
          scheduled_for: envoi.toISOString(),
        });
      }

      lignes.push({ ...base, verdict: 'a_envoyer' });
    }

    const compte: Record<string, number> = {};
    for (const l of lignes) compte[l.verdict] = (compte[l.verdict] ?? 0) + 1;

    return json({
      mode: dryRun ? 'simulation' : 'envoi reel',
      avertissement,
      reglages: {
        delaiMinimumJours: MIN_LEAD_HOURS / 24,
        ecartMinimumAvantRdvJours: MIN_GAP_BEFORE_HOURS / 24,
        retardMaximumHeures: MAX_OVERDUE_HOURS,
        heureEnvoiParis: SEND_HOUR_PARIS,
      },
      rendezVousExamines: evenements.length,
      compte,
      lignes,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
