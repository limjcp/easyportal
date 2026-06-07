-- Migration 009: RLS policies and storage buckets

-- Helper to apply super-admin + building member read/write policies
CREATE OR REPLACE FUNCTION public.apply_building_table_rls(p_table regclass, p_building_col text DEFAULT 'building_id')
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  t text := p_table::text;
BEGIN
  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', t);

  EXECUTE format('DROP POLICY IF EXISTS super_admin_all ON %s', t);
  EXECUTE format(
    'CREATE POLICY super_admin_all ON %s FOR ALL TO authenticated USING (public.is_super_admin((select auth.uid()))) WITH CHECK (public.is_super_admin((select auth.uid())))',
    t
  );

  EXECUTE format('DROP POLICY IF EXISTS building_member_select ON %s', t);
  EXECUTE format(
    'CREATE POLICY building_member_select ON %s FOR SELECT TO authenticated USING (%I IN (SELECT public.get_user_building_ids((select auth.uid()))))',
    t, p_building_col
  );

  EXECUTE format('DROP POLICY IF EXISTS building_member_write ON %s', t);
  EXECUTE format(
    'CREATE POLICY building_member_write ON %s FOR ALL TO authenticated USING (%I IN (SELECT public.get_user_building_ids((select auth.uid())))) WITH CHECK (%I IN (SELECT public.get_user_building_ids((select auth.uid()))))',
    t, p_building_col, p_building_col
  );
END;
$$;

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_super_admin ON public.profiles FOR ALL TO authenticated
  USING (public.is_super_admin((select auth.uid())))
  WITH CHECK (public.is_super_admin((select auth.uid())));
CREATE POLICY profiles_self_select ON public.profiles FOR SELECT TO authenticated
  USING (id = (select auth.uid()));
CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- Consultation (public insert, admin read)
ALTER TABLE public.consultation_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY consultation_super_admin ON public.consultation_submissions FOR ALL TO authenticated
  USING (public.is_super_admin((select auth.uid())))
  WITH CHECK (public.is_super_admin((select auth.uid())));
CREATE POLICY consultation_public_insert ON public.consultation_submissions FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Company-scoped tables
ALTER TABLE public.management_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY companies_super_admin ON public.management_companies FOR ALL TO authenticated
  USING (public.is_super_admin((select auth.uid())))
  WITH CHECK (public.is_super_admin((select auth.uid())));
CREATE POLICY companies_member ON public.management_companies FOR SELECT TO authenticated
  USING (id IN (SELECT public.get_user_company_ids((select auth.uid()))));
CREATE POLICY companies_member_write ON public.management_companies FOR ALL TO authenticated
  USING (public.is_company_owner_or_admin((select auth.uid()), id))
  WITH CHECK (public.is_company_owner_or_admin((select auth.uid()), id));

ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
CREATE POLICY buildings_super_admin ON public.buildings FOR ALL TO authenticated
  USING (public.is_super_admin((select auth.uid())))
  WITH CHECK (public.is_super_admin((select auth.uid())));
CREATE POLICY buildings_access ON public.buildings FOR SELECT TO authenticated
  USING (id IN (SELECT public.get_user_building_ids((select auth.uid()))));
CREATE POLICY buildings_company_write ON public.buildings FOR ALL TO authenticated
  USING (public.is_company_owner_or_admin((select auth.uid()), company_id))
  WITH CHECK (public.is_company_owner_or_admin((select auth.uid()), company_id));

-- Membership tables
ALTER TABLE public.company_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY company_memberships_super ON public.company_memberships FOR ALL TO authenticated
  USING (public.is_super_admin((select auth.uid())))
  WITH CHECK (public.is_super_admin((select auth.uid())));
CREATE POLICY company_memberships_self ON public.company_memberships FOR SELECT TO authenticated
  USING (profile_id = (select auth.uid()) OR company_id IN (SELECT public.get_user_company_ids((select auth.uid()))));

ALTER TABLE public.company_member_buildings ENABLE ROW LEVEL SECURITY;
CREATE POLICY company_member_buildings_super ON public.company_member_buildings FOR ALL TO authenticated
  USING (public.is_super_admin((select auth.uid())))
  WITH CHECK (public.is_super_admin((select auth.uid())));

ALTER TABLE public.building_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY building_memberships_super ON public.building_memberships FOR ALL TO authenticated
  USING (public.is_super_admin((select auth.uid())))
  WITH CHECK (public.is_super_admin((select auth.uid())));
CREATE POLICY building_memberships_read ON public.building_memberships FOR SELECT TO authenticated
  USING (building_id IN (SELECT public.get_user_building_ids((select auth.uid()))));

ALTER TABLE public.unit_occupancies ENABLE ROW LEVEL SECURITY;
CREATE POLICY unit_occupancies_super ON public.unit_occupancies FOR ALL TO authenticated
  USING (public.is_super_admin((select auth.uid())))
  WITH CHECK (public.is_super_admin((select auth.uid())));
CREATE POLICY unit_occupancies_building ON public.unit_occupancies FOR SELECT TO authenticated
  USING (building_id IN (SELECT public.get_user_building_ids((select auth.uid()))));
CREATE POLICY unit_occupancies_self ON public.unit_occupancies FOR UPDATE TO authenticated
  USING (profile_id = (select auth.uid()))
  WITH CHECK (profile_id = (select auth.uid()));

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY vendors_super ON public.vendors FOR ALL TO authenticated
  USING (public.is_super_admin((select auth.uid())))
  WITH CHECK (public.is_super_admin((select auth.uid())));
CREATE POLICY vendors_company ON public.vendors FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids((select auth.uid()))));

ALTER TABLE public.vendor_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY vendor_users_super ON public.vendor_users FOR ALL TO authenticated
  USING (public.is_super_admin((select auth.uid())))
  WITH CHECK (public.is_super_admin((select auth.uid())));
CREATE POLICY vendor_users_self ON public.vendor_users FOR SELECT TO authenticated
  USING (profile_id = (select auth.uid()));

-- Apply building-scoped RLS to operational tables
SELECT public.apply_building_table_rls('public.portal_settings');
SELECT public.apply_building_table_rls('public.public_portal_settings');
SELECT public.apply_building_table_rls('public.portal_tile_settings');
SELECT public.apply_building_table_rls('public.portal_modules');
SELECT public.apply_building_table_rls('public.custom_portal_tiles');
SELECT public.apply_building_table_rls('public.portal_images');
SELECT public.apply_building_table_rls('public.public_portal_documents');
SELECT public.apply_building_table_rls('public.registration_field_options');
SELECT public.apply_building_table_rls('public.profile_field_options');
SELECT public.apply_building_table_rls('public.news_items');
SELECT public.apply_building_table_rls('public.newsletters');
SELECT public.apply_building_table_rls('public.document_folders');
SELECT public.apply_building_table_rls('public.document_files');
SELECT public.apply_building_table_rls('public.faq_items');
SELECT public.apply_building_table_rls('public.board_faq_items');
SELECT public.apply_building_table_rls('public.gallery_albums');
SELECT public.apply_building_table_rls('public.gallery_photos');
SELECT public.apply_building_table_rls('public.calendar_events');
SELECT public.apply_building_table_rls('public.event_rsvps');
SELECT public.apply_building_table_rls('public.agm_meetings');
SELECT public.apply_building_table_rls('public.comments');
SELECT public.apply_building_table_rls('public.email_records');
SELECT public.apply_building_table_rls('public.service_request_categories');
SELECT public.apply_building_table_rls('public.service_requests');
SELECT public.apply_building_table_rls('public.service_request_attachments');
SELECT public.apply_building_table_rls('public.incident_report_categories');
SELECT public.apply_building_table_rls('public.incident_contact_emails');
SELECT public.apply_building_table_rls('public.incident_reports');
SELECT public.apply_building_table_rls('public.incident_report_attachments');
SELECT public.apply_building_table_rls('public.suggestions');
SELECT public.apply_building_table_rls('public.status_certificates');
SELECT public.apply_building_table_rls('public.certificate_files');
SELECT public.apply_building_table_rls('public.parking_requests');
SELECT public.apply_building_table_rls('public.fire_safety_submissions');
SELECT public.apply_building_table_rls('public.board_members');
SELECT public.apply_building_table_rls('public.board_member_applications');
SELECT public.apply_building_table_rls('public.board_approvals');
SELECT public.apply_building_table_rls('public.board_approval_votes');
SELECT public.apply_building_table_rls('public.board_approval_attachments');
SELECT public.apply_building_table_rls('public.polls');
SELECT public.apply_building_table_rls('public.poll_questions');
SELECT public.apply_building_table_rls('public.poll_attachments');
SELECT public.apply_building_table_rls('public.poll_responses');
SELECT public.apply_building_table_rls('public.board_elections');
SELECT public.apply_building_table_rls('public.election_positions');
SELECT public.apply_building_table_rls('public.election_candidates');
SELECT public.apply_building_table_rls('public.election_ballots');
SELECT public.apply_building_table_rls('public.chat_conversations');
SELECT public.apply_building_table_rls('public.chat_messages');

-- Building external integrations: super admin + service role only for secrets
ALTER TABLE public.building_external_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY external_integrations_super ON public.building_external_integrations FOR ALL TO authenticated
  USING (public.is_super_admin((select auth.uid())))
  WITH CHECK (public.is_super_admin((select auth.uid())));

-- Purchase orders
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY po_super ON public.purchase_orders FOR ALL TO authenticated
  USING (public.is_super_admin((select auth.uid())))
  WITH CHECK (public.is_super_admin((select auth.uid())));
CREATE POLICY po_company ON public.purchase_orders FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids((select auth.uid()))));
CREATE POLICY po_vendor ON public.purchase_orders FOR SELECT TO authenticated
  USING (vendor_id IN (SELECT vendor_id FROM public.vendor_users WHERE profile_id = (select auth.uid())));

-- Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('building-documents', 'building-documents', false, 52428800),
  ('public-portal-documents', 'public-portal-documents', true, 52428800),
  ('gallery-photos', 'gallery-photos', false, 52428800),
  ('incident-attachments', 'incident-attachments', false, 52428800),
  ('certificate-files', 'certificate-files', false, 52428800),
  ('fire-safety-photos', 'fire-safety-photos', false, 52428800),
  ('poll-attachments', 'poll-attachments', false, 52428800),
  ('avatars', 'avatars', true, 5242880)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY storage_super_admin ON storage.objects FOR ALL TO authenticated
  USING (public.is_super_admin((select auth.uid())))
  WITH CHECK (public.is_super_admin((select auth.uid())));

CREATE POLICY storage_building_access ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id IN ('building-documents', 'gallery-photos', 'incident-attachments', 'certificate-files', 'fire-safety-photos', 'poll-attachments')
    AND (storage.foldername(name))[1]::uuid IN (SELECT public.get_user_building_ids((select auth.uid())))
  );

CREATE POLICY storage_avatars_own ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid())::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid())::text);

CREATE POLICY storage_public_portal_read ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'public-portal-documents');

DROP FUNCTION public.apply_building_table_rls(regclass, text);
