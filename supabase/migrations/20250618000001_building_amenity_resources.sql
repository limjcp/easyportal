-- Bookable amenity resources (party rooms, elevators) per building

CREATE TYPE public.building_amenity_resource_type AS ENUM ('party_room', 'elevator');

CREATE TABLE public.building_amenity_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  resource_type public.building_amenity_resource_type NOT NULL,
  name text NOT NULL,
  location_label text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (building_id, resource_type, name)
);

CREATE INDEX building_amenity_resources_building_type_idx
  ON public.building_amenity_resources (building_id, resource_type, is_active);

CREATE TRIGGER building_amenity_resources_updated_at
  BEFORE UPDATE ON public.building_amenity_resources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.amenity_bookings
  ADD COLUMN amenity_resource_id uuid
  REFERENCES public.building_amenity_resources(id) ON DELETE SET NULL;

ALTER TABLE public.building_amenity_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS building_amenity_resources_super ON public.building_amenity_resources;
CREATE POLICY building_amenity_resources_super ON public.building_amenity_resources FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS building_amenity_resources_building ON public.building_amenity_resources;
CREATE POLICY building_amenity_resources_building ON public.building_amenity_resources FOR ALL TO authenticated
  USING (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))))
  WITH CHECK (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))));
