-- Migration 015: resident portal module permissions + company membership permission overrides

CREATE TABLE public.resident_type_portal_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  resident_type resident_type NOT NULL,
  module_id text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (building_id, resident_type, module_id)
);

CREATE INDEX resident_type_portal_modules_building_idx
  ON public.resident_type_portal_modules(building_id, resident_type);

CREATE TRIGGER resident_type_portal_modules_updated_at
  BEFORE UPDATE ON public.resident_type_portal_modules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.occupancy_portal_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occupancy_id uuid NOT NULL REFERENCES public.unit_occupancies(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  module_id text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (occupancy_id, module_id)
);

CREATE INDEX occupancy_portal_modules_occupancy_idx ON public.occupancy_portal_modules(occupancy_id);

CREATE TRIGGER occupancy_portal_modules_updated_at
  BEFORE UPDATE ON public.occupancy_portal_modules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.company_membership_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id uuid NOT NULL REFERENCES public.company_memberships(id) ON DELETE CASCADE,
  module_key text NOT NULL REFERENCES public.permission_modules(module_key) ON DELETE CASCADE,
  can_create boolean NOT NULL DEFAULT false,
  can_view boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  can_archive boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (membership_id, module_key)
);

CREATE INDEX company_membership_permissions_membership_idx
  ON public.company_membership_permissions(membership_id);

CREATE TRIGGER company_membership_permissions_updated_at
  BEFORE UPDATE ON public.company_membership_permissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: role_permission_defaults
ALTER TABLE public.role_permission_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY role_permission_defaults_super ON public.role_permission_defaults FOR ALL TO authenticated
  USING (public.is_super_admin((select auth.uid())))
  WITH CHECK (public.is_super_admin((select auth.uid())));

CREATE POLICY role_permission_defaults_company ON public.role_permission_defaults FOR ALL TO authenticated
  USING (
    company_id IN (SELECT public.get_user_company_ids((select auth.uid())))
    AND public.is_company_owner_or_admin((select auth.uid()), company_id)
  )
  WITH CHECK (
    company_id IN (SELECT public.get_user_company_ids((select auth.uid())))
    AND public.is_company_owner_or_admin((select auth.uid()), company_id)
  );

-- RLS: building_role_permission_defaults
ALTER TABLE public.building_role_permission_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY building_role_permission_defaults_super ON public.building_role_permission_defaults FOR ALL TO authenticated
  USING (public.is_super_admin((select auth.uid())))
  WITH CHECK (public.is_super_admin((select auth.uid())));

CREATE POLICY building_role_permission_defaults_building ON public.building_role_permission_defaults FOR ALL TO authenticated
  USING (building_id IN (SELECT public.get_user_building_ids((select auth.uid()))))
  WITH CHECK (building_id IN (SELECT public.get_user_building_ids((select auth.uid()))));

-- RLS: resident_type_portal_modules
ALTER TABLE public.resident_type_portal_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY resident_type_portal_modules_super ON public.resident_type_portal_modules FOR ALL TO authenticated
  USING (public.is_super_admin((select auth.uid())))
  WITH CHECK (public.is_super_admin((select auth.uid())));

CREATE POLICY resident_type_portal_modules_building ON public.resident_type_portal_modules FOR ALL TO authenticated
  USING (building_id IN (SELECT public.get_user_building_ids((select auth.uid()))))
  WITH CHECK (building_id IN (SELECT public.get_user_building_ids((select auth.uid()))));

-- RLS: occupancy_portal_modules
ALTER TABLE public.occupancy_portal_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY occupancy_portal_modules_super ON public.occupancy_portal_modules FOR ALL TO authenticated
  USING (public.is_super_admin((select auth.uid())))
  WITH CHECK (public.is_super_admin((select auth.uid())));

CREATE POLICY occupancy_portal_modules_building ON public.occupancy_portal_modules FOR ALL TO authenticated
  USING (building_id IN (SELECT public.get_user_building_ids((select auth.uid()))))
  WITH CHECK (building_id IN (SELECT public.get_user_building_ids((select auth.uid()))));

-- RLS: company_membership_permissions
ALTER TABLE public.company_membership_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_membership_permissions_super ON public.company_membership_permissions FOR ALL TO authenticated
  USING (public.is_super_admin((select auth.uid())))
  WITH CHECK (public.is_super_admin((select auth.uid())));

CREATE POLICY company_membership_permissions_company ON public.company_membership_permissions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_memberships cm
      WHERE cm.id = company_membership_permissions.membership_id
        AND cm.company_id IN (SELECT public.get_user_company_ids((select auth.uid())))
        AND public.is_company_owner_or_admin((select auth.uid()), cm.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_memberships cm
      WHERE cm.id = company_membership_permissions.membership_id
        AND cm.company_id IN (SELECT public.get_user_company_ids((select auth.uid())))
        AND public.is_company_owner_or_admin((select auth.uid()), cm.company_id)
    )
  );

CREATE POLICY company_membership_permissions_self ON public.company_membership_permissions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_memberships cm
      WHERE cm.id = company_membership_permissions.membership_id
        AND cm.profile_id = (select auth.uid())
    )
  );
