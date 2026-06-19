-- Store app return URL for QuickBooks OAuth popup completion redirect

ALTER TABLE public.quickbooks_oauth_states
  ADD COLUMN IF NOT EXISTS return_url text;
