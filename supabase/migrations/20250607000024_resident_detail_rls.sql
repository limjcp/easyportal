-- RLS for occupancy-scoped resident profile detail tables

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'resident_key_fobs',
    'resident_vehicles',
    'resident_guests',
    'resident_pets',
    'resident_maint_fees'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_super', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated
        USING (public.is_super_admin((SELECT auth.uid())))
        WITH CHECK (public.is_super_admin((SELECT auth.uid())))',
      t || '_super',
      t
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_building', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated
        USING (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))))
        WITH CHECK (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))))',
      t || '_building',
      t
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_occupancy_self', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.unit_occupancies uo
            WHERE uo.id = occupancy_id
              AND uo.profile_id = (SELECT auth.uid())
              AND uo.archived_at IS NULL
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.unit_occupancies uo
            WHERE uo.id = occupancy_id
              AND uo.profile_id = (SELECT auth.uid())
              AND uo.archived_at IS NULL
          )
          AND building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid())))
        )',
      t || '_occupancy_self',
      t
    );
  END LOOP;
END $$;
