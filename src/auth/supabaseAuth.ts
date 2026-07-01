import type { Session, User } from "@supabase/supabase-js";
import { requireSupabase } from "../lib/supabaseClient";
import {
  clearRememberMePreference,
  clearSupabaseAuthStorage,
  getRememberMe,
  setRememberMe,
} from "../lib/supabaseAuthStorage";
import type { LoginPortalRole } from "../resident/data/types";
import type { ProfileCompletionStatus } from "../data/supabase/profileCompletion";
import { supabaseResidentRepository } from "../data/supabase/residentRepository";
import { AUTH_PROFILE_COLUMNS } from "../data/supabase/queryColumns";

export { clearSupabaseAuthStorage, getRememberMe, setRememberMe };

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await requireSupabase().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await requireSupabase().auth.signOut();
  if (error) throw error;
  clearSupabaseAuthStorage();
  clearRememberMePreference();
}

export async function resetPasswordForEmail(email: string) {
  const { error } = await requireSupabase().auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  });
  if (error) throw error;
}

export type AuthChangeEvent =
  | "INITIAL_SESSION"
  | "SIGNED_IN"
  | "SIGNED_OUT"
  | "TOKEN_REFRESHED"
  | "USER_UPDATED"
  | "PASSWORD_RECOVERY"
  | string;

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
) {
  return requireSupabase().auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

export async function getSession() {
  const { data, error } = await requireSupabase().auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  return session?.user ?? null;
}

export async function fetchProfile(userId: string) {
  const { data, error } = await requireSupabase()
    .from("profiles")
    .select(AUTH_PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type AuthProfile = NonNullable<Awaited<ReturnType<typeof fetchProfile>>>;

export function profileMustChangePassword(profile: AuthProfile | null | undefined): boolean {
  return profile?.must_change_password === true;
}

export async function completeRequiredPasswordChange(newPassword: string): Promise<void> {
  const client = requireSupabase();
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Your session has expired. Sign out and sign in again, then retry.");

  const { error: profileError } = await client
    .from("profiles")
    .update({ must_change_password: false, updated_at: new Date().toISOString() })
    .eq("id", user.id);
  if (profileError) throw profileError;

  const { error: passwordError } = await client.auth.updateUser({ password: newPassword });
  if (passwordError) {
    await client
      .from("profiles")
      .update({ must_change_password: true, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    throw passwordError;
  }
}

export async function updateLastLogin(userId: string) {
  await requireSupabase()
    .from("profiles")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", userId);
}

export async function fetchProfileCompletionStatusForCurrentUser(): Promise<ProfileCompletionStatus> {
  return supabaseResidentRepository.getProfileCompletionStatus();
}

export type PortalAccess = {
  isSuperAdmin: boolean;
  portals: LoginPortalRole[];
  defaultPortal: LoginPortalRole;
  companyRole: string | null;
  companyId: string | null;
  buildingIds: string[];
  vendorId: string | null;
};

export async function resolvePortalAccess(
  userId: string,
  profile?: AuthProfile | null
): Promise<PortalAccess> {
  const client = requireSupabase();
  const resolvedProfile = profile ?? (await fetchProfile(userId));

  if (resolvedProfile?.is_super_admin) {
    return {
      isSuperAdmin: true,
      portals: ["company", "building", "resident", "vendor"],
      defaultPortal: "company",
      companyRole: "Company Owner",
      companyId: null,
      buildingIds: [],
      vendorId: null,
    };
  }

  const portals = new Set<LoginPortalRole>();
  let companyRole: string | null = null;
  let companyId: string | null = null;
  const buildingIds = new Set<string>();
  let vendorId: string | null = null;

  const [
    { data: companyMemberships },
    { data: occupancies },
    { data: buildingMemberships },
    { data: vendorUser },
  ] = await Promise.all([
    client.from("company_memberships").select("id, company_id, role").eq("profile_id", userId),
    client
      .from("unit_occupancies")
      .select("building_id, can_access_resident_portal, can_access_building_admin")
      .eq("profile_id", userId)
      .is("archived_at", null),
    client.from("building_memberships").select("building_id").eq("profile_id", userId).eq("status", "active"),
    client.from("vendor_users").select("vendor_id, vendors(status)").eq("profile_id", userId).maybeSingle(),
  ]);

  if (companyMemberships?.length) {
    portals.add("company");
    companyRole = companyMemberships[0].role as string;
    companyId = companyMemberships[0].company_id as string;

    const membershipIds = companyMemberships.map((m) => m.id as string);
    const { data: memberBuildings } = await client
      .from("company_member_buildings")
      .select("building_id, membership_id")
      .in("membership_id", membershipIds);

    const companyBuildingIds = new Set<string>();

    memberBuildings?.forEach((row) => {
      companyBuildingIds.add(row.building_id as string);
    });

    if (companyBuildingIds.size > 0) {
      portals.add("building");
      companyBuildingIds.forEach((id) => buildingIds.add(id));
    }
  }

  occupancies?.forEach((o) => {
    if (o.can_access_resident_portal !== false) {
      portals.add("resident");
    }
    buildingIds.add(o.building_id as string);
    if (o.can_access_building_admin === true) {
      portals.add("building");
    }
  });

  buildingMemberships?.forEach((m) => {
    const occ = occupancies?.find((o) => o.building_id === m.building_id);
    if (occ?.can_access_building_admin === false) return;
    portals.add("building");
    buildingIds.add(m.building_id as string);
  });

  if (vendorUser?.vendor_id) {
    const vendorStatus = (vendorUser.vendors as { status?: string } | null)?.status;
    if (vendorStatus !== "inactive") {
      portals.add("vendor");
      vendorId = vendorUser.vendor_id;
    }
  }

  let defaultPortal: LoginPortalRole = "resident";
  if (portals.has("company")) defaultPortal = "company";
  else if (portals.has("building")) defaultPortal = "building";
  else if (portals.has("vendor")) defaultPortal = "vendor";

  return {
    isSuperAdmin: false,
    portals: [...portals],
    defaultPortal,
    companyRole,
    companyId,
    buildingIds: [...buildingIds],
    vendorId,
  };
}
