import { requireSupabase } from "../../lib/supabaseClient";

export type ProvisionUserKind = "resident" | "company_employee" | "building_admin";

export type ProvisionUserPayload = {
  kind: ProvisionUserKind;
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

export type ProvisionUserResult = {
  profileId: string;
  userId: string;
  created: boolean;
  membershipId?: string;
};

export async function provisionUser(payload: ProvisionUserPayload): Promise<ProvisionUserResult> {
  const { data, error } = await requireSupabase().functions.invoke("provision-user", {
    body: payload,
  });

  if (error) {
    throw new Error(error.message || "Failed to provision user.");
  }

  const body = data as { error?: string } & Partial<ProvisionUserResult>;
  if (body?.error) {
    throw new Error(body.error);
  }
  if (!body?.profileId || !body?.userId) {
    throw new Error("Invalid response from user provisioning.");
  }

  return {
    profileId: body.profileId,
    userId: body.userId,
    created: body.created ?? false,
    membershipId: body.membershipId,
  };
}
