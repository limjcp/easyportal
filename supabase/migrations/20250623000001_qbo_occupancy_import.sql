-- Link QBO customers to portal occupancies; keep integration flags in sync with token rows.

ALTER TABLE public.unit_occupancies
  ADD COLUMN IF NOT EXISTS qbo_customer_id text;

CREATE UNIQUE INDEX IF NOT EXISTS unit_occupancies_building_qbo_customer_idx
  ON public.unit_occupancies (building_id, qbo_customer_id)
  WHERE qbo_customer_id IS NOT NULL;

-- Repair drift: token row exists but UI flag is false.
UPDATE public.building_external_integrations bei
SET
  qbo_connected = true,
  qbo_company_id = qc.realm_id,
  updated_at = now()
FROM public.quickbooks_connections qc
WHERE bei.building_id = qc.building_id
  AND bei.qbo_connected IS DISTINCT FROM true;

-- Ensure integration rows exist for connected buildings.
INSERT INTO public.building_external_integrations (building_id, qbo_connected, qbo_company_id, updated_at)
SELECT qc.building_id, true, qc.realm_id, now()
FROM public.quickbooks_connections qc
WHERE NOT EXISTS (
  SELECT 1 FROM public.building_external_integrations bei WHERE bei.building_id = qc.building_id
);

CREATE OR REPLACE FUNCTION public.sync_qbo_integration_on_connect()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.building_external_integrations (building_id, qbo_connected, qbo_company_id, updated_at)
  VALUES (NEW.building_id, true, NEW.realm_id, now())
  ON CONFLICT (building_id) DO UPDATE SET
    qbo_connected = true,
    qbo_company_id = EXCLUDED.qbo_company_id,
    updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_qbo_integration_on_disconnect()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.building_external_integrations
  SET
    qbo_connected = false,
    qbo_company_id = NULL,
    updated_at = now()
  WHERE building_id = OLD.building_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS quickbooks_connections_sync_flag ON public.quickbooks_connections;
CREATE TRIGGER quickbooks_connections_sync_flag
AFTER INSERT OR UPDATE ON public.quickbooks_connections
FOR EACH ROW EXECUTE FUNCTION public.sync_qbo_integration_on_connect();

DROP TRIGGER IF EXISTS quickbooks_connections_clear_flag ON public.quickbooks_connections;
CREATE TRIGGER quickbooks_connections_clear_flag
AFTER DELETE ON public.quickbooks_connections
FOR EACH ROW EXECUTE FUNCTION public.sync_qbo_integration_on_disconnect();

-- Safe connection check for authenticated clients (no token exposure).
CREATE OR REPLACE FUNCTION public.building_has_qbo_connection(p_building_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.quickbooks_connections WHERE building_id = p_building_id
  )
  AND p_building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid())));
$$;

GRANT EXECUTE ON FUNCTION public.building_has_qbo_connection(uuid) TO authenticated;

-- Backfill pending occupancies from previously synced QBO customer cache.
INSERT INTO public.unit_occupancies (
  building_id,
  qbo_customer_id,
  resident_name,
  email,
  resident_type,
  account_status,
  unit_id
)
SELECT
  qc.building_id,
  qc.customer_id,
  qc.display_name,
  COALESCE(
    NULLIF(trim(qc.primary_email), ''),
    'qbo-' || qc.customer_id || '@import.invalid'
  ),
  'Owner'::public.resident_type,
  'Awaiting Activation'::public.account_status,
  NULL
FROM public.quickbooks_customers qc
WHERE NOT EXISTS (
  SELECT 1
  FROM public.unit_occupancies uo
  WHERE uo.building_id = qc.building_id
    AND uo.qbo_customer_id = qc.customer_id
)
AND NOT EXISTS (
  SELECT 1
  FROM public.unit_occupancies uo
  WHERE uo.building_id = qc.building_id
    AND lower(trim(uo.email)) = lower(trim(
      COALESCE(NULLIF(trim(qc.primary_email), ''), 'qbo-' || qc.customer_id || '@import.invalid')
    ))
    AND uo.archived_at IS NULL
);
