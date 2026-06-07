-- Migration 011: resident personal portal tile layout

CREATE TABLE public.resident_portal_tile_layouts (
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  tiles jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, building_id)
);

ALTER TABLE public.resident_portal_tile_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY resident_portal_tile_layouts_super_admin ON public.resident_portal_tile_layouts
  FOR ALL TO authenticated
  USING (public.is_super_admin((select auth.uid())))
  WITH CHECK (public.is_super_admin((select auth.uid())));

CREATE POLICY resident_portal_tile_layouts_self ON public.resident_portal_tile_layouts
  FOR ALL TO authenticated
  USING (profile_id = (select auth.uid()))
  WITH CHECK (profile_id = (select auth.uid()));
