-- Durée réelle des rendez-vous
--
-- La table appointments ne portait ni durée ni heure de fin. Une fois le
-- rendez-vous enregistré, plus aucun composant ne pouvait calculer un
-- chevauchement : l'information n'existait nulle part.
--
-- Second piège traité ici : une réservation multi-zones s'écrit sur plusieurs
-- lignes de même patient, même date et même heure. Sans clé de regroupement,
-- elles sont indiscernables de plusieurs rendez-vous simultanés en conflit.
--
-- À exécuter après sauvegarde de la table.

alter table public.appointments
  add column if not exists duration_minutes integer,
  add column if not exists calendly_event_uri text;

comment on column public.appointments.duration_minutes is
  'Durée totale du rendez-vous en minutes, lue depuis Calendly. Sur une réservation multi-zones, chaque ligne du groupe porte la même valeur totale : ne jamais sommer les lignes.';

comment on column public.appointments.calendly_event_uri is
  'Identifiant de l''événement Calendly. Clé de regroupement des lignes d''une même réservation.';

-- Comptage préalable, à lancer seul avant la migration pour connaître le volume
-- concerné :
--
--   select count(*) as lignes_a_reprendre
--   from public.appointments
--   where duration_minutes is null;

-- Reprise des rendez-vous existants.
--
-- Un groupe = les lignes partageant patient, date et heure. Les durées viennent
-- de public.services. Si cette table est vide en production, l'application
-- lisant un catalogue statique côté client, la reprise retombe sur 30 minutes
-- et le compte affiché plus bas le signale.
with grouped as (
  select
    a.user_id,
    a.date,
    a.time,
    bool_or(a.is_first_consultation) as has_consultation,
    sum(s.duration) as catalogue_minutes
  from public.appointments a
  left join public.services s on s.id = a.service_id
  group by a.user_id, a.date, a.time
)
update public.appointments a
set duration_minutes = case
      when g.has_consultation then 30
      else coalesce(g.catalogue_minutes, 30)
    end
from grouped g
where a.user_id = g.user_id
  and a.date = g.date
  and a.time = g.time
  and a.duration_minutes is null;

-- Contrôle de la reprise.
do $$
declare
  reprises integer;
  au_repli integer;
  services_connus integer;
begin
  select count(*) into reprises
  from public.appointments
  where duration_minutes is not null;

  select count(*) into au_repli
  from public.appointments
  where duration_minutes = 30 and not is_first_consultation;

  select count(*) into services_connus from public.services;

  raise notice 'Reprise: % rendez-vous renseignés.', reprises;
  raise notice 'public.services contient % lignes.', services_connus;

  if services_connus = 0 then
    raise notice 'ATTENTION: public.services est vide, les % séances renseignées à 30 min le sont par repli et non par calcul.', au_repli;
  end if;
end $$;
