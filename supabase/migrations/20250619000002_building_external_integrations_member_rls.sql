-- Allow building admins to read/write external integration flags (Stripe, QuickBooks)

CREATE POLICY external_integrations_building_member
ON public.building_external_integrations
FOR ALL TO authenticated
USING (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))))
WITH CHECK (building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid()))));
