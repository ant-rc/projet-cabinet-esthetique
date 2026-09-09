-- Passage du rappel à mi-parcours en envoi réel.
--
-- Le job existant tournait en simulation faute de fournisseur d'e-mail. Brevo
-- est maintenant branché dans la fonction, on retire donc dryRun.
--
-- Ce que cette migration ne garantit pas, et qui reste à faire côté Brevo :
--   1. BREVO_API_KEY posé en secret de fonction ;
--   2. domaine aa-lasermed.com authentifié, SPF et DKIM ;
--   3. expéditeur validé, contact@aa-lasermed.com par défaut.
--
-- Tant que l'un des trois manque, la fonction refuse d'envoyer et le dit. Elle
-- ne fera jamais semblant : aucun rappel ne peut partir en silence, et aucun
-- rendez-vous n'est marqué comme rappelé sans qu'un e-mail soit réellement
-- parti, l'écriture du journal suivant l'envoi.
--
-- Pour revenir en simulation, rejouer 20260909223000_reminder_cron.sql.

do $$
begin
  if not exists (select 1 from vault.secrets where name = 'reminder_cron_secret') then
    raise exception
      'Secret Vault "reminder_cron_secret" absent. Créez-le avant de rejouer cette migration.';
  end if;
end $$;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'reminder-midpoint-hourly') then
    perform cron.unschedule('reminder-midpoint-hourly');
  end if;
end $$;

select cron.schedule(
  'reminder-midpoint-hourly',
  '7 * * * *',
  $job$
  select net.http_get(
    url := 'https://nmzenuvcubkfrjciubun.supabase.co/functions/v1/reminder-midpoint?dryRun=false',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'reminder_cron_secret')
    ),
    timeout_milliseconds := 30000
  );
  $job$
);
