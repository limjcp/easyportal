-- Daily pg_cron job: invoke vendor-compliance-reminders Edge Function.
-- Requires Vault secrets (run scripts/setup-vendor-compliance-cron-vault.sql once per project).

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.invoke_vendor_compliance_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_url text;
  v_apikey text;
  v_cron_secret text;
BEGIN
  SELECT decrypted_secret
  INTO v_url
  FROM vault.decrypted_secrets
  WHERE name = 'project_url'
  LIMIT 1;

  SELECT decrypted_secret
  INTO v_apikey
  FROM vault.decrypted_secrets
  WHERE name = 'publishable_key'
  LIMIT 1;

  SELECT decrypted_secret
  INTO v_cron_secret
  FROM vault.decrypted_secrets
  WHERE name = 'vendor_compliance_cron_secret'
  LIMIT 1;

  IF v_url IS NULL OR v_apikey IS NULL OR v_cron_secret IS NULL THEN
    RAISE WARNING
      'vendor-compliance-reminders cron skipped: set vault secrets project_url, publishable_key, vendor_compliance_cron_secret';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := rtrim(v_url, '/') || '/functions/v1/vendor-compliance-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', v_apikey,
      'x-cron-secret', v_cron_secret
    ),
    body := jsonb_build_object(
      'trigger', 'pg_cron',
      'scheduled_at', now()
    ),
    timeout_milliseconds := 120000
  );
END;
$$;

REVOKE ALL ON FUNCTION public.invoke_vendor_compliance_reminders() FROM PUBLIC;

DO $cron$
DECLARE
  v_job_id bigint;
BEGIN
  SELECT jobid
  INTO v_job_id
  FROM cron.job
  WHERE jobname = 'vendor-compliance-reminders-daily'
  LIMIT 1;

  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $cron$;

SELECT cron.schedule(
  'vendor-compliance-reminders-daily',
  '0 8 * * *',
  $$SELECT public.invoke_vendor_compliance_reminders();$$
);
