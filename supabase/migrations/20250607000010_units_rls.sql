-- Migration 010: units RLS, pending occupancies without unit, performance indexes

-- Pending unit assignment may not have a unit yet
ALTER TABLE public.unit_occupancies ALTER COLUMN unit_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS unit_occupancies_building_status_idx
  ON public.unit_occupancies(building_id, account_status);

-- Units
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

CREATE POLICY units_super_admin ON public.units FOR ALL TO authenticated
  USING (public.is_super_admin((select auth.uid())))
  WITH CHECK (public.is_super_admin((select auth.uid())));

CREATE POLICY units_building_select ON public.units FOR SELECT TO authenticated
  USING (building_id IN (SELECT public.get_user_building_ids((select auth.uid()))));

CREATE POLICY units_building_write ON public.units FOR ALL TO authenticated
  USING (building_id IN (SELECT public.get_user_building_ids((select auth.uid()))))
  WITH CHECK (building_id IN (SELECT public.get_user_building_ids((select auth.uid()))));

-- Building unit groups (floor/area labels)
ALTER TABLE public.building_unit_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY building_unit_groups_super ON public.building_unit_groups FOR ALL TO authenticated
  USING (public.is_super_admin((select auth.uid())))
  WITH CHECK (public.is_super_admin((select auth.uid())));

CREATE POLICY building_unit_groups_building ON public.building_unit_groups FOR ALL TO authenticated
  USING (building_id IN (SELECT public.get_user_building_ids((select auth.uid()))))
  WITH CHECK (building_id IN (SELECT public.get_user_building_ids((select auth.uid()))));

-- Building admin write access for occupancies (super admin already has ALL)
CREATE POLICY unit_occupancies_building_write ON public.unit_occupancies FOR ALL TO authenticated
  USING (building_id IN (SELECT public.get_user_building_ids((select auth.uid()))))
  WITH CHECK (building_id IN (SELECT public.get_user_building_ids((select auth.uid()))));
