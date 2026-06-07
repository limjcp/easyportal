-- Per-occupancy building admin sidebar module visibility overrides.

INSERT INTO public.permission_modules (module_key, label, scope) VALUES
  ('consultation-leads', 'Consultation Leads', 'building'),
  ('board-members', 'Board Members', 'building'),
  ('fire-safety', 'Fire Safety Plan', 'building'),
  ('chat', 'Chat', 'building')
ON CONFLICT (module_key) DO NOTHING;

CREATE TABLE public.occupancy_building_admin_modules (
  occupancy_id uuid NOT NULL REFERENCES public.unit_occupancies(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  module_key text NOT NULL REFERENCES public.permission_modules(module_key) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (occupancy_id, module_key)
);

CREATE INDEX occupancy_building_admin_modules_building_idx
  ON public.occupancy_building_admin_modules(building_id);

CREATE TRIGGER occupancy_building_admin_modules_updated_at
  BEFORE UPDATE ON public.occupancy_building_admin_modules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.occupancy_building_admin_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY occupancy_building_admin_modules_super ON public.occupancy_building_admin_modules FOR ALL TO authenticated
  USING (public.is_super_admin((select auth.uid())))
  WITH CHECK (public.is_super_admin((select auth.uid())));

CREATE POLICY occupancy_building_admin_modules_building ON public.occupancy_building_admin_modules FOR ALL TO authenticated
  USING (building_id IN (SELECT public.get_user_building_ids((select auth.uid()))))
  WITH CHECK (building_id IN (SELECT public.get_user_building_ids((select auth.uid()))));
