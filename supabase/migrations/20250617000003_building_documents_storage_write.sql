-- Migration 018: allow building members to upload/manage building-documents storage objects

CREATE POLICY storage_building_write ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'building-documents'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT public.get_user_building_ids((select auth.uid()))
    )
  );

CREATE POLICY storage_building_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'building-documents'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT public.get_user_building_ids((select auth.uid()))
    )
  )
  WITH CHECK (
    bucket_id = 'building-documents'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT public.get_user_building_ids((select auth.uid()))
    )
  );

CREATE POLICY storage_building_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'building-documents'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT public.get_user_building_ids((select auth.uid()))
    )
  );
