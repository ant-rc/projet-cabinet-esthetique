# AA Lasermed

Site et prise de rendez-vous d'un centre d'épilation laser à Magny-le-Hongre.
En production sur **[aa-lasermed.com](https://aa-lasermed.com)**.

## Structure

```
frontend/           l'application, et le seul dossier que Vercel construit
  src/data/         catalogue, horaires, correspondance Calendly
  src/lib/          métadonnées de page, lues aussi par le build
  vite.config.ts    prerender par route, sitemap, injection du JSON-LD
supabase/
  functions/        Edge Functions (Deno)
  migrations/       schéma, versionné
api/                code mort, voir plus bas
dossier_cadrage/    documents de cadrage, gitignoré
```

## Démarrer

```bash
cd frontend
npm install
cp .env.example .env      # puis renseigner les clés
npm run dev
```

| Commande | Effet |
| --- | --- |
| `npm run dev` | serveur de développement |
| `npm run build` | compile, prérend 62 pages, génère le sitemap |
| `npm run preview` | sert le build sur `localhost:4173` |
| `npm run lint` | ESLint. **4 erreurs préexistantes**, ne pas s'en alarmer |

## Déployer

**Tout push sur `main` part en production**, il n'y a pas de préproduction.
Travailler sur une branche, vérifier, puis fusionner.

```bash
supabase db push                              # migrations
supabase functions deploy <nom>               # Edge Functions
git push origin main                          # front, via Vercel
```

L'ordre compte quand une migration accompagne du code : la base d'abord.

## Trois choses à savoir avant de toucher au code

### Les horaires affichés ne sont pas les horaires d'ouverture

`src/data/openingHours.ts` est la source unique. La valeur saisie est
`lastSlotAt`, **l'heure du dernier rendez-vous**, pas l'heure de fermeture.
`closesAt` en est dérivée. Le site annonce 10h–19h, la fenêtre Calendly va
jusqu'à 20h, et cet écart d'une heure est volontaire.

Ces horaires alimentent aussi les données structurées, réinjectées au build. Le
build **échoue** si le bloc visé disparaît de `index.html` : c'est un garde-fou,
pas une panne.

### L'agenda qui fait autorité est Calendly, pas la base

La durée réellement bloquée est celle du type d'événement réservé. Une séance de
1h25 réserve `seance-90`, soit 1h30. Le slug porte les minutes.

Une réservation multi-zones s'écrit sur **plusieurs lignes** de `appointments`
partageant `calendly_event_uri`, chacune portant la durée **totale**. Ne jamais
les sommer.

### `profiles` a deux identifiants

`profiles.id` est sa clé propre, `profiles.user_id` référence `auth.users`.
Joindre sur `id` renvoie zéro ligne et laisse croire que la base est incohérente.

## Rendez-vous et rappels

| Rappel | Où il vit | État |
| --- | --- | --- |
| Confirmation | Calendly | actif |
| Mi-parcours entre réservation et rendez-vous | Edge Function `reminder-midpoint` | **branché, en attente de la clé Brevo** |
| J-2 et jour J | Workflows Calendly | à configurer |

Le rappel à mi-parcours n'est pas exprimable dans Calendly, dont les Workflows ne
se déclenchent que par rapport à l'heure du rendez-vous. Il est calculé par un
job `pg_cron` horaire. Simulation possible à tout moment :

```bash
curl -H "Authorization: Bearer $REMINDER_CRON_SECRET" \
     "$SUPABASE_URL/functions/v1/reminder-midpoint?dryRun=true"
```

`dryRun` vaut vrai par défaut : l'envoi réel se demande explicitement.

## Secrets

Aucun secret dans le dépôt. `frontend/.env` est gitignoré, `.env.example` sert de
modèle. Les secrets serveur vivent dans les secrets de fonction Supabase, et le
jeton du job cron dans Vault côté Postgres.

## Le dossier `api/`

`api/calendly/events.ts` et `api/webhooks/calendly.ts` sont **du code mort** :
référencés nulle part, et situés hors du dossier que Vercel construit, donc
jamais déployés. Conservés le temps de vérifier que rien ne s'y rattache.

## Documents de cadrage

`dossier_cadrage/` est **gitignoré** : ces documents ne suivent pas le dépôt et
n'existent que sur le poste de travail.

| Fichier | Contenu |
| --- | --- |
| `FICHE-TECHNIQUE.md` | reprise du projet, architecture, dette, reprises en attente |
| `ETAT-AGENDA.md` | diagnostic de la réservation et checklist de déploiement |
| `CADRAGE-RAPPEL-MI-PARCOURS.md` | le rappel calculé depuis la date de réservation |
| `CHANTIERS.md` | SEO, acquisition, juridique |

## Conventions

Commits conventionnels, `type(scope): sujet`, à l'impératif et en minuscules.
Code et commits en anglais, interface et commentaires en français.
