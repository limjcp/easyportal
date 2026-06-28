-- Restore building-member SELECT on portal config and resident content tables.
-- RLS hardening (20250628000012) removed member reads; residents need read access
-- while writes remain admin-only via building_admin_manage.

DO $$
DECLARE
  t text;
  resident_read_tables text[] := ARRAY[
    'portal_settings',
    'public_portal_settings',
    'portal_tile_settings',
    'portal_modules',
    'custom_portal_tiles',
    'portal_images',
    'public_portal_documents',
    'registration_field_options',
    'profile_field_options',
    'news_items',
    'document_folders',
    'document_files',
    'faq_items',
    'board_faq_items',
    'gallery_albums',
    'gallery_photos',
    'calendar_events',
    'agm_meetings',
    'email_records',
    'service_request_categories',
    'incident_report_categories',
    'incident_contact_emails',
    'board_members',
    'board_approvals',
    'board_approval_votes',
    'board_approval_attachments',
    'polls',
    'poll_questions',
    'poll_attachments',
    'board_elections',
    'election_positions',
    'election_candidates',
    'certificate_files',
    'certificate_settings',
    'notification_preferences'
  ];
BEGIN
  FOREACH t IN ARRAY resident_read_tables
  LOOP
    IF to_regclass(format('public.%I', t)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('DROP POLICY IF EXISTS building_member_select ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY building_member_select ON public.%I
        FOR SELECT TO authenticated
        USING (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))))',
      t
    );
  END LOOP;
END $$;
