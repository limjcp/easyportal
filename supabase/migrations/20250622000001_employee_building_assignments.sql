-- Employee building assignments: self-read/insert + permission-based building create

DROP POLICY IF EXISTS company_member_buildings_self_select ON public.company_member_buildings;
CREATE POLICY company_member_buildings_self_select ON public.company_member_buildings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_memberships cm
      WHERE cm.id = membership_id AND cm.profile_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS company_member_buildings_self_insert ON public.company_member_buildings;
CREATE POLICY company_member_buildings_self_insert ON public.company_member_buildings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_memberships cm
      WHERE cm.id = membership_id AND cm.profile_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS buildings_company_create_permission ON public.buildings;
CREATE POLICY buildings_company_create_permission ON public.buildings
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_company_permission((SELECT auth.uid()), company_id, 'company-condos', 'create')
  );
