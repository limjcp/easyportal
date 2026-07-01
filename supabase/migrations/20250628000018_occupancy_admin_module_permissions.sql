-- Honor per-occupancy building admin module grants in RLS (not only role defaults).

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

  -- Occupancy admins: explicit sidebar module grants imply full manage access for that module.
  IF EXISTS (
    SELECT 1
    FROM public.unit_occupancies uo
    INNER JOIN public.occupancy_building_admin_modules obam
      ON obam.occupancy_id = uo.id
      AND obam.building_id = p_building_id
      AND obam.module_key = p_module_key
      AND obam.enabled = true
    WHERE uo.profile_id = p_user_id
      AND uo.building_id = p_building_id
      AND uo.archived_at IS NULL
      AND uo.can_access_building_admin = true
  ) THEN
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

NOTIFY pgrst, 'reload schema';
