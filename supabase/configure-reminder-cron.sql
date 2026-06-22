-- Run this file with psql variables. Never place production values in source.
-- Existing cron jobs with other names, including email sync, are not changed.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select vault.create_secret(:'reminder_processor_url', 'reminder_processor_url');
select vault.create_secret(:'reminder_processor_secret', 'reminder_processor_secret');

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
