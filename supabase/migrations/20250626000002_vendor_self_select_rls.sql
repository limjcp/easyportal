-- Allow vendor portal users to read their own vendor record and related data

CREATE POLICY vendors_self_select ON public.vendors
  FOR SELECT TO authenticated
  USING (id IN (SELECT public.get_user_vendor_ids((SELECT auth.uid()))));

ALTER TABLE public.vendor_buildings ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_buildings_super ON public.vendor_buildings
  FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));

CREATE POLICY vendor_buildings_company ON public.vendor_buildings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_id
        AND v.company_id IN (SELECT public.get_user_company_ids((SELECT auth.uid())))
    )
  );

CREATE POLICY vendor_buildings_company_manage ON public.vendor_buildings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_id
        AND public.has_company_permission(
          (SELECT auth.uid()),
          v.company_id,
          'company-vendors',
          'edit'
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_id
        AND public.has_company_permission(
          (SELECT auth.uid()),
          v.company_id,
          'company-vendors',
          'edit'
        )
    )
  );

CREATE POLICY vendor_buildings_vendor_select ON public.vendor_buildings
  FOR SELECT TO authenticated
  USING (vendor_id IN (SELECT public.get_user_vendor_ids((SELECT auth.uid()))));

CREATE POLICY po_vendor_update ON public.purchase_orders
  FOR UPDATE TO authenticated
  USING (vendor_id IN (SELECT public.get_user_vendor_ids((SELECT auth.uid()))))
  WITH CHECK (vendor_id IN (SELECT public.get_user_vendor_ids((SELECT auth.uid()))));
