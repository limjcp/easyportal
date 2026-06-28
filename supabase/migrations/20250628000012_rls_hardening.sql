-- RLS hardening: separate building admin write access from resident read/self-service.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

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
  SELECT
    public.is_super_admin(p_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.buildings b
      WHERE b.id = p_building_id
        AND public.is_company_owner_or_admin(p_user_id, b.company_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.building_memberships bm
      WHERE bm.profile_id = p_user_id
        AND bm.building_id = p_building_id
        AND bm.status = 'active'
    )
    OR EXISTS (
      SELECT 1
      FROM public.unit_occupancies uo
      WHERE uo.profile_id = p_user_id
        AND uo.building_id = p_building_id
        AND uo.archived_at IS NULL
        AND uo.can_access_building_admin = true
    )
    OR EXISTS (
      SELECT 1
      FROM public.company_memberships cm
      JOIN public.company_member_buildings cmb ON cmb.membership_id = cm.id
      WHERE cm.profile_id = p_user_id
        AND cmb.building_id = p_building_id
    );
$$;

CREATE OR REPLACE FUNCTION public.is_chat_participant(
  p_conversation_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_conversation_participants cp
    WHERE cp.conversation_id = p_conversation_id
      AND cp.profile_id = p_user_id
  );
$$;

-- ---------------------------------------------------------------------------
-- Profiles: stop residents updating neighbors; keep co-resident read for chat
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS profiles_building_admin_select ON public.profiles;
CREATE POLICY profiles_building_admin_select ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.can_manage_building((SELECT auth.uid()), (
      SELECT uo.building_id
      FROM public.unit_occupancies uo
      WHERE uo.profile_id = profiles.id
        AND uo.archived_at IS NULL
      LIMIT 1
    ))
    OR EXISTS (
      SELECT 1
      FROM public.building_memberships bm
      WHERE bm.profile_id = profiles.id
        AND public.can_manage_building((SELECT auth.uid()), bm.building_id)
    )
  );

DROP POLICY IF EXISTS profiles_building_admin_update ON public.profiles;
CREATE POLICY profiles_building_admin_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.can_manage_building((SELECT auth.uid()), (
    SELECT uo.building_id
    FROM public.unit_occupancies uo
    WHERE uo.profile_id = profiles.id
      AND uo.archived_at IS NULL
    LIMIT 1
  )))
  WITH CHECK (public.can_manage_building((SELECT auth.uid()), (
    SELECT uo.building_id
    FROM public.unit_occupancies uo
    WHERE uo.profile_id = profiles.id
      AND uo.archived_at IS NULL
    LIMIT 1
  )));

DROP POLICY IF EXISTS profiles_building_neighbor_select ON public.profiles;
CREATE POLICY profiles_building_neighbor_select ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.unit_occupancies mine
      JOIN public.unit_occupancies theirs ON theirs.building_id = mine.building_id
      WHERE mine.profile_id = (SELECT auth.uid())
        AND theirs.profile_id = profiles.id
        AND mine.archived_at IS NULL
        AND theirs.archived_at IS NULL
        AND theirs.account_status = 'Activated'
    )
    OR EXISTS (
      SELECT 1
      FROM public.building_memberships mine
      JOIN public.building_memberships theirs ON theirs.building_id = mine.building_id
      WHERE mine.profile_id = (SELECT auth.uid())
        AND theirs.profile_id = profiles.id
        AND mine.status = 'active'
        AND theirs.status = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- Unit occupancies: admin write; residents read building directory + own row
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS unit_occupancies_building ON public.unit_occupancies;
DROP POLICY IF EXISTS unit_occupancies_building_write ON public.unit_occupancies;

CREATE POLICY unit_occupancies_admin_manage ON public.unit_occupancies
  FOR ALL TO authenticated
  USING (public.can_manage_building((SELECT auth.uid()), building_id))
  WITH CHECK (public.can_manage_building((SELECT auth.uid()), building_id));

CREATE POLICY unit_occupancies_self_select ON public.unit_occupancies
  FOR SELECT TO authenticated
  USING (profile_id = (SELECT auth.uid()));

CREATE POLICY unit_occupancies_resident_directory_select ON public.unit_occupancies
  FOR SELECT TO authenticated
  USING (
    public.is_unit_resident((SELECT auth.uid()), building_id)
    AND archived_at IS NULL
  );

-- ---------------------------------------------------------------------------
-- Units / unit groups: residents read; admins write
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS units_building_write ON public.units;
CREATE POLICY units_building_admin_write ON public.units
  FOR ALL TO authenticated
  USING (public.can_manage_building((SELECT auth.uid()), building_id))
  WITH CHECK (public.can_manage_building((SELECT auth.uid()), building_id));

DROP POLICY IF EXISTS building_unit_groups_building ON public.building_unit_groups;
CREATE POLICY building_unit_groups_select ON public.building_unit_groups
  FOR SELECT TO authenticated
  USING (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))));
CREATE POLICY building_unit_groups_admin_write ON public.building_unit_groups
  FOR ALL TO authenticated
  USING (public.can_manage_building((SELECT auth.uid()), building_id))
  WITH CHECK (public.can_manage_building((SELECT auth.uid()), building_id));

-- ---------------------------------------------------------------------------
-- Building-scoped tables: replace broad write with admin manage
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  t text;
  admin_only_tables text[] := ARRAY[
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
    'certificate_files'
  ];
BEGIN
  FOREACH t IN ARRAY admin_only_tables
  LOOP
    IF to_regclass(format('public.%I', t)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('DROP POLICY IF EXISTS building_member_select ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS building_member_write ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS building_admin_manage ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY building_admin_manage ON public.%I
        FOR ALL TO authenticated
        USING (public.can_manage_building((SELECT auth.uid()), building_id))
        WITH CHECK (public.can_manage_building((SELECT auth.uid()), building_id))',
      t
    );
  END LOOP;
END $$;

-- Resident self-service tables
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT *
    FROM (
      VALUES
        ('service_requests', 'created_by_profile_id'),
        ('incident_reports', 'created_by_profile_id'),
        ('suggestions', 'profile_id'),
        ('status_certificates', 'requested_by_profile_id'),
        ('parking_requests', 'profile_id'),
        ('fire_safety_submissions', 'profile_id'),
        ('board_member_applications', 'profile_id'),
        ('poll_responses', 'profile_id'),
        ('election_ballots', 'profile_id'),
        ('event_rsvps', 'profile_id'),
        ('amenity_bookings', 'profile_id')
    ) AS cfg(table_name, owner_col)
  LOOP
    IF to_regclass(format('public.%I', rec.table_name)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('DROP POLICY IF EXISTS building_member_select ON public.%I', rec.table_name);
    EXECUTE format('DROP POLICY IF EXISTS building_member_write ON public.%I', rec.table_name);
    EXECUTE format('DROP POLICY IF EXISTS building_admin_manage ON public.%I', rec.table_name);
    EXECUTE format('DROP POLICY IF EXISTS resident_own_rows ON public.%I', rec.table_name);

    EXECUTE format(
      'CREATE POLICY building_admin_manage ON public.%I
        FOR ALL TO authenticated
        USING (public.can_manage_building((SELECT auth.uid()), building_id))
        WITH CHECK (public.can_manage_building((SELECT auth.uid()), building_id))',
      rec.table_name
    );

    EXECUTE format(
      'CREATE POLICY resident_own_rows ON public.%I
        FOR ALL TO authenticated
        USING (
          %I = (SELECT auth.uid())
          AND building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid())))
        )
        WITH CHECK (
          %I = (SELECT auth.uid())
          AND building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid())))
        )',
      rec.table_name,
      rec.owner_col,
      rec.owner_col
    );
  END LOOP;
END $$;

-- Attachments tied to owned parent records
DROP POLICY IF EXISTS building_member_select ON public.service_request_attachments;
DROP POLICY IF EXISTS building_member_write ON public.service_request_attachments;
DROP POLICY IF EXISTS building_admin_manage ON public.service_request_attachments;
DROP POLICY IF EXISTS resident_own_parent ON public.service_request_attachments;

CREATE POLICY building_admin_manage ON public.service_request_attachments
  FOR ALL TO authenticated
  USING (public.can_manage_building((SELECT auth.uid()), building_id))
  WITH CHECK (public.can_manage_building((SELECT auth.uid()), building_id));

CREATE POLICY resident_own_parent ON public.service_request_attachments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.service_requests sr
      WHERE sr.id = service_request_id
        AND sr.created_by_profile_id = (SELECT auth.uid())
        AND sr.building_id = building_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.service_requests sr
      WHERE sr.id = service_request_id
        AND sr.created_by_profile_id = (SELECT auth.uid())
        AND sr.building_id = building_id
    )
  );

DROP POLICY IF EXISTS building_member_select ON public.incident_report_attachments;
DROP POLICY IF EXISTS building_member_write ON public.incident_report_attachments;
DROP POLICY IF EXISTS building_admin_manage ON public.incident_report_attachments;
DROP POLICY IF EXISTS resident_own_parent ON public.incident_report_attachments;

CREATE POLICY building_admin_manage ON public.incident_report_attachments
  FOR ALL TO authenticated
  USING (public.can_manage_building((SELECT auth.uid()), building_id))
  WITH CHECK (public.can_manage_building((SELECT auth.uid()), building_id));

CREATE POLICY resident_own_parent ON public.incident_report_attachments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.incident_reports ir
      WHERE ir.id = incident_report_id
        AND ir.created_by_profile_id = (SELECT auth.uid())
        AND ir.building_id = building_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.incident_reports ir
      WHERE ir.id = incident_report_id
        AND ir.created_by_profile_id = (SELECT auth.uid())
        AND ir.building_id = building_id
    )
  );

-- Comments: residents read public comments in their building; admins manage all
DROP POLICY IF EXISTS building_member_select ON public.comments;
DROP POLICY IF EXISTS building_member_write ON public.comments;
DROP POLICY IF EXISTS building_admin_manage ON public.comments;
DROP POLICY IF EXISTS comments_public_read ON public.comments;
DROP POLICY IF EXISTS comments_resident_insert ON public.comments;

CREATE POLICY building_admin_manage ON public.comments
  FOR ALL TO authenticated
  USING (public.can_manage_building((SELECT auth.uid()), building_id))
  WITH CHECK (public.can_manage_building((SELECT auth.uid()), building_id));

CREATE POLICY comments_public_read ON public.comments
  FOR SELECT TO authenticated
  USING (
    visibility = 'public'
    AND building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid())))
  );

CREATE POLICY comments_resident_insert ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (
    author_profile_id = (SELECT auth.uid())
    AND building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid())))
  );

-- Chat: participant-scoped, not building-wide write
DROP POLICY IF EXISTS building_member_write ON public.chat_conversations;
DROP POLICY IF EXISTS building_member_select ON public.chat_conversations;
DROP POLICY IF EXISTS building_admin_manage ON public.chat_conversations;
DROP POLICY IF EXISTS chat_conversations_participant ON public.chat_conversations;
DROP POLICY IF EXISTS chat_conversations_insert ON public.chat_conversations;

CREATE POLICY chat_conversations_participant ON public.chat_conversations
  FOR SELECT TO authenticated
  USING (public.is_chat_participant(id, (SELECT auth.uid())));

CREATE POLICY chat_conversations_insert ON public.chat_conversations
  FOR INSERT TO authenticated
  WITH CHECK (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))));

CREATE POLICY chat_conversations_participant_update ON public.chat_conversations
  FOR UPDATE TO authenticated
  USING (public.is_chat_participant(id, (SELECT auth.uid())))
  WITH CHECK (public.is_chat_participant(id, (SELECT auth.uid())));

CREATE POLICY building_admin_manage ON public.chat_conversations
  FOR ALL TO authenticated
  USING (public.can_manage_building((SELECT auth.uid()), building_id))
  WITH CHECK (public.can_manage_building((SELECT auth.uid()), building_id));

DROP POLICY IF EXISTS building_member_write ON public.chat_messages;
DROP POLICY IF EXISTS building_member_select ON public.chat_messages;
DROP POLICY IF EXISTS building_admin_manage ON public.chat_messages;
DROP POLICY IF EXISTS chat_messages_participant ON public.chat_messages;

CREATE POLICY chat_messages_participant ON public.chat_messages
  FOR ALL TO authenticated
  USING (public.is_chat_participant(conversation_id, (SELECT auth.uid())))
  WITH CHECK (
    sender_profile_id = (SELECT auth.uid())
    AND public.is_chat_participant(conversation_id, (SELECT auth.uid()))
  );

CREATE POLICY building_admin_manage ON public.chat_messages
  FOR ALL TO authenticated
  USING (public.can_manage_building((SELECT auth.uid()), building_id))
  WITH CHECK (public.can_manage_building((SELECT auth.uid()), building_id));

-- Amenity settings/resources: residents read; admins write
DROP POLICY IF EXISTS amenity_bookings_building ON public.amenity_bookings;
DROP POLICY IF EXISTS building_amenity_settings_building ON public.building_amenity_settings;
DROP POLICY IF EXISTS building_amenity_resources_building ON public.building_amenity_resources;
DROP POLICY IF EXISTS occupancy_building_admin_modules_building ON public.occupancy_building_admin_modules;

CREATE POLICY building_amenity_settings_select ON public.building_amenity_settings
  FOR SELECT TO authenticated
  USING (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))));
CREATE POLICY building_amenity_settings_admin_write ON public.building_amenity_settings
  FOR ALL TO authenticated
  USING (public.can_manage_building((SELECT auth.uid()), building_id))
  WITH CHECK (public.can_manage_building((SELECT auth.uid()), building_id));

CREATE POLICY building_amenity_resources_select ON public.building_amenity_resources
  FOR SELECT TO authenticated
  USING (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))));
CREATE POLICY building_amenity_resources_admin_write ON public.building_amenity_resources
  FOR ALL TO authenticated
  USING (public.can_manage_building((SELECT auth.uid()), building_id))
  WITH CHECK (public.can_manage_building((SELECT auth.uid()), building_id));

CREATE POLICY occupancy_building_admin_modules_admin ON public.occupancy_building_admin_modules
  FOR ALL TO authenticated
  USING (public.can_manage_building((SELECT auth.uid()), building_id))
  WITH CHECK (public.can_manage_building((SELECT auth.uid()), building_id));

-- Parking/locker config tables
DROP POLICY IF EXISTS building_parking_groups_building ON public.building_parking_groups;
DROP POLICY IF EXISTS building_locker_groups_building ON public.building_locker_groups;
DROP POLICY IF EXISTS building_parking_pricing_building ON public.building_parking_pricing;

CREATE POLICY building_parking_groups_select ON public.building_parking_groups
  FOR SELECT TO authenticated
  USING (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))));
CREATE POLICY building_parking_groups_admin_write ON public.building_parking_groups
  FOR ALL TO authenticated
  USING (public.can_manage_building((SELECT auth.uid()), building_id))
  WITH CHECK (public.can_manage_building((SELECT auth.uid()), building_id));

CREATE POLICY building_locker_groups_select ON public.building_locker_groups
  FOR SELECT TO authenticated
  USING (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))));
CREATE POLICY building_locker_groups_admin_write ON public.building_locker_groups
  FOR ALL TO authenticated
  USING (public.can_manage_building((SELECT auth.uid()), building_id))
  WITH CHECK (public.can_manage_building((SELECT auth.uid()), building_id));

CREATE POLICY building_parking_pricing_select ON public.building_parking_pricing
  FOR SELECT TO authenticated
  USING (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))));
CREATE POLICY building_parking_pricing_admin_write ON public.building_parking_pricing
  FOR ALL TO authenticated
  USING (public.can_manage_building((SELECT auth.uid()), building_id))
  WITH CHECK (public.can_manage_building((SELECT auth.uid()), building_id));

-- Resident detail tables: admin manage + self only (remove building-wide write)
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
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_building', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_admin_manage', t);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I
        FOR ALL TO authenticated
        USING (public.can_manage_building((SELECT auth.uid()), building_id))
        WITH CHECK (public.can_manage_building((SELECT auth.uid()), building_id))',
      t || '_admin_manage',
      t
    );
  END LOOP;
END $$;

-- Compliance tracking: admin manage only
DROP POLICY IF EXISTS building_compliance_profiles_building ON public.building_compliance_profiles;
DROP POLICY IF EXISTS compliance_obligations_building ON public.compliance_obligations;
DROP POLICY IF EXISTS director_training_records_building ON public.director_training_records;

CREATE POLICY building_compliance_profiles_admin ON public.building_compliance_profiles
  FOR ALL TO authenticated
  USING (public.can_manage_building((SELECT auth.uid()), building_id))
  WITH CHECK (public.can_manage_building((SELECT auth.uid()), building_id));

CREATE POLICY compliance_obligations_admin ON public.compliance_obligations
  FOR ALL TO authenticated
  USING (public.can_manage_building((SELECT auth.uid()), building_id))
  WITH CHECK (public.can_manage_building((SELECT auth.uid()), building_id));

CREATE POLICY director_training_records_admin ON public.director_training_records
  FOR ALL TO authenticated
  USING (public.can_manage_building((SELECT auth.uid()), building_id))
  WITH CHECK (public.can_manage_building((SELECT auth.uid()), building_id));

-- External integrations: admin only (not all building members)
DROP POLICY IF EXISTS external_integrations_building_member ON public.building_external_integrations;
CREATE POLICY external_integrations_building_admin ON public.building_external_integrations
  FOR ALL TO authenticated
  USING (public.can_manage_building((SELECT auth.uid()), building_id))
  WITH CHECK (public.can_manage_building((SELECT auth.uid()), building_id));

-- ---------------------------------------------------------------------------
-- Tables that previously had no RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.building_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_tax_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_unit_group_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_name_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY building_links_super ON public.building_links
  FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));
CREATE POLICY building_links_admin ON public.building_links
  FOR ALL TO authenticated
  USING (public.can_manage_building((SELECT auth.uid()), building_id))
  WITH CHECK (public.can_manage_building((SELECT auth.uid()), building_id));

CREATE POLICY building_tax_settings_super ON public.building_tax_settings
  FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));
CREATE POLICY building_tax_settings_admin ON public.building_tax_settings
  FOR ALL TO authenticated
  USING (public.can_manage_building((SELECT auth.uid()), building_id))
  WITH CHECK (public.can_manage_building((SELECT auth.uid()), building_id));

CREATE POLICY building_reminders_super ON public.building_reminders
  FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));
CREATE POLICY building_reminders_admin ON public.building_reminders
  FOR ALL TO authenticated
  USING (public.can_manage_building((SELECT auth.uid()), building_id))
  WITH CHECK (public.can_manage_building((SELECT auth.uid()), building_id));

CREATE POLICY building_unit_group_units_super ON public.building_unit_group_units
  FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));
CREATE POLICY building_unit_group_units_admin ON public.building_unit_group_units
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.building_unit_groups bug
      WHERE bug.id = unit_group_id
        AND public.can_manage_building((SELECT auth.uid()), bug.building_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.building_unit_groups bug
      WHERE bug.id = unit_group_id
        AND public.can_manage_building((SELECT auth.uid()), bug.building_id)
    )
  );

CREATE POLICY building_subscriptions_super ON public.building_subscriptions
  FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));
CREATE POLICY building_subscriptions_admin ON public.building_subscriptions
  FOR ALL TO authenticated
  USING (public.can_manage_building((SELECT auth.uid()), building_id))
  WITH CHECK (public.can_manage_building((SELECT auth.uid()), building_id));

CREATE POLICY company_subscriptions_super ON public.company_subscriptions
  FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));
CREATE POLICY company_subscriptions_company ON public.company_subscriptions
  FOR ALL TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids((SELECT auth.uid()))))
  WITH CHECK (public.is_company_owner_or_admin((SELECT auth.uid()), company_id));

CREATE POLICY stripe_payouts_super ON public.stripe_payouts
  FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));
CREATE POLICY stripe_payouts_company ON public.stripe_payouts
  FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids((SELECT auth.uid()))));
CREATE POLICY stripe_payouts_company_admin ON public.stripe_payouts
  FOR ALL TO authenticated
  USING (public.is_company_owner_or_admin((SELECT auth.uid()), company_id))
  WITH CHECK (public.is_company_owner_or_admin((SELECT auth.uid()), company_id));

CREATE POLICY vendor_invitations_super ON public.vendor_invitations
  FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));
CREATE POLICY vendor_invitations_company ON public.vendor_invitations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.vendors v
      WHERE v.id = vendor_id
        AND public.has_company_permission(
          (SELECT auth.uid()),
          v.company_id,
          'company-vendors',
          'edit'
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.vendors v
      WHERE v.id = vendor_id
        AND public.has_company_permission(
          (SELECT auth.uid()),
          v.company_id,
          'company-vendors',
          'edit'
        )
    )
  );

CREATE POLICY role_name_overrides_super ON public.role_name_overrides
  FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));
CREATE POLICY role_name_overrides_company ON public.role_name_overrides
  FOR ALL TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids((SELECT auth.uid()))))
  WITH CHECK (public.is_company_owner_or_admin((SELECT auth.uid()), company_id));

CREATE POLICY certificate_settings_super ON public.certificate_settings
  FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));
CREATE POLICY certificate_settings_admin ON public.certificate_settings
  FOR ALL TO authenticated
  USING (public.can_manage_building((SELECT auth.uid()), building_id))
  WITH CHECK (public.can_manage_building((SELECT auth.uid()), building_id));

CREATE POLICY certificate_history_super ON public.certificate_history
  FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));
CREATE POLICY certificate_history_admin ON public.certificate_history
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.status_certificates sc
      WHERE sc.id = certificate_id
        AND public.can_manage_building((SELECT auth.uid()), sc.building_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.status_certificates sc
      WHERE sc.id = certificate_id
        AND public.can_manage_building((SELECT auth.uid()), sc.building_id)
    )
  );

CREATE POLICY notification_preferences_super ON public.notification_preferences
  FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));
CREATE POLICY notification_preferences_self ON public.notification_preferences
  FOR ALL TO authenticated
  USING (profile_id = (SELECT auth.uid()))
  WITH CHECK (profile_id = (SELECT auth.uid()));
CREATE POLICY notification_preferences_admin ON public.notification_preferences
  FOR ALL TO authenticated
  USING (public.can_manage_building((SELECT auth.uid()), building_id))
  WITH CHECK (public.can_manage_building((SELECT auth.uid()), building_id));

-- ---------------------------------------------------------------------------
-- Consultation spam: remove direct anon insert (use edge function + recaptcha)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS consultation_public_insert ON public.consultation_submissions;

-- ---------------------------------------------------------------------------
-- Company employee building self-assignment: require company admin
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS company_member_buildings_self_insert ON public.company_member_buildings;
CREATE POLICY company_member_buildings_admin_insert ON public.company_member_buildings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.company_memberships cm
      WHERE cm.id = membership_id
        AND public.is_company_owner_or_admin((SELECT auth.uid()), cm.company_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: building-documents write restricted to building managers
-- ---------------------------------------------------------------------------

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
      WHERE public.can_manage_building((SELECT auth.uid()), b.id)
    )
  );

CREATE POLICY storage_building_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'building-documents'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT b.id
      FROM public.buildings b
      WHERE public.can_manage_building((SELECT auth.uid()), b.id)
    )
  )
  WITH CHECK (
    bucket_id = 'building-documents'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT b.id
      FROM public.buildings b
      WHERE public.can_manage_building((SELECT auth.uid()), b.id)
    )
  );

CREATE POLICY storage_building_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'building-documents'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT b.id
      FROM public.buildings b
      WHERE public.can_manage_building((SELECT auth.uid()), b.id)
    )
  );

-- ---------------------------------------------------------------------------
-- Master report views: respect caller RLS (Postgres 15+)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.v_master_report_service_requests
WITH (security_invoker = true) AS
SELECT
  sr.id,
  'service-requests'::text AS report_type,
  sr.building_id,
  b.name AS building_label,
  sr.created_at::date AS report_date,
  sr.description AS title,
  sr.status,
  sr.admin_severity AS severity,
  sr.unit,
  sr.resident AS owner,
  sr.pending_reply AS pending_reply,
  sr.archived,
  sr.unread
FROM public.service_requests sr
JOIN public.buildings b ON b.id = sr.building_id;

CREATE OR REPLACE VIEW public.v_master_report_incidents
WITH (security_invoker = true) AS
SELECT
  ir.id,
  'incident-reports'::text AS report_type,
  ir.building_id,
  b.name AS building_label,
  ir.incident_date AS report_date,
  ir.description AS title,
  ir.status,
  ir.severity,
  ir.unit,
  ir.resident AS owner,
  (ir.pending_reply_label = 'Yes') AS pending_reply,
  ir.archived,
  ir.unread,
  ir.incident_number,
  ir.location,
  ir.resolution_time
FROM public.incident_reports ir
JOIN public.buildings b ON b.id = ir.building_id;

CREATE OR REPLACE VIEW public.v_master_report_certificates
WITH (security_invoker = true) AS
SELECT
  sc.id,
  'certificates'::text AS report_type,
  sc.building_id,
  b.name AS building_label,
  sc.created_at::date AS report_date,
  sc.certificate_type AS title,
  sc.status,
  sc.unit,
  sc.requested_by_name AS owner,
  sc.archived,
  sc.unread,
  sc.request_number,
  sc.delivery_type AS processing,
  sc.date_due AS due_date,
  sc.closing_date
FROM public.status_certificates sc
JOIN public.buildings b ON b.id = sc.building_id;

CREATE OR REPLACE VIEW public.v_master_report_board_approvals
WITH (security_invoker = true) AS
SELECT
  ba.id,
  'board-approvals'::text AS report_type,
  ba.building_id,
  b.name AS building_label,
  ba.created_at::date AS report_date,
  ba.title,
  ba.status::text AS status,
  ba.archived,
  ba.unread,
  ba.approved_votes AS approved_count,
  ba.disapproved_votes AS disapproved_count,
  ba.votes_collected,
  ba.votes_required
FROM public.board_approvals ba
JOIN public.buildings b ON b.id = ba.building_id;

CREATE OR REPLACE VIEW public.v_master_report_users_pending
WITH (security_invoker = true) AS
SELECT
  uo.id,
  'users-pending'::text AS report_type,
  uo.building_id,
  b.name AS building_label,
  uo.date_created AS report_date,
  uo.resident_name AS title,
  uo.account_status::text AS status,
  u.label AS unit,
  uo.email AS owner,
  false AS archived,
  false AS unread
FROM public.unit_occupancies uo
JOIN public.buildings b ON b.id = uo.building_id
JOIN public.units u ON u.id = uo.unit_id;

CREATE OR REPLACE VIEW public.v_master_report_portal_signups
WITH (security_invoker = true) AS
SELECT
  psr.id,
  'portal-signups'::text AS report_type,
  psr.building_id,
  b.name AS building_label,
  psr.created_at::date AS report_date,
  psr.first_name || ' — Unit ' || psr.unit_number AS title,
  psr.status::text AS status,
  psr.unit_number AS unit,
  psr.email AS owner,
  psr.email AS extra,
  psr.resident_type,
  false AS archived,
  false AS unread
FROM public.portal_signup_requests psr
JOIN public.buildings b ON b.id = psr.building_id;

REVOKE ALL ON public.v_master_report_service_requests FROM PUBLIC;
REVOKE ALL ON public.v_master_report_incidents FROM PUBLIC;
REVOKE ALL ON public.v_master_report_certificates FROM PUBLIC;
REVOKE ALL ON public.v_master_report_board_approvals FROM PUBLIC;
REVOKE ALL ON public.v_master_report_users_pending FROM PUBLIC;
REVOKE ALL ON public.v_master_report_portal_signups FROM PUBLIC;

GRANT SELECT ON public.v_master_report_service_requests TO authenticated;
GRANT SELECT ON public.v_master_report_incidents TO authenticated;
GRANT SELECT ON public.v_master_report_certificates TO authenticated;
GRANT SELECT ON public.v_master_report_board_approvals TO authenticated;
GRANT SELECT ON public.v_master_report_users_pending TO authenticated;
GRANT SELECT ON public.v_master_report_portal_signups TO authenticated;

NOTIFY pgrst, 'reload schema';
