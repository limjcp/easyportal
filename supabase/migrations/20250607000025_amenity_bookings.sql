-- Amenity bookings: elevator + party room reservations

CREATE TYPE public.amenity_booking_type AS ENUM ('elevator', 'party_room');
CREATE TYPE public.amenity_booking_status AS ENUM (
  'pending',
  'approvedAwaitingPayment',
  'confirmed',
  'declined',
  'cancelled'
);

CREATE TABLE public.building_amenity_settings (
  building_id uuid PRIMARY KEY REFERENCES public.buildings(id) ON DELETE CASCADE,
  party_room_fee text NOT NULL DEFAULT '',
  elevator_instructions text NOT NULL DEFAULT '',
  party_room_instructions text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.amenity_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  resident_name text NOT NULL,
  unit text NOT NULL,
  booking_type public.amenity_booking_type NOT NULL,
  booking_date date NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  guest_count integer,
  notes text NOT NULL DEFAULT '',
  status public.amenity_booking_status NOT NULL DEFAULT 'pending',
  payment_amount text,
  payment_at timestamptz,
  admin_notes text NOT NULL DEFAULT '',
  unread boolean NOT NULL DEFAULT false,
  requested_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX amenity_bookings_building_status_idx ON public.amenity_bookings (building_id, status);
CREATE INDEX amenity_bookings_profile_idx ON public.amenity_bookings (profile_id, building_id);

ALTER TABLE public.amenity_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS amenity_bookings_super ON public.amenity_bookings;
CREATE POLICY amenity_bookings_super ON public.amenity_bookings FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS amenity_bookings_building ON public.amenity_bookings;
CREATE POLICY amenity_bookings_building ON public.amenity_bookings FOR ALL TO authenticated
  USING (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))))
  WITH CHECK (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))));

ALTER TABLE public.building_amenity_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS building_amenity_settings_super ON public.building_amenity_settings;
CREATE POLICY building_amenity_settings_super ON public.building_amenity_settings FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS building_amenity_settings_building ON public.building_amenity_settings;
CREATE POLICY building_amenity_settings_building ON public.building_amenity_settings FOR ALL TO authenticated
  USING (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))))
  WITH CHECK (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))));

-- Portal module for existing buildings
INSERT INTO public.portal_modules (
  building_id,
  module_id,
  name,
  tile_label,
  enabled,
  message,
  sort_order,
  layout_zone,
  locked
)
SELECT
  b.id,
  'amenityBookings',
  'Amenity Bookings',
  'Amenity Bookings',
  true,
  '',
  17,
  'compact'::portal_tile_layout_zone,
  false
FROM public.buildings b
WHERE NOT EXISTS (
  SELECT 1 FROM public.portal_modules pm
  WHERE pm.building_id = b.id AND pm.module_id = 'amenityBookings'
);
