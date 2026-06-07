-- RLS for building definition parking, locker, and pricing tables

ALTER TABLE public.building_parking_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS building_parking_groups_super ON public.building_parking_groups;
CREATE POLICY building_parking_groups_super ON public.building_parking_groups FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS building_parking_groups_building ON public.building_parking_groups;
CREATE POLICY building_parking_groups_building ON public.building_parking_groups FOR ALL TO authenticated
  USING (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))))
  WITH CHECK (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))));

ALTER TABLE public.building_locker_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS building_locker_groups_super ON public.building_locker_groups;
CREATE POLICY building_locker_groups_super ON public.building_locker_groups FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS building_locker_groups_building ON public.building_locker_groups;
CREATE POLICY building_locker_groups_building ON public.building_locker_groups FOR ALL TO authenticated
  USING (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))))
  WITH CHECK (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))));

ALTER TABLE public.building_parking_pricing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS building_parking_pricing_super ON public.building_parking_pricing;
CREATE POLICY building_parking_pricing_super ON public.building_parking_pricing FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS building_parking_pricing_building ON public.building_parking_pricing;
CREATE POLICY building_parking_pricing_building ON public.building_parking_pricing FOR ALL TO authenticated
  USING (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))))
  WITH CHECK (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))));
