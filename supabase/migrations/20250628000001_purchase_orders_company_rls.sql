-- Company users with purchase-order permission can create and send POs.
-- Previously only SELECT was allowed for company members (po_company).

CREATE POLICY po_company_manage ON public.purchase_orders
  FOR ALL TO authenticated
  USING (
    public.has_company_permission(
      (SELECT auth.uid()),
      company_id,
      'company-purchase-orders',
      'view'
    )
  )
  WITH CHECK (
    public.has_company_permission(
      (SELECT auth.uid()),
      company_id,
      'company-purchase-orders',
      'edit'
    )
  );

ALTER TABLE public.purchase_order_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY poli_super ON public.purchase_order_line_items
  FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));

CREATE POLICY poli_company_select ON public.purchase_order_line_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.purchase_orders po
      WHERE po.id = purchase_order_id
        AND po.company_id IN (SELECT public.get_user_company_ids((SELECT auth.uid())))
    )
  );

CREATE POLICY poli_company_manage ON public.purchase_order_line_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.purchase_orders po
      WHERE po.id = purchase_order_id
        AND public.has_company_permission(
          (SELECT auth.uid()),
          po.company_id,
          'company-purchase-orders',
          'view'
        )
    )
  )
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

CREATE POLICY poli_vendor_select ON public.purchase_order_line_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.purchase_orders po
      WHERE po.id = purchase_order_id
        AND po.vendor_id IN (SELECT public.get_user_vendor_ids((SELECT auth.uid())))
    )
  );
