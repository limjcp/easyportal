-- Quote request and price negotiation for $0 purchase orders.

ALTER TYPE public.purchase_order_status ADD VALUE IF NOT EXISTS 'quoted';
ALTER TYPE public.purchase_order_status ADD VALUE IF NOT EXISTS 'negotiating';

ALTER TYPE public.company_notification_type ADD VALUE IF NOT EXISTS 'po_quoted';
ALTER TYPE public.company_notification_type ADD VALUE IF NOT EXISTS 'po_counter_offer';
ALTER TYPE public.vendor_notification_type ADD VALUE IF NOT EXISTS 'po_counter_offer';
ALTER TYPE public.vendor_notification_type ADD VALUE IF NOT EXISTS 'po_quote_accepted';

CREATE TYPE public.po_negotiation_author AS ENUM ('company', 'vendor');
CREATE TYPE public.po_negotiation_action AS ENUM ('quote', 'counter', 'accept');

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS is_quote_request boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS awaiting_response_from public.po_negotiation_author;

CREATE TABLE public.purchase_order_negotiations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  author_side public.po_negotiation_author NOT NULL,
  author_name text NOT NULL DEFAULT '',
  action public.po_negotiation_action NOT NULL,
  message text,
  proposed_total numeric(12, 2) NOT NULL DEFAULT 0,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX purchase_order_negotiations_po_id_idx
  ON public.purchase_order_negotiations (purchase_order_id, created_at);

ALTER TABLE public.purchase_order_negotiations ENABLE ROW LEVEL SECURITY;

CREATE POLICY pon_super ON public.purchase_order_negotiations
  FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));

CREATE POLICY pon_company_select ON public.purchase_order_negotiations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.purchase_orders po
      WHERE po.id = purchase_order_id
        AND po.company_id IN (SELECT public.get_user_company_ids((SELECT auth.uid())))
    )
  );

CREATE POLICY pon_company_insert ON public.purchase_order_negotiations
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.purchase_orders po
      WHERE po.id = purchase_order_id
        AND public.has_company_permission(
          (SELECT auth.uid()),
          po.company_id,
          'company-purchase-orders',
          'edit'
        )
    )
  );

CREATE POLICY pon_vendor_select ON public.purchase_order_negotiations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.purchase_orders po
      WHERE po.id = purchase_order_id
        AND po.vendor_id IN (SELECT public.get_user_vendor_ids((SELECT auth.uid())))
    )
  );

CREATE POLICY pon_vendor_insert ON public.purchase_order_negotiations
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.purchase_orders po
      WHERE po.id = purchase_order_id
        AND po.vendor_id IN (SELECT public.get_user_vendor_ids((SELECT auth.uid())))
    )
  );

-- Vendors may update line items when submitting quotes on their POs.
CREATE POLICY poli_vendor_manage ON public.purchase_order_line_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.purchase_orders po
      WHERE po.id = purchase_order_id
        AND po.vendor_id IN (SELECT public.get_user_vendor_ids((SELECT auth.uid())))
        AND po.is_quote_request = true
        AND po.status::text IN ('sent', 'quoted', 'negotiating')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.purchase_orders po
      WHERE po.id = purchase_order_id
        AND po.vendor_id IN (SELECT public.get_user_vendor_ids((SELECT auth.uid())))
        AND po.is_quote_request = true
        AND po.status::text IN ('sent', 'quoted', 'negotiating')
    )
  );
