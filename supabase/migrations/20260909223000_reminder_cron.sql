-- Planification horaire du rappel à mi-parcours.
--
-- Le job appelle l'Edge Function reminder-midpoint, qui décide seule qui doit
-- recevoir un rappel. Cette migration ne fait que la déclencher.
--
-- Pourquoi toutes les heures et non une fois par jour à 10h : pg_cron raisonne
-- en UTC, or 10h à Paris vaut 08h ou 09h UTC selon l'heure d'été. Un job
-- quotidien en UTC dériverait d'une heure deux fois par an. Un passage horaire
-- s'en moque : la fonction compare l'heure d'envoi calculée à l'instant présent
-- et rattrape jusqu'à 48h de retard, ce qui couvre aussi une panne du job.
--
-- Minute 7 et non 0 : le haut de l'heure est l'instant où toute la planète
-- déclenche ses tâches.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Le jeton d'appel vit dans Vault, jamais dans cette migration ni dans la
-- table cron.job, que toute personne ayant accès à la base peut lire.
--
-- À créer avant de jouer cette migration :
--   select vault.create_secret('<jeton>', 'reminder_cron_secret',
--                              'Jeton d''appel de reminder-midpoint');
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'reminder_cron_secret') then
    raise exception
      'Secret Vault "reminder_cron_secret" absent. Créez-le avant de rejouer cette migration.';
  end if;
end $$;

-- Rejouable : on retire la version précédente du job avant de la reposer.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'reminder-midpoint-hourly') then
    perform cron.unschedule('reminder-midpoint-hourly');
  end if;
end $$;

-- dryRun=true tant qu'aucun fournisseur d'e-mail n'est branché. La fonction
-- refuse de toute façon d'envoyer pour de vrai dans cet état ; le paramètre
-- évite simplement une erreur toutes les heures. Le jour où l'envoi est prêt,
-- rejouer cette migration avec dryRun=false.
select cron.schedule(
  'reminder-midpoint-hourly',
  '7 * * * *',
  $job$
  select net.http_get(
    url := 'https://nmzenuvcubkfrjciubun.supabase.co/functions/v1/reminder-midpoint?dryRun=true',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'reminder_cron_secret')
    ),
    timeout_milliseconds := 30000
  );
  $job$
);
