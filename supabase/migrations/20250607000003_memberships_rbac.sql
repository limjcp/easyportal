-- Migration 003: memberships, RBAC, permission helpers

CREATE TABLE public.company_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  role company_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, company_id)
);

CREATE TABLE public.company_member_buildings (
  membership_id uuid NOT NULL REFERENCES public.company_memberships(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  PRIMARY KEY (membership_id, building_id)
);

CREATE TABLE public.building_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  role_code text NOT NULL,
  role_label text NOT NULL DEFAULT '',
  status building_membership_status NOT NULL DEFAULT 'active',
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, building_id)
);

CREATE TABLE public.unit_occupancies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  resident_name text NOT NULL DEFAULT '',
  resident_type resident_type NOT NULL DEFAULT 'Owner',
  account_status account_status NOT NULL DEFAULT 'Awaiting Activation',
  status_tags status_tag[] NOT NULL DEFAULT '{}',
  email text NOT NULL DEFAULT '',
  phone text,
  parking text,
  lockers text,
  fobs text,
  vehicles text,
  pets text,
  buzzer_code text,
  date_created date NOT NULL DEFAULT CURRENT_DATE,
  last_login_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX unit_occupancies_building_id_idx ON public.unit_occupancies(building_id);
CREATE INDEX unit_occupancies_profile_id_idx ON public.unit_occupancies(profile_id);
CREATE INDEX unit_occupancies_unit_id_idx ON public.unit_occupancies(unit_id);

CREATE TABLE public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  trade_category text NOT NULL DEFAULT '',
  contact_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL,
  notes text NOT NULL DEFAULT '',
  status vendor_status NOT NULL DEFAULT 'pending_invite',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.vendor_buildings (
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  PRIMARY KEY (vendor_id, building_id)
);

CREATE TABLE public.vendor_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.vendor_users (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE
);

CREATE TABLE public.role_name_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  default_role text NOT NULL,
  custom_name text NOT NULL DEFAULT '',
  UNIQUE (company_id, default_role)
);

CREATE TABLE public.permission_modules (
  module_key text PRIMARY KEY,
  label text NOT NULL,
  scope text NOT NULL DEFAULT 'building' CHECK (scope IN ('company', 'building', 'both'))
);

INSERT INTO public.permission_modules (module_key, label, scope) VALUES
  ('company-condos', 'Company: Condos', 'company'),
  ('company-employees', 'Company: Employees', 'company'),
  ('company-subscriptions', 'Company: Subscriptions', 'company'),
  ('company-master-reports', 'Company: Master Reports', 'company'),
  ('company-vendors', 'Company: Vendors', 'company'),
  ('company-purchase-orders', 'Company: Purchase Orders', 'company'),
  ('admins', 'Admins', 'both'),
  ('amenities', 'Amenities', 'building'),
  ('board-approvals', 'Board Approvals', 'both'),
  ('board-elections', 'Board Elections', 'building'),
  ('agm', 'AGM Meetings', 'building'),
  ('building-definitions', 'Building Definitions', 'both'),
  ('documents', 'Documents', 'building'),
  ('events', 'Events', 'building'),
  ('external-data', 'ExternalData', 'building'),
  ('faq', 'FAQ', 'building'),
  ('galleries', 'Galleries', 'building'),
  ('incident-reports', 'Incident Reports', 'both'),
  ('news-notices', 'News & Notices', 'building'),
  ('newsletters', 'Newsletters', 'building'),
  ('portal-settings', 'Portal Settings', 'building'),
  ('service-requests', 'Service Request', 'both'),
  ('status-certificates', 'Status Certificates', 'building'),
  ('suggestions', 'Suggestion', 'building'),
  ('polls', 'Polls', 'building'),
  ('units-users', 'Units & Users', 'both');

CREATE TABLE public.role_permission_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.management_companies(id) ON DELETE CASCADE,
  role company_role NOT NULL,
  module_key text NOT NULL REFERENCES public.permission_modules(module_key) ON DELETE CASCADE,
  can_create boolean NOT NULL DEFAULT false,
  can_view boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  can_archive boolean NOT NULL DEFAULT false,
  UNIQUE NULLS NOT DISTINCT (company_id, role, module_key)
);

CREATE TABLE public.building_role_permission_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid REFERENCES public.buildings(id) ON DELETE CASCADE,
  role_label text NOT NULL,
  module_key text NOT NULL REFERENCES public.permission_modules(module_key) ON DELETE CASCADE,
  can_create boolean NOT NULL DEFAULT false,
  can_view boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  can_archive boolean NOT NULL DEFAULT false,
  UNIQUE NULLS NOT DISTINCT (building_id, role_label, module_key)
);

-- Access helper functions
CREATE OR REPLACE FUNCTION public.get_user_company_ids(p_user_id uuid DEFAULT auth.uid())
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.company_memberships WHERE profile_id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_user_building_ids(p_user_id uuid DEFAULT auth.uid())
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT building_id FROM public.building_memberships WHERE profile_id = p_user_id AND status = 'active'
  UNION
  SELECT uo.building_id FROM public.unit_occupancies uo
    WHERE uo.profile_id = p_user_id AND uo.archived_at IS NULL
  UNION
  SELECT vb.building_id FROM public.vendor_users vu
    JOIN public.vendor_buildings vb ON vb.vendor_id = vu.vendor_id
    WHERE vu.profile_id = p_user_id
  UNION
  SELECT cmb.building_id FROM public.company_memberships cm
    JOIN public.company_member_buildings cmb ON cmb.membership_id = cm.id
    WHERE cm.profile_id = p_user_id
  UNION
  SELECT b.id FROM public.buildings b
    JOIN public.company_memberships cm ON cm.company_id = b.company_id
    WHERE cm.profile_id = p_user_id
      AND cm.role IN ('Company Owner', 'Company Administrator')
      AND NOT EXISTS (
        SELECT 1 FROM public.company_member_buildings cmb2
        WHERE cmb2.membership_id = cm.id
      );
$$;

CREATE OR REPLACE FUNCTION public.is_company_owner_or_admin(p_user_id uuid, p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_memberships
    WHERE profile_id = p_user_id
      AND company_id = p_company_id
      AND role IN ('Company Owner', 'Company Administrator')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_building_member(p_user_id uuid, p_building_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_building_id IN (SELECT public.get_user_building_ids(p_user_id));
$$;

CREATE OR REPLACE FUNCTION public.is_unit_resident(p_user_id uuid, p_building_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.unit_occupancies
    WHERE profile_id = p_user_id
      AND building_id = p_building_id
      AND archived_at IS NULL
      AND account_status = 'Activated'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_vendor_for_building(p_user_id uuid, p_building_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vendor_users vu
    JOIN public.vendor_buildings vb ON vb.vendor_id = vu.vendor_id
    WHERE vu.profile_id = p_user_id AND vb.building_id = p_building_id
  );
$$;

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
  v_role company_role;
  v_allowed boolean;
BEGIN
  IF public.is_super_admin(p_user_id) THEN
    RETURN true;
  END IF;

  SELECT role INTO v_role
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
  FROM public.role_permission_defaults
  WHERE company_id = p_company_id
    AND role = v_role
    AND module_key = p_module_key
  LIMIT 1;

  IF v_allowed IS NOT NULL THEN
    RETURN v_allowed;
  END IF;

  -- Global defaults when company-specific row missing
  IF v_role IN ('Company Owner', 'Company Administrator') THEN
    RETURN true;
  END IF;

  IF v_role = 'Company Accountant' AND p_module_key LIKE '%subscription%' OR p_module_key LIKE '%purchase%' THEN
    RETURN p_action IN ('create', 'view', 'edit');
  END IF;

  RETURN p_action = 'view';
END;
$$;

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

  IF public.is_unit_resident(p_user_id, p_building_id) THEN
    RETURN p_action = 'view' AND p_module_key NOT IN ('company-subscriptions', 'external-data');
  END IF;

  RETURN false;
END;
$$;
