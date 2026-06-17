-- QuickBooks Online integration (OAuth connection + synced balances/invoices)

CREATE TABLE IF NOT EXISTS public.quickbooks_connections (
  building_id uuid PRIMARY KEY REFERENCES public.buildings(id) ON DELETE CASCADE,
  realm_id text NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER quickbooks_connections_updated_at
BEFORE UPDATE ON public.quickbooks_connections
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.quickbooks_connections ENABLE ROW LEVEL SECURITY;

-- Only service role should ever read tokens directly.
DROP POLICY IF EXISTS quickbooks_connections_no_access ON public.quickbooks_connections;
CREATE POLICY quickbooks_connections_no_access ON public.quickbooks_connections
FOR ALL TO authenticated
USING (false)
WITH CHECK (false);

CREATE TABLE IF NOT EXISTS public.quickbooks_customers (
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  customer_id text NOT NULL,
  display_name text NOT NULL,
  primary_email text,
  active boolean NOT NULL DEFAULT true,
  balance numeric NOT NULL DEFAULT 0,
  balance_with_jobs numeric NOT NULL DEFAULT 0,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (building_id, customer_id)
);

ALTER TABLE public.quickbooks_customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quickbooks_customers_building_read ON public.quickbooks_customers;
CREATE POLICY quickbooks_customers_building_read ON public.quickbooks_customers
FOR SELECT TO authenticated
USING (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))));

DROP POLICY IF EXISTS quickbooks_customers_building_write ON public.quickbooks_customers;
CREATE POLICY quickbooks_customers_building_write ON public.quickbooks_customers
FOR ALL TO authenticated
USING (false)
WITH CHECK (false);

CREATE TABLE IF NOT EXISTS public.quickbooks_invoices (
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  invoice_id text NOT NULL,
  doc_number text,
  customer_id text NOT NULL,
  txn_date date,
  due_date date,
  total_amt numeric NOT NULL DEFAULT 0,
  balance numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (building_id, invoice_id)
);

CREATE INDEX IF NOT EXISTS quickbooks_invoices_building_customer_idx
  ON public.quickbooks_invoices(building_id, customer_id);

ALTER TABLE public.quickbooks_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quickbooks_invoices_building_read ON public.quickbooks_invoices;
CREATE POLICY quickbooks_invoices_building_read ON public.quickbooks_invoices
FOR SELECT TO authenticated
USING (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))));

DROP POLICY IF EXISTS quickbooks_invoices_building_write ON public.quickbooks_invoices;
CREATE POLICY quickbooks_invoices_building_write ON public.quickbooks_invoices
FOR ALL TO authenticated
USING (false)
WITH CHECK (false);

-- Map portal units to QBO customer IDs so residents can see balances/invoices.
CREATE TABLE IF NOT EXISTS public.quickbooks_unit_customers (
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  customer_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (building_id, unit_id),
  UNIQUE (building_id, customer_id)
);

ALTER TABLE public.quickbooks_unit_customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quickbooks_unit_customers_building_read ON public.quickbooks_unit_customers;
CREATE POLICY quickbooks_unit_customers_building_read ON public.quickbooks_unit_customers
FOR SELECT TO authenticated
USING (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))));

DROP POLICY IF EXISTS quickbooks_unit_customers_building_write ON public.quickbooks_unit_customers;
CREATE POLICY quickbooks_unit_customers_building_write ON public.quickbooks_unit_customers
FOR ALL TO authenticated
USING (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))))
WITH CHECK (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))));

-- Short-lived OAuth state binding (prevents mixing building IDs).
CREATE TABLE IF NOT EXISTS public.quickbooks_oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quickbooks_oauth_states_created_at_idx
  ON public.quickbooks_oauth_states(created_at);

ALTER TABLE public.quickbooks_oauth_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quickbooks_oauth_states_no_access ON public.quickbooks_oauth_states;
CREATE POLICY quickbooks_oauth_states_no_access ON public.quickbooks_oauth_states
FOR ALL TO authenticated
USING (false)
WITH CHECK (false);

-- Company master report view: QBO connections status per building (optional future).
