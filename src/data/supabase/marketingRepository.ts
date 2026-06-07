import type { CompanyMasterReportStats } from "../../resident/data/types";
import { requireSupabase } from "../../lib/supabaseClient";

export async function getPublicMarketingStats(): Promise<CompanyMasterReportStats | null> {
  const { data, error } = await requireSupabase().rpc("get_public_marketing_stats");
  if (error || !data?.length) return null;

  const row = data[0] as {
    communities: number;
    owners: number;
    activated_users: number;
  };

  return {
    communities: Number(row.communities),
    owners: Number(row.owners),
    activatedUsers: Number(row.activated_users),
  };
}

export const marketingRepository = {
  getPublicMarketingStats,
};
