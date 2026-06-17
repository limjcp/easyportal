-- Migration 017: allow company members to read coworker profiles; owners/admins can update

CREATE POLICY profiles_company_member_select ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.company_memberships cm
      WHERE cm.profile_id = profiles.id
        AND cm.company_id IN (
          SELECT public.get_user_company_ids((select auth.uid()))
        )
    )
  );

CREATE POLICY profiles_company_admin_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_memberships cm
      WHERE cm.profile_id = profiles.id
        AND public.is_company_owner_or_admin((select auth.uid()), cm.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_memberships cm
      WHERE cm.profile_id = profiles.id
        AND public.is_company_owner_or_admin((select auth.uid()), cm.company_id)
    )
  );
