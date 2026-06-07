import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ProvisionKind = "resident" | "company_employee" | "building_admin";

type ProvisionPayload = {
  kind: ProvisionKind;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  buildingId?: string;
  residentType?: string;
  unitId?: string | null;
  occupancyId?: string;
  companyId?: string;
  role?: string;
  assignedBuildingIds?: string[];
  roleCode?: string;
  roleLabel?: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function displayName(firstName: string, lastName: string) {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return jsonResponse({ error: "Server configuration error." }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization." }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { user: caller },
      error: callerError,
    } = await userClient.auth.getUser();
    if (callerError || !caller) {
      return jsonResponse({ error: "Unauthorized." }, 401);
    }

    const payload = (await req.json()) as ProvisionPayload;
    const email = payload.email?.trim().toLowerCase();
    const password = payload.password ?? "";
    const firstName = payload.firstName?.trim() ?? "";
    const lastName = payload.lastName?.trim() ?? "";

    if (!payload.kind || !email || !password || !firstName || !lastName) {
      return jsonResponse({ error: "Missing required fields." }, 400);
    }
    if (password.length < 8) {
      return jsonResponse({ error: "Password must be at least 8 characters." }, 400);
    }

    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("is_super_admin")
      .eq("id", caller.id)
      .maybeSingle();
    const isSuperAdmin = callerProfile?.is_super_admin === true;

    async function hasBuildingAccess(buildingId: string): Promise<boolean> {
      if (isSuperAdmin) return true;
      const { data, error } = await adminClient.rpc("is_building_member", {
        p_user_id: caller.id,
        p_building_id: buildingId,
      });
      if (error) throw error;
      return data === true;
    }

    async function isCompanyOwnerOrAdmin(companyId: string): Promise<boolean> {
      if (isSuperAdmin) return true;
      const { data, error } = await adminClient.rpc("is_company_owner_or_admin", {
        p_user_id: caller.id,
        p_company_id: companyId,
      });
      if (error) throw error;
      return data === true;
    }

    if (payload.kind === "resident") {
      if (!payload.buildingId || !payload.residentType) {
        return jsonResponse({ error: "buildingId and residentType are required." }, 400);
      }
      if (!(await hasBuildingAccess(payload.buildingId))) {
        return jsonResponse({ error: "Not allowed to provision residents for this building." }, 403);
      }
    } else if (payload.kind === "company_employee") {
      if (!payload.companyId || !payload.role) {
        return jsonResponse({ error: "companyId and role are required." }, 400);
      }
      if (!(await isCompanyOwnerOrAdmin(payload.companyId))) {
        return jsonResponse({ error: "Not allowed to provision employees for this company." }, 403);
      }
    } else if (payload.kind === "building_admin") {
      if (!payload.buildingId || !payload.roleCode) {
        return jsonResponse({ error: "buildingId and roleCode are required." }, 400);
      }
      if (!(await hasBuildingAccess(payload.buildingId))) {
        return jsonResponse({ error: "Not allowed to provision building admins." }, 403);
      }
    } else {
      return jsonResponse({ error: "Invalid kind." }, 400);
    }

    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    let userId = existingProfile?.id as string | undefined;
    let created = false;

    if (!userId) {
      const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          display_name: displayName(firstName, lastName),
        },
      });
      if (createError) {
        return jsonResponse({ error: createError.message }, 400);
      }
      userId = createdUser.user.id;
      created = true;
    } else {
      const { error: updateAuthError } = await adminClient.auth.admin.updateUserById(userId, {
        password,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          display_name: displayName(firstName, lastName),
        },
      });
      if (updateAuthError) {
        return jsonResponse({ error: updateAuthError.message }, 400);
      }
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        email,
        first_name: firstName,
        last_name: lastName,
        display_name: displayName(firstName, lastName),
      })
      .eq("id", userId);
    if (profileError) {
      return jsonResponse({ error: profileError.message }, 400);
    }

    let membershipId: string | undefined;

    if (payload.kind === "resident") {
      const buildingId = payload.buildingId!;
      const unitId = payload.unitId ?? null;
      const residentName = displayName(firstName, lastName);

      if (payload.occupancyId) {
        const { error: occError } = await adminClient
          .from("unit_occupancies")
          .update({
            profile_id: userId,
            account_status: "Activated",
            resident_name: residentName,
            email,
          })
          .eq("id", payload.occupancyId)
          .eq("building_id", buildingId);
        if (occError) return jsonResponse({ error: occError.message }, 400);
        membershipId = payload.occupancyId;
      } else {
        const { data: occ, error: occError } = await adminClient
          .from("unit_occupancies")
          .insert({
            building_id: buildingId,
            unit_id: unitId,
            profile_id: userId,
            resident_name: residentName,
            resident_type: payload.residentType,
            email,
            account_status: "Activated",
            date_created: new Date().toISOString().slice(0, 10),
          })
          .select("id")
          .single();
        if (occError) return jsonResponse({ error: occError.message }, 400);
        membershipId = occ.id as string;
      }

      if (unitId) {
        await adminClient.from("units").update({ is_occupied: true }).eq("id", unitId);
      }
    } else if (payload.kind === "company_employee") {
      const companyId = payload.companyId!;
      const { data: existingMembership } = await adminClient
        .from("company_memberships")
        .select("id")
        .eq("company_id", companyId)
        .eq("profile_id", userId)
        .maybeSingle();

      let membershipRowId = existingMembership?.id as string | undefined;
      if (membershipRowId) {
        const { error: updateMemError } = await adminClient
          .from("company_memberships")
          .update({ role: payload.role })
          .eq("id", membershipRowId);
        if (updateMemError) return jsonResponse({ error: updateMemError.message }, 400);
        await adminClient.from("company_member_buildings").delete().eq("membership_id", membershipRowId);
      } else {
        const { data: membership, error: memError } = await adminClient
          .from("company_memberships")
          .insert({
            company_id: companyId,
            profile_id: userId,
            role: payload.role,
          })
          .select("id")
          .single();
        if (memError) return jsonResponse({ error: memError.message }, 400);
        membershipRowId = membership.id as string;
      }

      membershipId = membershipRowId;
      const buildingIds = payload.assignedBuildingIds ?? [];
      if (buildingIds.length > 0 && membershipRowId) {
        const { error: buildingsError } = await adminClient.from("company_member_buildings").insert(
          buildingIds.map((buildingId) => ({
            membership_id: membershipRowId,
            building_id: buildingId,
          }))
        );
        if (buildingsError) return jsonResponse({ error: buildingsError.message }, 400);
      }
    } else if (payload.kind === "building_admin") {
      const buildingId = payload.buildingId!;
      const roleCode = payload.roleCode!;
      const roleLabel = payload.roleLabel?.trim() || roleCode;
      const { data: existingMembership } = await adminClient
        .from("building_memberships")
        .select("id")
        .eq("building_id", buildingId)
        .eq("profile_id", userId)
        .maybeSingle();

      if (existingMembership) {
        const { error: updateError } = await adminClient
          .from("building_memberships")
          .update({
            role_code: roleCode,
            role_label: roleLabel,
            status: "active",
          })
          .eq("building_id", buildingId)
          .eq("profile_id", userId);
        if (updateError) return jsonResponse({ error: updateError.message }, 400);
        membershipId = existingMembership.id as string;
      } else {
        const { data: membership, error: memError } = await adminClient
          .from("building_memberships")
          .insert({
            building_id: buildingId,
            profile_id: userId,
            role_code: roleCode,
            role_label: roleLabel,
            status: "active",
          })
          .select("id")
          .single();
        if (memError) return jsonResponse({ error: memError.message }, 400);
        membershipId = membership.id as string;
      }
    }

    return jsonResponse({
      profileId: userId,
      userId,
      created,
      membershipId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return jsonResponse({ error: message }, 500);
  }
});
