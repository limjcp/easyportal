-- Migration 002: organization core

CREATE TABLE public.management_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  postal_zip text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT 'Canada',
  province_state text NOT NULL DEFAULT '',
  timezone text NOT NULL DEFAULT 'America/Toronto',
  company_email text NOT NULL DEFAULT '',
  tel1 text NOT NULL DEFAULT '',
  tel2 text NOT NULL DEFAULT '',
  fax text NOT NULL DEFAULT '',
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER management_companies_updated_at
  BEFORE UPDATE ON public.management_companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.buildings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  code text NOT NULL DEFAULT '',
  name text NOT NULL,
  condo_name text NOT NULL DEFAULT '',
  corporation text NOT NULL DEFAULT '',
  corp_number text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  condo_line text,
  city_province_postal text,
  city text NOT NULL DEFAULT '',
  postal_zip text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT 'Canada',
  province text NOT NULL DEFAULT '',
  multi_address_property boolean NOT NULL DEFAULT false,
  property_phone text NOT NULL DEFAULT '',
  property_email text NOT NULL DEFAULT '',
  accounting_email text NOT NULL DEFAULT '',
  billing_email text NOT NULL DEFAULT '',
  visitor_parking_overnight_email text,
  building_types text[] NOT NULL DEFAULT '{}',
  building_features text[] NOT NULL DEFAULT '{}',
  amenities text[] NOT NULL DEFAULT '{}',
  common_areas text[] NOT NULL DEFAULT '{}',
  subscription_package text NOT NULL DEFAULT '',
  status building_status NOT NULL DEFAULT 'active',
  subdomain text NOT NULL DEFAULT '',
  image_url text,
  units_count integer NOT NULL DEFAULT 0,
  admins_count integer NOT NULL DEFAULT 0,
  users_count integer NOT NULL DEFAULT 0,
  last_activity timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, subdomain)
);

CREATE INDEX buildings_company_id_idx ON public.buildings(company_id);
CREATE INDEX buildings_subdomain_idx ON public.buildings(subdomain);

CREATE TRIGGER buildings_updated_at
  BEFORE UPDATE ON public.buildings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.building_links (
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  linked_building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  PRIMARY KEY (building_id, linked_building_id),
  CHECK (building_id <> linked_building_id)
);

CREATE TABLE public.building_tax_settings (
  building_id uuid PRIMARY KEY REFERENCES public.buildings(id) ON DELETE CASCADE,
  master_tax_rate numeric(8, 4),
  service_requests_taxable boolean NOT NULL DEFAULT false,
  service_requests_tax_rate numeric(8, 4),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.building_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  title text NOT NULL,
  reminder_date date NOT NULL,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.building_unit_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  name text NOT NULL,
  floor_area text NOT NULL DEFAULT ''
);

CREATE TABLE public.building_unit_group_units (
  unit_group_id uuid NOT NULL REFERENCES public.building_unit_groups(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL,
  PRIMARY KEY (unit_group_id, unit_id)
);

CREATE TABLE public.building_parking_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  name text NOT NULL,
  spots text[] NOT NULL DEFAULT '{}'
);

CREATE TABLE public.building_locker_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  name text NOT NULL,
  lockers text[] NOT NULL DEFAULT '{}'
);

CREATE TABLE public.building_parking_pricing (
  building_id uuid PRIMARY KEY REFERENCES public.buildings(id) ON DELETE CASCADE,
  regular_monthly_cost text NOT NULL DEFAULT '$120.00',
  visitor_monthly_cost text NOT NULL DEFAULT '$30.00'
);

CREATE TABLE public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  label text NOT NULL,
  floor text NOT NULL DEFAULT '',
  buzzer_code text,
  parking_spots text[] NOT NULL DEFAULT '{}',
  lockers text[] NOT NULL DEFAULT '{}',
  bike_spaces text[] NOT NULL DEFAULT '{}',
  is_occupied boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX units_building_id_idx ON public.units(building_id);

CREATE TRIGGER units_updated_at
  BEFORE UPDATE ON public.units
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.building_unit_group_units
  ADD CONSTRAINT building_unit_group_units_unit_id_fkey
  FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE;

CREATE TABLE public.building_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  building_name text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  package text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.company_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  plan_name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  renewal_date date,
  buildings_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.stripe_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  payout_date date NOT NULL,
  status text NOT NULL DEFAULT 'Pending',
  total numeric(12, 2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'CAD',
  created_at timestamptz NOT NULL DEFAULT now()
);
