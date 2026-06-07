-- Public aggregate stats for the marketing homepage (anon-safe, no PII).

CREATE OR REPLACE FUNCTION public.get_public_marketing_stats()
RETURNS TABLE (
  communities bigint,
  owners bigint,
  activated_users bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*)::bigint,
    COALESCE(SUM(users_count), 0)::bigint,
    (
      SELECT COUNT(*)::bigint
      FROM unit_occupancies
      WHERE account_status = 'Activated'
        AND archived_at IS NULL
    )
  FROM buildings
  WHERE status = 'active';
$$;

REVOKE ALL ON FUNCTION public.get_public_marketing_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_marketing_stats() TO anon, authenticated;
