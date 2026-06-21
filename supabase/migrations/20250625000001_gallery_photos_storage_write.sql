-- Allow building members to upload/manage gallery-photos storage objects

CREATE POLICY storage_gallery_photos_write ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'gallery-photos'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT public.get_user_building_ids((select auth.uid()))
    )
  );

CREATE POLICY storage_gallery_photos_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'gallery-photos'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT public.get_user_building_ids((select auth.uid()))
    )
  )
  WITH CHECK (
    bucket_id = 'gallery-photos'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT public.get_user_building_ids((select auth.uid()))
    )
  );

CREATE POLICY storage_gallery_photos_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'gallery-photos'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT public.get_user_building_ids((select auth.uid()))
    )
  );
