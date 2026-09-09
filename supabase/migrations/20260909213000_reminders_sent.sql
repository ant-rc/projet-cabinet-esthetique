-- Journal des rappels déjà envoyés.
--
-- Le job tourne toutes les heures et doit être incapable d'envoyer deux fois le
-- même rappel. La clé primaire composite fait tout le travail : un second envoi
-- viole la contrainte et échoue proprement, sans qu'aucun code n'ait à vérifier
-- quoi que ce soit au préalable.
--
-- La clé est l'événement Calendly, pas la ligne d'appointments : une réservation
-- multi-zones s'écrit sur plusieurs lignes en base mais ne correspond qu'à un
-- seul rendez-vous, donc à un seul rappel.
--
-- Aucun e-mail n'est stocké ici. L'adresse vit déjà dans auth.users et chez
-- Calendly ; la dupliquer dans une troisième table n'apporterait rien et
-- multiplierait les endroits à purger.

create table if not exists public.reminders_sent (
  calendly_event_uri text        not null,
  kind               text        not null,
  scheduled_for      timestamptz not null,
  sent_at            timestamptz not null default now(),
  primary key (calendly_event_uri, kind)
);

comment on table public.reminders_sent is
  'Rappels déjà envoyés, une ligne par rendez-vous et par type de rappel. Sert uniquement d''antidoublon.';
comment on column public.reminders_sent.kind is
  'Type de rappel. ''midpoint'' pour le rappel à mi-parcours entre la réservation et le rendez-vous.';
comment on column public.reminders_sent.scheduled_for is
  'Heure à laquelle le rappel devait partir, conservée pour distinguer un envoi à l''heure d''un rattrapage.';

-- RLS active et volontairement sans aucune politique.
--
-- La table vit dans le schéma public, donc PostgREST l'expose. Sans politique,
-- toute lecture ou écriture avec la clé anon ou avec le jeton d'une patiente
-- est refusée. Seule la clé de service, qui contourne RLS, y accède : c'est la
-- seule chose qui doit écrire ici.
alter table public.reminders_sent enable row level security;
