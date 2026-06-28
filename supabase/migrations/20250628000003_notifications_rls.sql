-- RLS for company/vendor notification tables (used during PO quote negotiation).

ALTER TABLE public.company_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY cn_super ON public.company_notifications
  FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));

CREATE POLICY cn_company_select ON public.company_notifications
  FOR SELECT TO authenticated
  USING (
    company_id IN (SELECT public.get_user_company_ids((SELECT auth.uid())))
  );

CREATE POLICY cn_company_update ON public.company_notifications
  FOR UPDATE TO authenticated
  USING (
    company_id IN (SELECT public.get_user_company_ids((SELECT auth.uid())))
  )
  WITH CHECK (
    company_id IN (SELECT public.get_user_company_ids((SELECT auth.uid())))
  );

-- Vendors notify the company when submitting quotes or accepting offers.
CREATE POLICY cn_vendor_insert ON public.company_notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    po_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.purchase_orders po
      WHERE po.id = po_id
        AND po.company_id = company_id
        AND po.vendor_id IN (SELECT public.get_user_vendor_ids((SELECT auth.uid())))
    )
  );

CREATE POLICY vn_super ON public.vendor_notifications
  FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));

CREATE POLICY vn_vendor_select ON public.vendor_notifications
  FOR SELECT TO authenticated
  USING (
    vendor_id IN (SELECT public.get_user_vendor_ids((SELECT auth.uid())))
  );

CREATE POLICY vn_vendor_update ON public.vendor_notifications
  FOR UPDATE TO authenticated
  USING (
    vendor_id IN (SELECT public.get_user_vendor_ids((SELECT auth.uid())))
  )
  WITH CHECK (
    vendor_id IN (SELECT public.get_user_vendor_ids((SELECT auth.uid())))
  );

-- Company users notify vendors on counter-offers and acceptances.
CREATE POLICY vn_company_insert ON public.vendor_notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    po_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.purchase_orders po
      WHERE po.id = po_id
        AND po.vendor_id = vendor_id
        AND public.has_company_permission(
          (SELECT auth.uid()),
          po.company_id,
          'company-purchase-orders',
          'edit'
        )
    )
  );
