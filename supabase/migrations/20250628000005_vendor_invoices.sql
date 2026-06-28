-- Vendor invoices from accepted purchase orders + SPARC bill email on buildings

ALTER TABLE public.buildings
  ADD COLUMN IF NOT EXISTS sparc_email text NOT NULL DEFAULT '';

CREATE TYPE public.vendor_invoice_status AS ENUM ('draft', 'submitted');

CREATE TABLE public.vendor_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL UNIQUE REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  hst_number text NOT NULL DEFAULT '',
  logo_storage_path text,
  subtotal numeric(12, 2) NOT NULL DEFAULT 0,
  hst_rate numeric(5, 4) NOT NULL DEFAULT 0.13,
  hst_amount numeric(12, 2) NOT NULL DEFAULT 0,
  total numeric(12, 2) NOT NULL DEFAULT 0,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  status public.vendor_invoice_status NOT NULL DEFAULT 'draft',
  submitted_at timestamptz,
  sparc_recipient_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX vendor_invoices_vendor_id_idx ON public.vendor_invoices (vendor_id, created_at DESC);
CREATE INDEX vendor_invoices_po_id_idx ON public.vendor_invoices (purchase_order_id);

ALTER TABLE public.vendor_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_invoices_super ON public.vendor_invoices
  FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));

CREATE POLICY vendor_invoices_company_select ON public.vendor_invoices
  FOR SELECT TO authenticated
  USING (
    company_id IN (SELECT public.get_user_company_ids((SELECT auth.uid())))
  );

CREATE POLICY vendor_invoices_vendor_select ON public.vendor_invoices
  FOR SELECT TO authenticated
  USING (
    vendor_id IN (SELECT public.get_user_vendor_ids((SELECT auth.uid())))
  );

CREATE POLICY vendor_invoices_vendor_insert ON public.vendor_invoices
  FOR INSERT TO authenticated
  WITH CHECK (
    vendor_id IN (SELECT public.get_user_vendor_ids((SELECT auth.uid())))
  );

CREATE POLICY vendor_invoices_vendor_update ON public.vendor_invoices
  FOR UPDATE TO authenticated
  USING (
    vendor_id IN (SELECT public.get_user_vendor_ids((SELECT auth.uid())))
    AND status = 'draft'
  )
  WITH CHECK (
    vendor_id IN (SELECT public.get_user_vendor_ids((SELECT auth.uid())))
  );
