-- RLS follow-up: module-scoped staff permissions, chat directory RPC, gallery upload lockdown.

-- ---------------------------------------------------------------------------
-- Permission helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.has_building_permission(
  p_user_id uuid,
  p_building_id uuid,
  p_module_key text,
  p_action permission_action
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_label text;
  v_company_id uuid;
  v_allowed boolean;
BEGIN
  IF public.is_super_admin(p_user_id) THEN
    RETURN true;
  END IF;

  SELECT company_id INTO v_company_id FROM public.buildings WHERE id = p_building_id;

  IF v_company_id IS NOT NULL AND public.is_company_owner_or_admin(p_user_id, v_company_id) THEN
    RETURN true;
  END IF;

  SELECT role_label INTO v_role_label
  FROM public.building_memberships
  WHERE profile_id = p_user_id AND building_id = p_building_id AND status = 'active'
  LIMIT 1;

  IF v_role_label IS NOT NULL THEN
    SELECT CASE p_action
      WHEN 'create' THEN can_create
      WHEN 'view' THEN can_view
      WHEN 'edit' THEN can_edit
      WHEN 'delete' THEN can_delete
      WHEN 'archive' THEN can_archive
    END INTO v_allowed
    FROM public.building_role_permission_defaults
    WHERE building_id = p_building_id
      AND role_label = v_role_label
      AND module_key = p_module_key
    LIMIT 1;

    IF v_allowed IS NOT NULL THEN
      RETURN v_allowed;
    END IF;

    IF v_role_label IN ('Company Owner', 'Company Administrator') THEN
      RETURN true;
    END IF;
  END IF;

  SELECT uo.building_admin_role_label INTO v_role_label
  FROM public.unit_occupancies uo
  WHERE uo.profile_id = p_user_id
    AND uo.building_id = p_building_id
    AND uo.archived_at IS NULL
    AND uo.can_access_building_admin = true
  LIMIT 1;

  IF v_role_label IS NOT NULL AND btrim(v_role_label) <> '' THEN
    SELECT CASE p_action
      WHEN 'create' THEN can_create
      WHEN 'view' THEN can_view
      WHEN 'edit' THEN can_edit
      WHEN 'delete' THEN can_delete
      WHEN 'archive' THEN can_archive
    END INTO v_allowed
    FROM public.building_role_permission_defaults
    WHERE building_id = p_building_id
      AND role_label = v_role_label
      AND module_key = p_module_key
    LIMIT 1;

    IF v_allowed IS NOT NULL THEN
      RETURN v_allowed;
    END IF;
  END IF;

  IF public.is_unit_resident(p_user_id, p_building_id) THEN
    RETURN p_action = 'view' AND p_module_key NOT IN ('company-subscriptions', 'external-data');
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_manage_building_module(
  p_user_id uuid,
  p_building_id uuid,
  p_module_key text,
  p_action permission_action DEFAULT 'edit'
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  IF p_user_id IS NULL OR p_building_id IS NULL OR p_module_key IS NULL OR btrim(p_module_key) = '' THEN
    RETURN false;
  END IF;

  IF public.has_building_permission(p_user_id, p_building_id, p_module_key, p_action) THEN
    RETURN true;
  END IF;

  SELECT company_id INTO v_company_id
  FROM public.buildings
  WHERE id = p_building_id;

  IF v_company_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.company_memberships cm
    JOIN public.company_member_buildings cmb ON cmb.membership_id = cm.id
    JOIN public.permission_modules pm ON pm.module_key = p_module_key
    WHERE cm.profile_id = p_user_id
      AND cmb.building_id = p_building_id
      AND pm.scope IN ('building', 'both')
      AND public.has_company_permission(
        p_user_id,
        v_company_id,
        p_module_key,
        p_action
      )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.can_manage_building(
  p_user_id uuid,
  p_building_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.can_manage_building_module(p_user_id, p_building_id, 'admins', 'edit');
$$;

-- ---------------------------------------------------------------------------
-- Chat directory (no neighbor PII from raw occupancy/profile tables)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_profile_primary_building(p_profile_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT x.building_id
  FROM (
    SELECT bm.building_id
    FROM public.building_memberships bm
    WHERE bm.profile_id = p_profile_id
      AND bm.status = 'active'
      AND bm.building_id IN (
        SELECT public.get_user_building_ids((SELECT auth.uid()))
      )
    UNION ALL
    SELECT uo.building_id
    FROM public.unit_occupancies uo
    WHERE uo.profile_id = p_profile_id
      AND uo.archived_at IS NULL
      AND uo.building_id IN (
        SELECT public.get_user_building_ids((SELECT auth.uid()))
      )
  ) x
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_building_chat_contacts(
  p_building_id uuid DEFAULT NULL
)
RETURNS TABLE (
  profile_id uuid,
  display_name text,
  role_label text,
  contact_kind text,
  email text,
  building_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH caller AS (
    SELECT auth.uid() AS user_id
  ),
  allowed_buildings AS (
    SELECT unnest(ARRAY(
      SELECT public.get_user_building_ids((SELECT user_id FROM caller))
    )) AS building_id
  ),
  target_buildings AS (
    SELECT ab.building_id
    FROM allowed_buildings ab
    WHERE p_building_id IS NULL OR ab.building_id = p_building_id
  )
  SELECT DISTINCT ON (bm.profile_id, bm.building_id)
    bm.profile_id,
    p.display_name,
    bm.role_label,
    'building_admin'::text AS contact_kind,
    CASE
      WHEN public.can_manage_building_module(
        (SELECT user_id FROM caller),
        bm.building_id,
        'admins',
        'view'
      ) THEN COALESCE(p.email, '')
      ELSE ''::text
    END AS email,
    bm.building_id
  FROM public.building_memberships bm
  JOIN public.profiles p ON p.id = bm.profile_id
  JOIN target_buildings tb ON tb.building_id = bm.building_id
  WHERE bm.status = 'active'
    AND bm.profile_id IS NOT NULL
    AND bm.profile_id <> (SELECT user_id FROM caller)

  UNION ALL

  SELECT DISTINCT ON (uo.profile_id, uo.building_id)
    uo.profile_id,
    COALESCE(NULLIF(btrim(p.display_name), ''), uo.resident_name) AS display_name,
    COALESCE(NULLIF(btrim(uo.resident_type::text), ''), 'Resident') AS role_label,
    'resident'::text AS contact_kind,
    CASE
      WHEN public.can_manage_building_module(
        (SELECT user_id FROM caller),
        uo.building_id,
        'units-users',
        'view'
      ) THEN COALESCE(NULLIF(btrim(p.email), ''), uo.email, '')
      ELSE ''::text
    END AS email,
    uo.building_id
  FROM public.unit_occupancies uo
  LEFT JOIN public.profiles p ON p.id = uo.profile_id
  JOIN target_buildings tb ON tb.building_id = uo.building_id
  WHERE uo.archived_at IS NULL
    AND uo.account_status = 'Activated'
    AND uo.profile_id IS NOT NULL
    AND uo.profile_id <> (SELECT user_id FROM caller);
$$;

REVOKE ALL ON FUNCTION public.get_profile_primary_building(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_building_chat_contacts(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_profile_primary_building(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_building_chat_contacts(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Remove broad neighbor PII reads
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS unit_occupancies_resident_directory_select ON public.unit_occupancies;
DROP POLICY IF EXISTS profiles_building_neighbor_select ON public.profiles;

-- ---------------------------------------------------------------------------
-- Re-apply building_admin_manage with module-scoped permissions
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT *
    FROM (
      VALUES
        ('portal_settings', 'portal-settings'),
        ('public_portal_settings', 'portal-settings'),
        ('portal_tile_settings', 'portal-settings'),
        ('portal_modules', 'portal-settings'),
        ('custom_portal_tiles', 'portal-settings'),
        ('portal_images', 'portal-settings'),
        ('public_portal_documents', 'documents'),
        ('registration_field_options', 'building-definitions'),
        ('profile_field_options', 'building-definitions'),
        ('news_items', 'news-notices'),
        ('document_folders', 'documents'),
        ('document_files', 'documents'),
        ('faq_items', 'faq'),
        ('board_faq_items', 'faq'),
        ('gallery_albums', 'galleries'),
        ('gallery_photos', 'galleries'),
        ('calendar_events', 'events'),
        ('agm_meetings', 'agm'),
        ('email_records', 'news-notices'),
        ('service_request_categories', 'service-requests'),
        ('incident_report_categories', 'incident-reports'),
        ('incident_contact_emails', 'incident-reports'),
        ('board_members', 'board-members'),
        ('board_approvals', 'board-approvals'),
        ('board_approval_votes', 'board-approvals'),
        ('board_approval_attachments', 'board-approvals'),
        ('polls', 'polls'),
        ('poll_questions', 'polls'),
        ('poll_attachments', 'polls'),
        ('board_elections', 'board-elections'),
        ('election_positions', 'board-elections'),
        ('election_candidates', 'board-elections'),
        ('certificate_files', 'status-certificates'),
        ('service_requests', 'service-requests'),
        ('incident_reports', 'incident-reports'),
        ('suggestions', 'suggestions'),
        ('status_certificates', 'status-certificates'),
        ('parking_requests', 'building-definitions'),
        ('fire_safety_submissions', 'fire-safety'),
        ('board_member_applications', 'board-members'),
        ('poll_responses', 'polls'),
        ('election_ballots', 'board-elections'),
        ('event_rsvps', 'events'),
        ('amenity_bookings', 'amenities'),
        ('service_request_attachments', 'service-requests'),
        ('incident_report_attachments', 'incident-reports'),
        ('comments', 'service-requests'),
        ('chat_conversations', 'chat'),
        ('chat_messages', 'chat'),
        ('building_amenity_settings', 'amenities'),
        ('building_amenity_resources', 'amenities'),
        ('occupancy_building_admin_modules', 'admins'),
        ('building_parking_groups', 'building-definitions'),
        ('building_locker_groups', 'building-definitions'),
        ('building_parking_pricing', 'building-definitions'),
        ('building_external_integrations', 'external-data'),
        ('building_compliance_profiles', 'compliance-dashboard'),
        ('compliance_obligations', 'compliance-dashboard'),
        ('director_training_records', 'compliance-dashboard'),
        ('building_links', 'building-definitions'),
        ('building_tax_settings', 'building-definitions'),
        ('building_reminders', 'building-definitions'),
        ('building_unit_groups', 'building-definitions'),
        ('building_subscriptions', 'company-subscriptions'),
        ('certificate_settings', 'status-certificates'),
        ('notification_preferences', 'units-users')
    ) AS cfg(table_name, module_key)
  LOOP
    IF to_regclass(format('public.%I', rec.table_name)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('DROP POLICY IF EXISTS building_admin_manage ON public.%I', rec.table_name);
    EXECUTE format(
      'CREATE POLICY building_admin_manage ON public.%I
        FOR ALL TO authenticated
        USING (
          public.can_manage_building_module(
            (SELECT auth.uid()),
            building_id,
            %L,
            ''edit''
          )
        )
        WITH CHECK (
          public.can_manage_building_module(
            (SELECT auth.uid()),
            building_id,
            %L,
            ''edit''
          )
        )',
      rec.table_name,
      rec.module_key,
      rec.module_key
    );
  END LOOP;
END $$;

-- Tables keyed without building_id on the row itself
DROP POLICY IF EXISTS building_unit_group_units_admin ON public.building_unit_group_units;
CREATE POLICY building_unit_group_units_admin ON public.building_unit_group_units
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.building_unit_groups bug
      WHERE bug.id = unit_group_id
        AND public.can_manage_building_module(
          (SELECT auth.uid()),
          bug.building_id,
          'building-definitions',
          'edit'
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.building_unit_groups bug
      WHERE bug.id = unit_group_id
        AND public.can_manage_building_module(
          (SELECT auth.uid()),
          bug.building_id,
          'building-definitions',
          'edit'
        )
    )
  );

DROP POLICY IF EXISTS certificate_history_admin ON public.certificate_history;
CREATE POLICY certificate_history_admin ON public.certificate_history
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.status_certificates sc
      WHERE sc.id = certificate_id
        AND public.can_manage_building_module(
          (SELECT auth.uid()),
          sc.building_id,
          'status-certificates',
          'edit'
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.status_certificates sc
      WHERE sc.id = certificate_id
        AND public.can_manage_building_module(
          (SELECT auth.uid()),
          sc.building_id,
          'status-certificates',
          'edit'
        )
    )
  );

DROP POLICY IF EXISTS unit_occupancies_admin_manage ON public.unit_occupancies;
CREATE POLICY unit_occupancies_admin_manage ON public.unit_occupancies
  FOR ALL TO authenticated
  USING (
    public.can_manage_building_module(
      (SELECT auth.uid()),
      building_id,
      'units-users',
      'edit'
    )
  )
  WITH CHECK (
    public.can_manage_building_module(
      (SELECT auth.uid()),
      building_id,
      'units-users',
      'edit'
    )
  );

DROP POLICY IF EXISTS units_building_admin_write ON public.units;
CREATE POLICY units_building_admin_write ON public.units
  FOR ALL TO authenticated
  USING (
    public.can_manage_building_module(
      (SELECT auth.uid()),
      building_id,
      'building-definitions',
      'edit'
    )
  )
  WITH CHECK (
    public.can_manage_building_module(
      (SELECT auth.uid()),
      building_id,
      'building-definitions',
      'edit'
    )
  );

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'resident_key_fobs',
    'resident_vehicles',
    'resident_guests',
    'resident_pets',
    'resident_maint_fees'
  ]
  LOOP
    IF to_regclass(format('public.%I', t)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_admin_manage', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I
        FOR ALL TO authenticated
        USING (
          public.can_manage_building_module(
            (SELECT auth.uid()),
            building_id,
            ''units-users'',
            ''edit''
          )
        )
        WITH CHECK (
          public.can_manage_building_module(
            (SELECT auth.uid()),
            building_id,
            ''units-users'',
            ''edit''
          )
        )',
      t || '_admin_manage',
      t
    );
  END LOOP;
END $$;

DROP POLICY IF EXISTS profiles_building_admin_select ON public.profiles;
CREATE POLICY profiles_building_admin_select ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.unit_occupancies uo
      WHERE uo.profile_id = profiles.id
        AND uo.archived_at IS NULL
        AND public.can_manage_building_module(
          (SELECT auth.uid()),
          uo.building_id,
          'units-users',
          'view'
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.building_memberships bm
      WHERE bm.profile_id = profiles.id
        AND public.can_manage_building_module(
          (SELECT auth.uid()),
          bm.building_id,
          'admins',
          'view'
        )
    )
  );

DROP POLICY IF EXISTS profiles_building_admin_update ON public.profiles;
CREATE POLICY profiles_building_admin_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.unit_occupancies uo
      WHERE uo.profile_id = profiles.id
        AND uo.archived_at IS NULL
        AND public.can_manage_building_module(
          (SELECT auth.uid()),
          uo.building_id,
          'units-users',
          'edit'
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.unit_occupancies uo
      WHERE uo.profile_id = profiles.id
        AND uo.archived_at IS NULL
        AND public.can_manage_building_module(
          (SELECT auth.uid()),
          uo.building_id,
          'units-users',
          'edit'
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Gallery storage: managers with galleries permission only
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS storage_gallery_photos_write ON storage.objects;
DROP POLICY IF EXISTS storage_gallery_photos_update ON storage.objects;
DROP POLICY IF EXISTS storage_gallery_photos_delete ON storage.objects;

CREATE POLICY storage_gallery_photos_write ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'gallery-photos'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT b.id
      FROM public.buildings b
      WHERE public.can_manage_building_module(
        (SELECT auth.uid()),
        b.id,
        'galleries',
        'edit'
      )
    )
  );

CREATE POLICY storage_gallery_photos_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'gallery-photos'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT b.id
      FROM public.buildings b
      WHERE public.can_manage_building_module(
        (SELECT auth.uid()),
        b.id,
        'galleries',
        'edit'
      )
    )
  )
  WITH CHECK (
    bucket_id = 'gallery-photos'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT b.id
      FROM public.buildings b
      WHERE public.can_manage_building_module(
        (SELECT auth.uid()),
        b.id,
        'galleries',
        'edit'
      )
    )
  );

CREATE POLICY storage_gallery_photos_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'gallery-photos'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT b.id
      FROM public.buildings b
      WHERE public.can_manage_building_module(
        (SELECT auth.uid()),
        b.id,
        'galleries',
        'edit'
      )
    )
  );

DROP POLICY IF EXISTS storage_building_write ON storage.objects;
DROP POLICY IF EXISTS storage_building_update ON storage.objects;
DROP POLICY IF EXISTS storage_building_delete ON storage.objects;

CREATE POLICY storage_building_write ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'building-documents'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT b.id
      FROM public.buildings b
      WHERE public.can_manage_building_module(
        (SELECT auth.uid()),
        b.id,
        'documents',
        'edit'
      )
    )
  );

CREATE POLICY storage_building_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'building-documents'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT b.id
      FROM public.buildings b
      WHERE public.can_manage_building_module(
        (SELECT auth.uid()),
        b.id,
        'documents',
        'edit'
      )
    )
  )
  WITH CHECK (
    bucket_id = 'building-documents'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT b.id
      FROM public.buildings b
      WHERE public.can_manage_building_module(
        (SELECT auth.uid()),
        b.id,
        'documents',
        'edit'
      )
    )
  );

CREATE POLICY storage_building_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'building-documents'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT b.id
      FROM public.buildings b
      WHERE public.can_manage_building_module(
        (SELECT auth.uid()),
        b.id,
        'documents',
        'edit'
      )
    )
  );

NOTIFY pgrst, 'reload schema';
