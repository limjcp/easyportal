-- Migration 013: allow company owners/admins to manage memberships

CREATE POLICY company_memberships_company_admin ON public.company_memberships
  FOR ALL TO authenticated
  USING (public.is_company_owner_or_admin((select auth.uid()), company_id))
  WITH CHECK (public.is_company_owner_or_admin((select auth.uid()), company_id));

CREATE POLICY company_member_buildings_company_admin ON public.company_member_buildings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_memberships cm
      WHERE cm.id = membership_id
        AND public.is_company_owner_or_admin((select auth.uid()), cm.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_memberships cm
      WHERE cm.id = membership_id
        AND public.is_company_owner_or_admin((select auth.uid()), cm.company_id)
    )
  );

CREATE POLICY building_memberships_building_admin ON public.building_memberships
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin((select auth.uid()))
    OR building_id IN (SELECT public.get_user_building_ids((select auth.uid())))
  );

CREATE POLICY building_memberships_building_admin_update ON public.building_memberships
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin((select auth.uid()))
    OR building_id IN (SELECT public.get_user_building_ids((select auth.uid())))
  )
  WITH CHECK (
    public.is_super_admin((select auth.uid()))
    OR building_id IN (SELECT public.get_user_building_ids((select auth.uid())))
  );
