-- Migration 016: occupancy portal access flags + permission_modules read RLS

ALTER TABLE public.unit_occupancies
  ADD COLUMN IF NOT EXISTS can_access_resident_portal boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_access_building_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS building_admin_role_label text NOT NULL DEFAULT 'Resident';

ALTER TABLE public.permission_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS permission_modules_read ON public.permission_modules;
CREATE POLICY permission_modules_read ON public.permission_modules
  FOR SELECT TO authenticated
  USING (true);

NOTIFY pgrst, 'reload schema';
