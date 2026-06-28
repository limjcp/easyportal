-- Profile completion gate
ALTER TABLE public.portal_settings
  ADD COLUMN IF NOT EXISTS profile_completion_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS profile_completion_resident_types text[] NOT NULL DEFAULT '{Owner,Absentee Owner}',
  ADD COLUMN IF NOT EXISTS profile_completion_soft_login_count integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS profile_completion_block_login_count integer NOT NULL DEFAULT 3;

ALTER TABLE public.profile_field_options
  ADD COLUMN IF NOT EXISTS required_for_completion boolean NOT NULL DEFAULT false;

ALTER TABLE public.unit_occupancies
  ADD COLUMN IF NOT EXISTS profile_completion_login_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_completed_at timestamptz NULL;

ALTER TABLE public.portal_settings
  ADD CONSTRAINT portal_settings_profile_completion_login_order
  CHECK (profile_completion_soft_login_count >= 1
     AND profile_completion_block_login_count > profile_completion_soft_login_count);
