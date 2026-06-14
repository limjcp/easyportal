-- Portal self-signup requests (pending property-manager approval)

CREATE TABLE public.portal_signup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  unit_number text NOT NULL,
  first_name text NOT NULL,
  corp_number text NOT NULL,
  city text NOT NULL,
  resident_type text NOT NULL,
  email text NOT NULL,
  quickbooks_matched boolean NOT NULL DEFAULT false,
  quickbooks_balance text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX portal_signup_requests_building_idx ON public.portal_signup_requests(building_id);
CREATE INDEX portal_signup_requests_status_idx ON public.portal_signup_requests(status);
CREATE INDEX portal_signup_requests_email_idx ON public.portal_signup_requests(email);

ALTER TABLE public.portal_signup_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY portal_signup_requests_super ON public.portal_signup_requests FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));

CREATE POLICY portal_signup_requests_building ON public.portal_signup_requests FOR ALL TO authenticated
  USING (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))))
  WITH CHECK (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))));

CREATE POLICY portal_signup_requests_insert_own ON public.portal_signup_requests FOR INSERT TO authenticated
  WITH CHECK (profile_id = (SELECT auth.uid()));
