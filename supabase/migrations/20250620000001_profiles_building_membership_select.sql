-- Allow users with building access to read profiles linked via building_memberships
-- (needed for company Buildings list admin names).

CREATE POLICY profiles_building_membership_select ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.building_memberships bm
      WHERE bm.profile_id = profiles.id
        AND bm.building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid())))
    )
  );
