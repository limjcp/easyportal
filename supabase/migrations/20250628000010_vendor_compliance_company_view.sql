-- Allow company users with vendor view access to upload and manage compliance documents.

DROP POLICY IF EXISTS vendor_compliance_company_insert ON public.vendor_compliance_documents;
CREATE POLICY vendor_compliance_company_insert ON public.vendor_compliance_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_id
        AND public.has_company_permission(
          (SELECT auth.uid()),
          v.company_id,
          'company-vendors',
          'view'
        )
    )
  );

DROP POLICY IF EXISTS vendor_compliance_company_update ON public.vendor_compliance_documents;
CREATE POLICY vendor_compliance_company_update ON public.vendor_compliance_documents
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_id
        AND public.has_company_permission(
          (SELECT auth.uid()),
          v.company_id,
          'company-vendors',
          'view'
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
          'view'
        )
    )
  );

DROP POLICY IF EXISTS storage_vendor_write ON storage.objects;
CREATE POLICY storage_vendor_write ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'vendor-documents'
    AND (
      (storage.foldername(name))[1]::uuid IN (SELECT public.get_user_vendor_ids((SELECT auth.uid())))
      OR public.is_super_admin((SELECT auth.uid()))
      OR EXISTS (
        SELECT 1 FROM public.vendors v
        WHERE v.id = (storage.foldername(name))[1]::uuid
          AND public.has_company_permission(
            (SELECT auth.uid()),
            v.company_id,
            'company-vendors',
            'view'
          )
      )
    )
  );

DROP POLICY IF EXISTS storage_vendor_update ON storage.objects;
CREATE POLICY storage_vendor_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'vendor-documents'
    AND (
      (storage.foldername(name))[1]::uuid IN (SELECT public.get_user_vendor_ids((SELECT auth.uid())))
      OR public.is_super_admin((SELECT auth.uid()))
      OR EXISTS (
        SELECT 1 FROM public.vendors v
        WHERE v.id = (storage.foldername(name))[1]::uuid
          AND public.has_company_permission(
            (SELECT auth.uid()),
            v.company_id,
            'company-vendors',
            'view'
          )
      )
    )
  )
  WITH CHECK (
    bucket_id = 'vendor-documents'
    AND (
      (storage.foldername(name))[1]::uuid IN (SELECT public.get_user_vendor_ids((SELECT auth.uid())))
      OR public.is_super_admin((SELECT auth.uid()))
      OR EXISTS (
        SELECT 1 FROM public.vendors v
        WHERE v.id = (storage.foldername(name))[1]::uuid
          AND public.has_company_permission(
            (SELECT auth.uid()),
            v.company_id,
            'company-vendors',
            'view'
          )
      )
    )
  );
