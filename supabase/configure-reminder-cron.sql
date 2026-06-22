-- Paste this file into the Supabase SQL Editor.
-- Replace REPLACE_WITH_CRON_SECRET in the editor before running it.
-- Existing cron jobs with other names, including email sync, are not changed.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $setup$
declare
  processor_url constant text := 'https://zeroorigins-os.vercel.app/api/reminders/process';
  processor_secret constant text := 'REPLACE_WITH_CRON_SECRET';
  existing_secret_id uuid;
begin
  if processor_secret = 'REPLACE_WITH_CRON_SECRET' then
    raise exception 'Replace REPLACE_WITH_CRON_SECRET with the CRON_SECRET value from Vercel before running this SQL';
  end if;

  select id into existing_secret_id
  from vault.decrypted_secrets
  where name = 'reminder_processor_url';

  if existing_secret_id is null then
    perform vault.create_secret(processor_url, 'reminder_processor_url');
  else
    perform vault.update_secret(existing_secret_id, processor_url, 'reminder_processor_url');
  end if;

  existing_secret_id := null;
  select id into existing_secret_id
  from vault.decrypted_secrets
  where name = 'reminder_processor_secret';

  if existing_secret_id is null then
    perform vault.create_secret(processor_secret, 'reminder_processor_secret');
  else
    perform vault.update_secret(existing_secret_id, processor_secret, 'reminder_processor_secret');
  end if;
end
$setup$;

select cron.unschedule(jobid)
from cron.job
where jobname = 'process-task-reminders-every-minute';

select cron.schedule(
  'process-task-reminders-every-minute',
  '* * * * *',
  $cron$
    select net.http_get(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'reminder_processor_url'
      ),
      headers := jsonb_build_object(
        'Authorization',
        'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'reminder_processor_secret'
        )
      )
    );
  $cron$
);
