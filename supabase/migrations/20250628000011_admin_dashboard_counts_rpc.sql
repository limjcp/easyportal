-- Single RPC for admin dashboard badge counts (replaces ~12 parallel PostgREST requests).

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_counts(p_building_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_today date := CURRENT_DATE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT (
    public.is_super_admin(v_user_id)
    OR public.is_building_member(v_user_id, p_building_id)
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN jsonb_build_object(
    'amenity_bookings', (
      SELECT COUNT(*)::int
      FROM public.amenity_bookings
      WHERE building_id = p_building_id
        AND status = 'pending'
    ),
    'service_requests', (
      SELECT COUNT(*)::int
      FROM public.service_requests
      WHERE building_id = p_building_id
        AND archived = false
        AND (unread = true OR pending_reply = true OR action_required = true)
    ),
    'status_certificates', (
      SELECT COUNT(*)::int
      FROM public.status_certificates
      WHERE building_id = p_building_id
        AND archived = false
        AND unread = true
    ),
    'incident_reports', (
      SELECT COUNT(*)::int
      FROM public.incident_reports
      WHERE building_id = p_building_id
        AND archived = false
        AND unread = true
    ),
    'board_applications', (
      SELECT COUNT(*)::int
      FROM public.board_member_applications
      WHERE building_id = p_building_id
        AND unread = true
    ),
    'board_approvals', (
      SELECT COUNT(*)::int
      FROM public.board_approvals
      WHERE building_id = p_building_id
        AND archived = false
        AND status = 'Pending'
    ),
    'compliance_overdue', (
      SELECT COUNT(*)::int
      FROM public.compliance_obligations
      WHERE building_id = p_building_id
        AND status <> 'completed'
        AND due_date < v_today
    ),
    'news_notices', (
      SELECT COUNT(*)::int
      FROM public.news_items
      WHERE building_id = p_building_id
        AND archived = false
        AND unread = true
    ),
    'consultation_leads', (
      CASE
        WHEN public.is_super_admin(v_user_id) THEN (
          SELECT COUNT(*)::int
          FROM public.consultation_submissions
          WHERE unread = true
        )
        ELSE 0
      END
    ),
    'suggestions', (
      SELECT COUNT(*)::int
      FROM public.suggestions
      WHERE building_id = p_building_id
        AND (unread = true OR status = 'Submitted')
    ),
    'chat_unread', (
      SELECT COUNT(*)::int
      FROM public.chat_conversation_participants cp
      JOIN public.chat_conversations cc ON cc.id = cp.conversation_id
      WHERE cp.profile_id = v_user_id
        AND cc.building_id = p_building_id
        AND cc.last_message_preview <> ''
        AND cc.last_message_at > cp.last_read_at
    ),
    'units_users_pending', (
      SELECT COUNT(*)::int
      FROM public.unit_occupancies
      WHERE building_id = p_building_id
        AND archived_at IS NULL
        AND (
          account_status = 'Pending Unit Assignment'
          OR (account_status = 'Awaiting Activation' AND unit_id IS NULL)
        )
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_dashboard_counts(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_counts(uuid) TO authenticated;
