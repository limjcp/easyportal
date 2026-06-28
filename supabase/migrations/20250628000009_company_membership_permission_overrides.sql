-- Honor per-employee permission overrides and fix Company Accountant module check precedence.

CREATE OR REPLACE FUNCTION public.has_company_permission(
  p_user_id uuid,
  p_company_id uuid,
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
  v_membership_id uuid;
  v_role company_role;
  v_allowed boolean;
BEGIN
  IF public.is_super_admin(p_user_id) THEN
    RETURN true;
  END IF;

  SELECT id, role INTO v_membership_id, v_role
  FROM public.company_memberships
  WHERE profile_id = p_user_id AND company_id = p_company_id
  LIMIT 1;

  IF v_role IS NULL THEN
    RETURN false;
  END IF;

  SELECT CASE p_action
    WHEN 'create' THEN can_create
    WHEN 'view' THEN can_view
    WHEN 'edit' THEN can_edit
    WHEN 'delete' THEN can_delete
    WHEN 'archive' THEN can_archive
  END INTO v_allowed
  FROM public.company_membership_permissions
  WHERE membership_id = v_membership_id
    AND module_key = p_module_key
  LIMIT 1;

  IF v_allowed IS NOT NULL THEN
    RETURN v_allowed;
  END IF;

  SELECT CASE p_action
    WHEN 'create' THEN can_create
    WHEN 'view' THEN can_view
    WHEN 'edit' THEN can_edit
    WHEN 'delete' THEN can_delete
    WHEN 'archive' THEN can_archive
  END INTO v_allowed
  FROM public.role_permission_defaults
  WHERE company_id = p_company_id
    AND role = v_role
    AND module_key = p_module_key
  LIMIT 1;

  IF v_allowed IS NOT NULL THEN
    RETURN v_allowed;
  END IF;

  IF v_role IN ('Company Owner', 'Company Administrator') THEN
    RETURN true;
  END IF;

  IF v_role = 'Company Accountant'
    AND (p_module_key LIKE '%subscription%' OR p_module_key LIKE '%purchase%') THEN
    RETURN p_action IN ('create', 'view', 'edit');
  END IF;

  RETURN p_action = 'view';
END;
$$;
