-- Building access requires explicit company_member_buildings rows (no implicit all for owners/admins).

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
    WHERE cm.profile_id = p_user_id;
$$;
