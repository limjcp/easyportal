-- Compliance & Tracking Dashboard

CREATE TYPE public.compliance_obligation_status AS ENUM ('pending', 'in_progress', 'completed', 'overdue');
CREATE TYPE public.compliance_obligation_source AS ENUM ('cao_scrape', 'cao_engine', 'manual');
CREATE TYPE public.compliance_sync_status AS ENUM ('ok', 'fallback', 'error', 'never');
CREATE TYPE public.director_training_status AS ENUM ('pending', 'completed', 'overdue');

CREATE TABLE public.building_compliance_profiles (
  building_id uuid PRIMARY KEY REFERENCES public.buildings(id) ON DELETE CASCADE,
  cao_region text NOT NULL DEFAULT 'Toronto',
  corp_number text NOT NULL DEFAULT '',
  fiscal_year_end date,
  last_agm_date date,
  last_synced_at timestamptz,
  sync_status public.compliance_sync_status NOT NULL DEFAULT 'never',
  sync_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER building_compliance_profiles_updated_at
  BEFORE UPDATE ON public.building_compliance_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.compliance_obligations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'CAO',
  due_date date NOT NULL,
  start_date date NOT NULL,
  completed_at date,
  status public.compliance_obligation_status NOT NULL DEFAULT 'pending',
  progress_percent integer NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  source public.compliance_obligation_source NOT NULL DEFAULT 'cao_engine',
  cao_reference text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX compliance_obligations_building_due_idx
  ON public.compliance_obligations(building_id, due_date);

CREATE TRIGGER compliance_obligations_updated_at
  BEFORE UPDATE ON public.compliance_obligations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.director_training_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  board_member_id uuid REFERENCES public.board_members(id) ON DELETE SET NULL,
  director_name text NOT NULL,
  completed_at date,
  certificate_id text,
  hours numeric(4,1),
  status public.director_training_status NOT NULL DEFAULT 'pending',
  source text NOT NULL DEFAULT 'manual',
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX director_training_records_building_idx
  ON public.director_training_records(building_id);

CREATE TRIGGER director_training_records_updated_at
  BEFORE UPDATE ON public.director_training_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.compliance_demo_snapshot (
  id text PRIMARY KEY DEFAULT 'demo',
  corp_number text NOT NULL DEFAULT 'TSCC 9999',
  cao_region text NOT NULL DEFAULT 'Toronto',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at timestamptz,
  sync_status public.compliance_sync_status NOT NULL DEFAULT 'never',
  sync_error text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER compliance_demo_snapshot_updated_at
  BEFORE UPDATE ON public.compliance_demo_snapshot
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.compliance_demo_snapshot (id, corp_number, cao_region, payload)
VALUES ('demo', 'TSCC 9999', 'Toronto', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.permission_modules (module_key, label, scope) VALUES
  ('compliance-dashboard', 'Compliance Dashboard', 'building')
ON CONFLICT (module_key) DO NOTHING;

ALTER TABLE public.building_compliance_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.director_training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_demo_snapshot ENABLE ROW LEVEL SECURITY;

CREATE POLICY building_compliance_profiles_super ON public.building_compliance_profiles FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));

CREATE POLICY building_compliance_profiles_building ON public.building_compliance_profiles FOR ALL TO authenticated
  USING (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))))
  WITH CHECK (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))));

CREATE POLICY compliance_obligations_super ON public.compliance_obligations FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));

CREATE POLICY compliance_obligations_building ON public.compliance_obligations FOR ALL TO authenticated
  USING (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))))
  WITH CHECK (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))));

CREATE POLICY director_training_records_super ON public.director_training_records FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));

CREATE POLICY director_training_records_building ON public.director_training_records FOR ALL TO authenticated
  USING (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))))
  WITH CHECK (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))));

CREATE POLICY compliance_demo_snapshot_public_read ON public.compliance_demo_snapshot FOR SELECT TO anon, authenticated
  USING (id = 'demo');

CREATE POLICY compliance_demo_snapshot_service ON public.compliance_demo_snapshot FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
