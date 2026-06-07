ALTER TABLE public.polls
  ADD COLUMN IF NOT EXISTS expires_at date,
  ADD COLUMN IF NOT EXISTS agm_meeting_id uuid REFERENCES public.agm_meetings(id) ON DELETE SET NULL;
