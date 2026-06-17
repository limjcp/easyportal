-- Portal signup intake: no auth user required; company master report view

ALTER TABLE public.portal_signup_requests
  ALTER COLUMN profile_id DROP NOT NULL;

DROP POLICY IF EXISTS portal_signup_requests_insert_own ON public.portal_signup_requests;

CREATE OR REPLACE VIEW public.v_master_report_portal_signups AS
SELECT
  psr.id,
  'portal-signups'::text AS report_type,
  psr.building_id,
  b.name AS building_label,
  psr.created_at::date AS report_date,
  psr.first_name || ' — Unit ' || psr.unit_number AS title,
  psr.status::text AS status,
  psr.unit_number AS unit,
  psr.email AS owner,
  psr.email AS extra,
  psr.resident_type,
  false AS archived,
  false AS unread
FROM public.portal_signup_requests psr
JOIN public.buildings b ON b.id = psr.building_id;
