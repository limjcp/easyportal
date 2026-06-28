-- Run once per Supabase project (SQL Editor or: supabase db execute -f scripts/setup-vendor-compliance-cron-vault.sql)
--
-- Prerequisites:
--   1. supabase secrets set CRON_SECRET=<same-random-secret>
--   2. supabase functions deploy vendor-compliance-reminders
--
-- Replace the placeholder values below before running.

SELECT vault.create_secret(
  'https://YOUR_PROJECT_REF.supabase.co',
  'project_url',
  'Supabase project URL for scheduled Edge Function calls'
);

SELECT vault.create_secret(
  'YOUR_SUPABASE_ANON_KEY',
  'publishable_key',
  'Supabase anon/publishable key for Edge Function gateway'
);

SELECT vault.create_secret(
  'YOUR_CRON_SECRET',
  'vendor_compliance_cron_secret',
  'Must match CRON_SECRET Edge Function secret (x-cron-secret header)'
);

-- Optional: trigger immediately to verify
-- SELECT public.invoke_vendor_compliance_reminders();
