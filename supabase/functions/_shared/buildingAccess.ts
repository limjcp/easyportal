import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export async function canAccessBuilding(
  admin: SupabaseClient,
  userId: string,
  buildingId: string,
): Promise<boolean> {
  const { data: profile } = await admin
    .from("profiles")
    .select("is_super_admin")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.is_super_admin === true) return true;

  const { data, error } = await admin.rpc("is_building_member", {
    p_user_id: userId,
    p_building_id: buildingId,
  });
  if (error) throw error;
  return data === true;
}
