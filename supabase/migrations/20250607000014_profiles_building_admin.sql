-- Migration 014: allow building admins to read/update profiles linked to occupancies in their buildings

CREATE POLICY profiles_building_admin_select ON public.profiles FOR SELECT TO authenticated
  USING (
    id = (select auth.uid())
    OR public.is_super_admin((select auth.uid()))
    OR EXISTS (
      SELECT 1 FROM public.unit_occupancies uo
      WHERE uo.profile_id = profiles.id
        AND uo.building_id IN (SELECT public.get_user_building_ids((select auth.uid())))
    )
  );

CREATE POLICY profiles_building_admin_update ON public.profiles FOR UPDATE TO authenticated
  USING (
    public.is_super_admin((select auth.uid()))
    OR EXISTS (
      SELECT 1 FROM public.unit_occupancies uo
      WHERE uo.profile_id = profiles.id
        AND uo.building_id IN (SELECT public.get_user_building_ids((select auth.uid())))
    )
  )
  WITH CHECK (
    public.is_super_admin((select auth.uid()))
    OR EXISTS (
      SELECT 1 FROM public.unit_occupancies uo
      WHERE uo.profile_id = profiles.id
        AND uo.building_id IN (SELECT public.get_user_building_ids((select auth.uid())))
    )
  );
