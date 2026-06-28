import type {
  CompanyBuilding,
  CompanyEmployee,
  CompanyNotification,
  CompanySubscription,
  CompanyUser,
  CreateBuildingInput,
  CreateEmployeeInput,
  CreatePurchaseOrderInput,
  CreateVendorInput,
  ManagementCompanyProfile,
  MasterReportListParams,
  MasterReportListResult,
  MasterReportRow,
  MasterReportType,
  PermissionModuleRow,
  PurchaseOrder,
  PurchaseOrderNegotiation,
  PurchaseOrderStatus,
  RoleNameOverride,
  RolePermissionDefaults,
  UpdateCompanyUserInput,
  UpdateManagementCompanyInput,
  UpdateVendorInput,
  Vendor,
  BuildingSubscription,
  BuildingTotalRow,
  CompanyMasterReportStats,
  StripePayout,
  CustomPortalTile,
  PortalModuleConfig,
  CompanyRole,
  CreateVendorInput as CreateVendorInputType,
  BoardApprovalDetail,
  CertificateDetail,
  Comment,
  IncidentReportComment,
  IncidentReportDetail,
  CertificateFile,
  CertificateHistoryEntry,
  BoardApprovalComment,
  SubmitPoProposalInput,
} from "../../resident/data/types";
import {
  getActiveBuildingId,
  getActiveCompanyId,
  requireActiveCompanyId,
  setActiveBuildingId,
} from "./buildingContext";
import { mapDbError, nowIso, sb, todayIsoDate } from "./base";
import { ensureDefaultDocumentFolders } from "./admin/documentFolders";
import { ensureDefaultPortalModules } from "./admin/portalRepository";
import { loadEntityComments, loadIncidentReportAttachments } from "./admin/shared";
import * as companyReportOps from "./companyReportOperations";
import type { CertificateSettingsData } from "./companyReportOperations";
import { provisionUser } from "./provisionUser";
import { invokeSendPortalEmail } from "./sendPortalEmail";
import { createDefaultPermissionsForRole, DEFAULT_ROLE_NAMES } from "../../company/data/mock/permissions";
import { ensureCompanyRolePermissions, mapCompanyPermissionDbRows, mergePermissionRows } from "./portalModulePermissions";
import { certificateDetailFromRow } from "../../company/data/mock/certificateDetails";
import { boardApprovalDetailFromRow } from "../../company/data/mock/boardApprovalDetails";
import { buildLobbyDisplayUrl } from "../../shared/portalDomain";
import { BUILDING_LIST_COLUMNS, ADMIN_USER_PROFILE_COLUMNS } from "./queryColumns";
import {
  prepareQuoteRequestOnSend,
  purchaseOrderNegotiationRepository,
} from "./purchaseOrderNegotiationRepository";

function mapBuilding(row: Record<string, unknown>): CompanyBuilding {
  return {
    id: row.id as string,
    code: row.code as string,
    name: row.name as string,
    address: row.address as string,
    condoLine: (row.condo_line as string) ?? undefined,
    cityProvincePostal: (row.city_province_postal as string) ?? undefined,
    subscriptionPackage: row.subscription_package as string,
    status: row.status as "active" | "inactive",
    unitsCount: row.units_count as number,
    adminsCount: row.admins_count as number,
    usersCount: row.users_count as number,
    imageUrl: (row.image_url as string) ?? undefined,
    lastActivity: row.last_activity ? String(row.last_activity).slice(0, 10) : undefined,
  };
}

type BuildingAdminSummary = {
  admins?: string;
  adminsCount: number;
};

async function loadBuildingAdminSummaries(
  buildingIds: string[]
): Promise<Map<string, BuildingAdminSummary>> {
  const summaries = new Map<string, BuildingAdminSummary>();
  if (buildingIds.length === 0) return summaries;

  const { data, error } = await sb()
    .from("building_memberships")
    .select("building_id, status, profiles(first_name, last_name)")
    .in("building_id", buildingIds);
  mapDbError(error);

  const namesByBuilding = new Map<string, string[]>();
  for (const row of data ?? []) {
    if (row.status !== "active") continue;
    const buildingId = row.building_id as string;
    const profile = row.profiles as { first_name: string; last_name: string } | null;
    if (!profile) continue;
    const name = `${profile.first_name} ${profile.last_name}`.trim();
    if (!name) continue;
    const names = namesByBuilding.get(buildingId) ?? [];
    names.push(name);
    namesByBuilding.set(buildingId, names);
  }

  for (const buildingId of buildingIds) {
    const names = (namesByBuilding.get(buildingId) ?? []).sort((a, b) => a.localeCompare(b));
    summaries.set(buildingId, {
      admins: names.length > 0 ? names.join(", ") : undefined,
      adminsCount: names.length,
    });
  }

  return summaries;
}

function enrichBuilding(
  building: CompanyBuilding,
  summary?: BuildingAdminSummary
): CompanyBuilding {
  if (!summary) return building;
  return {
    ...building,
    admins: summary.admins,
    adminsCount: summary.adminsCount,
  };
}

async function ensureCompanyId(): Promise<string> {
  const activeCompanyId = getActiveCompanyId();
  if (activeCompanyId) return activeCompanyId;

  const {
    data: { user },
  } = await sb().auth.getUser();
  if (user) {
    const { data: membership } = await sb()
      .from("company_memberships")
      .select("company_id")
      .eq("profile_id", user.id)
      .limit(1)
      .maybeSingle();
    if (membership?.company_id) return membership.company_id as string;

    const buildingId = getActiveBuildingId();
    if (buildingId) {
      const { data: building } = await sb()
        .from("buildings")
        .select("company_id")
        .eq("id", buildingId)
        .maybeSingle();
      if (building?.company_id) return building.company_id as string;
    }
  }

  throw new Error("No active company context. Sign in as a company user first.");
}

const IMPLICIT_ALL_BUILDING_ROLES: CompanyRole[] = ["Company Owner", "Company Administrator"];

function hasImplicitAllBuildings(role: CompanyRole, assignedCount: number): boolean {
  return IMPLICIT_ALL_BUILDING_ROLES.includes(role) && assignedCount === 0;
}

export function requiresExplicitBuildingAssignments(role: CompanyRole): boolean {
  return !IMPLICIT_ALL_BUILDING_ROLES.includes(role);
}

async function syncMemberBuildingAssignments(
  membershipId: string,
  buildingIds: string[],
  role: CompanyRole
): Promise<void> {
  const { error: deleteError } = await sb()
    .from("company_member_buildings")
    .delete()
    .eq("membership_id", membershipId);
  mapDbError(deleteError);

  if (hasImplicitAllBuildings(role, buildingIds.length)) {
    return;
  }

  const uniqueIds = [...new Set(buildingIds.filter(Boolean))];
  if (uniqueIds.length === 0) return;

  const { error: insertError } = await sb().from("company_member_buildings").insert(
    uniqueIds.map((buildingId) => ({
      membership_id: membershipId,
      building_id: buildingId,
    }))
  );
  mapDbError(insertError);
}

export type CurrentCompanyMembership = {
  membershipId: string;
  role: CompanyRole;
  assignedBuildingIds: string[];
  hasImplicitAllBuildings: boolean;
};

async function getCurrentCompanyMembership(): Promise<CurrentCompanyMembership> {
  const companyId = await ensureCompanyId();
  const {
    data: { user },
  } = await sb().auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: membership, error } = await sb()
    .from("company_memberships")
    .select("id, role")
    .eq("profile_id", user.id)
    .eq("company_id", companyId)
    .maybeSingle();
  mapDbError(error);
  if (!membership) throw new Error("Company membership not found.");

  const { data: links, error: linksError } = await sb()
    .from("company_member_buildings")
    .select("building_id")
    .eq("membership_id", membership.id);
  mapDbError(linksError);

  const assignedBuildingIds = (links ?? []).map((row) => row.building_id as string);
  const role = membership.role as CompanyRole;

  return {
    membershipId: membership.id as string,
    role,
    assignedBuildingIds,
    hasImplicitAllBuildings: hasImplicitAllBuildings(role, assignedBuildingIds.length),
  };
}

async function assignBuildingToCurrentMembership(buildingId: string): Promise<void> {
  const membership = await getCurrentCompanyMembership();
  if (membership.hasImplicitAllBuildings) return;

  const { error } = await sb().from("company_member_buildings").upsert(
    {
      membership_id: membership.membershipId,
      building_id: buildingId,
    },
    { onConflict: "membership_id,building_id" }
  );
  mapDbError(error);
}

export const supabaseCompanyRepository = {
  async assertBuildingAccess(buildingId: string): Promise<void> {
    const { data, error } = await sb()
      .from("buildings")
      .select("id")
      .eq("id", buildingId)
      .maybeSingle();
    mapDbError(error);
    if (!data) {
      throw new Error("You do not have access to this building.");
    }
  },

  async resolveAccessibleBuildingIds(): Promise<string[] | null> {
    try {
      const membership = await getCurrentCompanyMembership();
      if (membership.hasImplicitAllBuildings) return null;
      return membership.assignedBuildingIds;
    } catch {
      const buildings = await this.getBuildings();
      return buildings.map((b) => b.id);
    }
  },

  async getCurrentCompanyMembership(): Promise<CurrentCompanyMembership> {
    return getCurrentCompanyMembership();
  },

  async getCompanyUser(): Promise<CompanyUser> {
    const {
      data: { user },
    } = await sb().auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data: profile, error } = await sb()
      .from("profiles")
      .select(ADMIN_USER_PROFILE_COLUMNS)
      .eq("id", user.id)
      .single();
    mapDbError(error);
    const companyId = await ensureCompanyId();
    const { data: membership } = await sb()
      .from("company_memberships")
      .select("role")
      .eq("profile_id", user.id)
      .eq("company_id", companyId)
      .maybeSingle();
    const { data: company } = await sb()
      .from("management_companies")
      .select("company_name")
      .eq("id", companyId)
      .single();
    return {
      id: user.id,
      displayName: profile!.display_name,
      firstName: profile!.first_name,
      lastName: profile!.last_name,
      email: profile!.email,
      role: (membership?.role as CompanyRole) ?? "Company Owner",
      managementCompany: company?.company_name ?? "",
      timezone: profile!.timezone,
      telHome: profile!.tel_home ?? "",
      telMobile: profile!.tel_mobile ?? "",
      telWork: profile!.tel_business ?? "",
      avatarUrl: profile!.avatar_url ?? undefined,
    };
  },

  async updateCompanyUser(input: UpdateCompanyUserInput): Promise<CompanyUser> {
    const {
      data: { user },
    } = await sb().auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { error } = await sb()
      .from("profiles")
      .update({
        first_name: input.firstName.trim(),
        last_name: input.lastName.trim(),
        email: input.email.trim(),
        display_name: `${input.firstName.trim()} ${input.lastName.trim()}`,
        timezone: input.timezone,
        tel_home: input.telHome?.trim() ?? "",
        tel_mobile: input.telMobile?.trim() ?? "",
        tel_business: input.telWork?.trim() ?? "",
      })
      .eq("id", user.id);
    mapDbError(error);
    return this.getCompanyUser();
  },

  async getManagementCompanyProfile(): Promise<ManagementCompanyProfile> {
    const companyId = await ensureCompanyId();
    const { data, error } = await sb().from("management_companies").select("*").eq("id", companyId).single();
    mapDbError(error);
    return {
      id: data!.id as string,
      companyName: data!.company_name as string,
      address: data!.address as string,
      city: data!.city as string,
      postalZip: data!.postal_zip as string,
      country: data!.country as string,
      provinceState: data!.province_state as string,
      timezone: data!.timezone as string,
      companyEmail: data!.company_email as string,
      tel1: data!.tel1 as string,
      tel2: data!.tel2 as string,
      fax: data!.fax as string,
      logoUrl: (data!.logo_url as string) ?? undefined,
    };
  },

  async updateManagementCompanyProfile(
    input: UpdateManagementCompanyInput
  ): Promise<ManagementCompanyProfile> {
    const companyId = await ensureCompanyId();
    const { error } = await sb()
      .from("management_companies")
      .update({
        company_name: input.companyName.trim(),
        address: input.address.trim(),
        city: input.city.trim(),
        postal_zip: input.postalZip.trim(),
        country: input.country,
        province_state: input.provinceState,
        timezone: input.timezone,
        company_email: input.companyEmail.trim(),
        tel1: input.tel1.trim(),
        tel2: input.tel2?.trim() ?? "",
        fax: input.fax?.trim() ?? "",
      })
      .eq("id", companyId);
    mapDbError(error);
    return this.getManagementCompanyProfile();
  },

  async deleteManagementCompanyLogo(): Promise<ManagementCompanyProfile> {
    const companyId = await ensureCompanyId();
    await sb().from("management_companies").update({ logo_url: null }).eq("id", companyId);
    return this.getManagementCompanyProfile();
  },

  async getBuildings(): Promise<CompanyBuilding[]> {
    return this.getBuildingsByStatus("active");
  },

  async getArchivedBuildings(): Promise<CompanyBuilding[]> {
    return this.getBuildingsByStatus("inactive");
  },

  async getBuildingsByStatus(status: "active" | "inactive"): Promise<CompanyBuilding[]> {
    const companyId = await ensureCompanyId();
    const { data, error } = await sb()
      .from("buildings")
      .select(BUILDING_LIST_COLUMNS)
      .eq("company_id", companyId)
      .eq("status", status);
    mapDbError(error);
    const buildings = (data ?? []).map((row) => mapBuilding(row as Record<string, unknown>));
    const summaries = await loadBuildingAdminSummaries(buildings.map((b) => b.id));
    return buildings.map((b) => enrichBuilding(b, summaries.get(b.id)));
  },

  async getBuilding(id: string): Promise<CompanyBuilding | undefined> {
    const { data, error } = await sb()
      .from("buildings")
      .select(BUILDING_LIST_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    mapDbError(error);
    if (!data) return undefined;
    const building = mapBuilding(data as Record<string, unknown>);
    const summaries = await loadBuildingAdminSummaries([building.id]);
    return enrichBuilding(building, summaries.get(building.id));
  },

  async checkSubdomainAvailable(subdomain: string): Promise<boolean> {
    const normalized = subdomain.trim().toLowerCase();
    if (!normalized) return false;
    const { data, error } = await sb()
      .from("buildings")
      .select("id")
      .eq("subdomain", normalized)
      .maybeSingle();
    mapDbError(error);
    return !data;
  },

  async createBuilding(input: CreateBuildingInput): Promise<CompanyBuilding> {
    const companyId = await ensureCompanyId();
    const code = input.corp.trim().toUpperCase();
    const displayName = input.buildingName?.trim() || code;
    const condoLine = `(${code}${input.corpNo ? ` ${input.corpNo}` : ""}) ${input.address}`.trim();
    const cityProvincePostal = `${input.city}, ${input.provinceState} ${input.postalZip}`.trim();
    const { data, error } = await sb()
      .from("buildings")
      .insert({
        company_id: companyId,
        code,
        name: displayName,
        condo_name: code,
        corporation: code,
        corp_number: input.corpNo ?? "",
        address: `${condoLine}, ${cityProvincePostal}`,
        condo_line: condoLine,
        city_province_postal: cityProvincePostal,
        city: input.city,
        postal_zip: input.postalZip,
        country: input.country,
        province: input.provinceState,
        subdomain: input.subdomain.trim().toLowerCase(),
        subscription_package: "Basic Package",
        status: "active",
      })
      .select("*")
      .single();
    mapDbError(error);
    const buildingId = data!.id as string;
    await sb().from("portal_settings").insert({ building_id: buildingId });
    await sb().from("public_portal_settings").insert({
      building_id: buildingId,
      subdomain: input.subdomain,
      lobby_display_url: buildLobbyDisplayUrl(input.subdomain),
    });
    await sb().from("portal_tile_settings").insert({ building_id: buildingId });
    await ensureDefaultPortalModules(buildingId);
    await ensureDefaultDocumentFolders(buildingId);
    await assignBuildingToCurrentMembership(buildingId);
    setActiveBuildingId(buildingId);
    return mapBuilding(data as Record<string, unknown>);
  },

  async archiveBuilding(id: string): Promise<void> {
    const companyId = await ensureCompanyId();
    const { error } = await sb()
      .from("buildings")
      .update({ status: "inactive" })
      .eq("id", id)
      .eq("company_id", companyId);
    mapDbError(error);
  },

  async restoreBuilding(id: string): Promise<void> {
    const companyId = await ensureCompanyId();
    const { error } = await sb()
      .from("buildings")
      .update({ status: "active" })
      .eq("id", id)
      .eq("company_id", companyId);
    mapDbError(error);
  },

  async getEmployees(): Promise<CompanyEmployee[]> {
    const companyId = await ensureCompanyId();
    const { data, error } = await sb()
      .from("company_memberships")
      .select(
        "id, role, profile:profiles(first_name, last_name, email, last_login_at), company_member_buildings(building_id)"
      )
      .eq("company_id", companyId);
    mapDbError(error);
    return (data ?? [])
      .map((row) => {
        const profile = row.profile as {
          first_name: string;
          last_name: string;
          email: string;
          last_login_at: string | null;
        } | null;
        if (!profile) return null;
        const buildingLinks = (row.company_member_buildings ?? []) as Array<{ building_id: string }>;
        return {
          id: row.id as string,
          membershipId: row.id as string,
          firstName: profile.first_name,
          lastName: profile.last_name,
          email: profile.email,
          role: row.role as CompanyRole,
          assignedBuildingIds: buildingLinks.map((link) => link.building_id),
          lastLogin: profile.last_login_at ?? undefined,
        };
      })
      .filter((employee): employee is CompanyEmployee => employee !== null);
  },

  async createEmployee(input: CreateEmployeeInput): Promise<CompanyEmployee> {
    const companyId = await ensureCompanyId();
    if (!input.email?.trim()) {
      throw new Error("Email is required to create an employee login.");
    }
    const result = await provisionUser({
      kind: "company_employee",
      email: input.email.trim(),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      companyId,
      role: input.role,
      assignedBuildingIds: input.assignedBuildingIds,
    });
    const membershipId = result.membershipId;
    if (membershipId) {
      await invokeSendPortalEmail({
        type: "employee_login_details",
        membershipId,
      });
    }
    const employees = await this.getEmployees();
    const created =
      employees.find((e) => e.id === result.membershipId) ??
      employees.find((e) => e.email.toLowerCase() === input.email.trim().toLowerCase());
    if (!created) {
      return {
        id: result.membershipId ?? result.profileId,
        membershipId: result.membershipId ?? result.profileId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        role: input.role,
        assignedBuildingIds: input.assignedBuildingIds,
      };
    }
    return created;
  },

  async updateEmployee(id: string, input: Partial<CreateEmployeeInput>): Promise<CompanyEmployee | undefined> {
    const companyId = await ensureCompanyId();
    const { data: membership, error: membershipError } = await sb()
      .from("company_memberships")
      .select("id, profile_id, role")
      .eq("id", id)
      .eq("company_id", companyId)
      .maybeSingle();
    mapDbError(membershipError);
    if (!membership) return undefined;

    const nextRole = (input.role ?? membership.role) as CompanyRole;

    if (input.role) {
      const { error: roleError } = await sb()
        .from("company_memberships")
        .update({ role: input.role })
        .eq("id", id);
      mapDbError(roleError);
    }

    if (input.firstName !== undefined || input.lastName !== undefined || input.email !== undefined) {
      const firstName = input.firstName?.trim();
      const lastName = input.lastName?.trim();
      const email = input.email?.trim();
      const profileUpdates: Record<string, unknown> = {};
      if (firstName) profileUpdates.first_name = firstName;
      if (lastName) profileUpdates.last_name = lastName;
      if (email) profileUpdates.email = email;
      if (firstName && lastName) {
        profileUpdates.display_name = `${firstName} ${lastName}`;
      }
      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await sb()
          .from("profiles")
          .update(profileUpdates)
          .eq("id", membership.profile_id);
        mapDbError(profileError);
      }
    }

    if (input.assignedBuildingIds !== undefined) {
      await syncMemberBuildingAssignments(id, input.assignedBuildingIds, nextRole);
    }

    const employees = await this.getEmployees();
    return employees.find((e) => e.id === id);
  },

  async emailEmployeeLoginDetails(employeeId: string) {
    return invokeSendPortalEmail({
      type: "employee_login_details",
      membershipId: employeeId,
    });
  },

  async archiveEmployee(membershipId: string): Promise<void> {
    const companyId = await ensureCompanyId();
    const { data, error } = await sb()
      .from("company_memberships")
      .select("id")
      .eq("id", membershipId)
      .eq("company_id", companyId)
      .maybeSingle();
    mapDbError(error);
    if (!data) throw new Error("Employee not found.");
    const { error: deleteError } = await sb().from("company_memberships").delete().eq("id", membershipId);
    mapDbError(deleteError);
  },

  async getRoleNameOverrides(): Promise<RoleNameOverride[]> {
    const companyId = await ensureCompanyId();
    const { data, error } = await sb()
      .from("role_name_overrides")
      .select("default_role, custom_name")
      .eq("company_id", companyId);
    mapDbError(error);
    const customByRole = new Map(
      (data ?? []).map((r) => [r.default_role as string, r.custom_name as string])
    );
    return DEFAULT_ROLE_NAMES.map((row) => ({
      defaultRole: row.defaultRole,
      customName: customByRole.get(row.defaultRole) ?? row.customName,
    }));
  },

  async saveRoleNameOverrides(overrides: RoleNameOverride[]): Promise<void> {
    const companyId = await ensureCompanyId();
    for (const row of overrides) {
      await sb().from("role_name_overrides").upsert({
        company_id: companyId,
        default_role: row.defaultRole,
        custom_name: row.customName,
      });
    }
  },

  async getRolePermissions(role: CompanyRole): Promise<PermissionModuleRow[]> {
    const companyId = await ensureCompanyId();
    try {
      await ensureCompanyRolePermissions(companyId, role);
    } catch {
      // Seed may fail under RLS; fall back to query or mock defaults below.
    }
    const { data, error } = await sb()
      .from("role_permission_defaults")
      .select("module_key, can_create, can_view, can_edit, can_delete, can_archive")
      .eq("company_id", companyId)
      .eq("role", role);
    mapDbError(error);
    if (!data?.length) {
      return createDefaultPermissionsForRole(role);
    }
    return mapCompanyPermissionDbRows(data);
  },

  async getEmployeePermissions(membershipId: string): Promise<PermissionModuleRow[]> {
    const companyId = await ensureCompanyId();
    const { data: membership, error: membershipError } = await sb()
      .from("company_memberships")
      .select("role")
      .eq("id", membershipId)
      .eq("company_id", companyId)
      .maybeSingle();
    mapDbError(membershipError);
    if (!membership) return createDefaultPermissionsForRole("Property Administrator");

    const role = membership.role as CompanyRole;
    const roleDefaults = await this.getRolePermissions(role);
    const { data: overrides, error: overrideError } = await sb()
      .from("company_membership_permissions")
      .select("module_key, can_create, can_view, can_edit, can_delete, can_archive")
      .eq("membership_id", membershipId);
    mapDbError(overrideError);
    if (!overrides?.length) return roleDefaults;

    const overrideRows = mapCompanyPermissionDbRows(overrides);
    return mergePermissionRows(roleDefaults, overrideRows);
  },

  async saveEmployeePermissions(
    membershipId: string,
    permissions: PermissionModuleRow[]
  ): Promise<void> {
    await sb().from("company_membership_permissions").delete().eq("membership_id", membershipId);
    if (permissions.length === 0) return;
    const { error } = await sb().from("company_membership_permissions").insert(
      permissions.map((p) => ({
        membership_id: membershipId,
        module_key: p.moduleKey,
        can_create: p.create,
        can_view: p.view,
        can_edit: p.edit,
        can_delete: p.delete,
        can_archive: p.archive,
      }))
    );
    mapDbError(error);
  },

  async saveRolePermissions(
    role: CompanyRole,
    permissions: RolePermissionDefaults["permissions"]
  ): Promise<void> {
    const companyId = await ensureCompanyId();
    for (const p of permissions) {
      await sb().from("role_permission_defaults").upsert({
        company_id: companyId,
        role,
        module_key: p.moduleKey,
        can_create: p.create,
        can_view: p.view,
        can_edit: p.edit,
        can_delete: p.delete,
        can_archive: p.archive,
      });
    }
  },

  async getVendors(): Promise<Vendor[]> {
    const companyId = await ensureCompanyId();
    const { data, error } = await sb()
      .from("vendors")
      .select("*, vendor_buildings(building_id)")
      .eq("company_id", companyId);
    mapDbError(error);
    return (data ?? []).map((v) => {
      const buildingLinks = (v.vendor_buildings ?? []) as Array<{ building_id: string }>;
      return {
        id: v.id as string,
        companyName: v.company_name as string,
        tradeCategory: v.trade_category as string,
        contactName: v.contact_name as string,
        phone: v.phone as string,
        email: v.email as string,
        notes: v.notes as string,
        status: v.status as Vendor["status"],
        wsibRequired: (v.wsib_required as boolean) ?? true,
        buildingIds: buildingLinks.map((link) => link.building_id),
      };
    });
  },

  async createVendor(input: CreateVendorInputType): Promise<Vendor> {
    const companyId = await ensureCompanyId();
    const { data, error } = await sb()
      .from("vendors")
      .insert({
        company_id: companyId,
        company_name: input.companyName,
        trade_category: input.tradeCategory,
        contact_name: input.contactName,
        phone: input.phone,
        email: input.email,
        notes: input.notes ?? "",
        status: input.status ?? "active",
        wsib_required: input.wsibRequired ?? true,
      })
      .select("*")
      .single();
    mapDbError(error);
    if (input.buildingIds?.length) {
      await sb().from("vendor_buildings").insert(
        input.buildingIds.map((buildingId) => ({
          vendor_id: data!.id,
          building_id: buildingId,
        }))
      );
    }
    return {
      id: data!.id as string,
      companyName: data!.company_name as string,
      tradeCategory: data!.trade_category as string,
      contactName: data!.contact_name as string,
      phone: data!.phone as string,
      email: data!.email as string,
      notes: data!.notes as string,
      status: data!.status as Vendor["status"],
      wsibRequired: (data!.wsib_required as boolean) ?? true,
      buildingIds: input.buildingIds,
    };
  },

  async updateVendor(id: string, input: UpdateVendorInput): Promise<Vendor | undefined> {
    const { data, error } = await sb()
      .from("vendors")
      .update({
        company_name: input.companyName,
        trade_category: input.tradeCategory,
        contact_name: input.contactName,
        phone: input.phone,
        email: input.email,
        notes: input.notes,
        status: input.status,
        wsib_required: input.wsibRequired,
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    mapDbError(error);
    if (!data) return undefined;

    if (input.buildingIds) {
      await sb().from("vendor_buildings").delete().eq("vendor_id", id);
      if (input.buildingIds.length > 0) {
        await sb().from("vendor_buildings").insert(
          input.buildingIds.map((buildingId) => ({
            vendor_id: id,
            building_id: buildingId,
          }))
        );
      }
    }

    const buildingIds =
      input.buildingIds ??
      (
        await sb().from("vendor_buildings").select("building_id").eq("vendor_id", id)
      ).data?.map((row) => row.building_id as string);

    return {
      id: data.id as string,
      companyName: data.company_name as string,
      tradeCategory: data.trade_category as string,
      contactName: data.contact_name as string,
      phone: data.phone as string,
      email: data.email as string,
      notes: data.notes as string,
      status: data.status as Vendor["status"],
      wsibRequired: (data.wsib_required as boolean) ?? true,
      buildingIds,
    };
  },

  async inviteVendor(vendorId: string, email: string): Promise<Vendor | undefined> {
    await sb().from("vendor_invitations").insert({ vendor_id: vendorId, invited_email: email });
    await sb().from("vendors").update({ status: "pending_invite", email }).eq("id", vendorId);
    await invokeSendPortalEmail({ type: "vendor_invite", vendorId, email });
    return this.getVendors().then((v) => v.find((x) => x.id === vendorId));
  },

  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    return this.getAllPurchaseOrders();
  },

  async getAllPurchaseOrders(): Promise<PurchaseOrder[]> {
    const companyId = await ensureCompanyId();
    const { data, error } = await sb()
      .from("purchase_orders")
      .select("*, purchase_order_line_items(*)")
      .eq("company_id", companyId);
    mapDbError(error);
    return (data ?? []).map(mapPurchaseOrder);
  },

  async getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined> {
    const { data, error } = await sb()
      .from("purchase_orders")
      .select("*, purchase_order_line_items(*)")
      .eq("id", id)
      .maybeSingle();
    mapDbError(error);
    return data ? mapPurchaseOrder(data) : undefined;
  },

  async getPurchaseOrdersByVendor(vendorId: string): Promise<PurchaseOrder[]> {
    const { data, error } = await sb()
      .from("purchase_orders")
      .select("*, purchase_order_line_items(*)")
      .eq("vendor_id", vendorId);
    mapDbError(error);
    return (data ?? []).map(mapPurchaseOrder);
  },

  async getActivePurchaseOrderCountsByVendor(): Promise<Record<string, number>> {
    const orders = await this.getAllPurchaseOrders();
    const counts: Record<string, number> = {};
    for (const po of orders) {
      if (["sent", "quoted", "negotiating"].includes(po.status)) {
        counts[po.vendorId] = (counts[po.vendorId] ?? 0) + 1;
      }
    }
    return counts;
  },

  async getPurchaseOrdersBySourceRequest(
    kind: "company-service-request" | "admin-service-request",
    requestId: string
  ): Promise<PurchaseOrder[]> {
    const { data, error } = await sb()
      .from("purchase_orders")
      .select("*, purchase_order_line_items(*)")
      .eq("source_kind", kind)
      .eq("source_request_id", requestId);
    mapDbError(error);
    return (data ?? []).map(mapPurchaseOrder);
  },

  async createPurchaseOrder(input: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
    const companyId = await ensureCompanyId();
    const total = input.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
    const status = input.status ?? "draft";
    const quoteMeta =
      status === "sent" ? prepareQuoteRequestOnSend(total) : { isQuoteRequest: false, awaitingResponseFrom: null };
    const { data: po, error } = await sb()
      .from("purchase_orders")
      .insert({
        company_id: companyId,
        building_id: input.buildingId,
        vendor_id: input.vendorId,
        po_number: `PO-${Date.now()}`,
        status,
        source_kind: input.sourceRequest?.kind,
        source_request_id: input.sourceRequest?.requestId,
        total,
        notes: input.notes,
        created_by_name: "Admin",
        is_quote_request: quoteMeta.isQuoteRequest,
        awaiting_response_from: quoteMeta.awaitingResponseFrom,
        sent_at: status === "sent" ? nowIso() : null,
      })
      .select("*")
      .single();
    mapDbError(error);
    const { error: lineError } = await sb().from("purchase_order_line_items").insert(
      input.lineItems.map((li) => ({
        purchase_order_id: po!.id,
        description: li.description,
        quantity: li.quantity,
        unit_price: li.unitPrice,
      }))
    );
    mapDbError(lineError);
    return (await this.getPurchaseOrder(po!.id as string))!;
  },

  async updatePurchaseOrderStatus(id: string, status: PurchaseOrderStatus) {
    const { error } = await sb()
      .from("purchase_orders")
      .update({ status, responded_at: nowIso() })
      .eq("id", id);
    mapDbError(error);
    return this.getPurchaseOrder(id);
  },

  async sendPurchaseOrder(id: string) {
    const po = await this.getPurchaseOrder(id);
    if (!po) throw new Error("Purchase order not found.");
    const quoteMeta = prepareQuoteRequestOnSend(po.total);
    const { error } = await sb()
      .from("purchase_orders")
      .update({
        status: "sent",
        sent_at: nowIso(),
        is_quote_request: quoteMeta.isQuoteRequest,
        awaiting_response_from: quoteMeta.awaitingResponseFrom,
      })
      .eq("id", id);
    mapDbError(error);
    return this.getPurchaseOrder(id);
  },

  async getPurchaseOrderNegotiations(purchaseOrderId: string): Promise<PurchaseOrderNegotiation[]> {
    return purchaseOrderNegotiationRepository.getNegotiations(purchaseOrderId);
  },

  async submitCompanyCounterOffer(
    purchaseOrderId: string,
    input: SubmitPoProposalInput
  ): Promise<PurchaseOrder | undefined> {
    const po = await this.getPurchaseOrder(purchaseOrderId);
    if (!po) return undefined;
    await purchaseOrderNegotiationRepository.submitCompanyCounterOffer(po, "Company", input);
    return this.getPurchaseOrder(purchaseOrderId);
  },

  async acceptVendorQuote(purchaseOrderId: string): Promise<PurchaseOrder | undefined> {
    const po = await this.getPurchaseOrder(purchaseOrderId);
    if (!po) return undefined;
    await purchaseOrderNegotiationRepository.acceptOffer(po, "company", "Company");
    return this.getPurchaseOrder(purchaseOrderId);
  },

  async getNotifications(): Promise<CompanyNotification[]> {
    const companyId = await ensureCompanyId();
    const { data, error } = await sb()
      .from("company_notifications")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    mapDbError(error);
    return (data ?? []).map((n) => ({
      id: n.id as string,
      type: n.notification_type as CompanyNotification["type"],
      message: n.message as string,
      read: n.read as boolean,
      createdAt: n.created_at as string,
      poId: n.po_id as string,
    }));
  },

  async markNotificationRead(id: string): Promise<void> {
    await sb().from("company_notifications").update({ read: true }).eq("id", id);
  },

  async markAllNotificationsRead(): Promise<void> {
    const companyId = await ensureCompanyId();
    await sb().from("company_notifications").update({ read: true }).eq("company_id", companyId);
  },

  async getUnreadNotificationCount(): Promise<number> {
    const companyId = await ensureCompanyId();
    const { count, error } = await sb()
      .from("company_notifications")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("read", false);
    mapDbError(error);
    return count ?? 0;
  },

  async getMasterReportList(
    reportType: MasterReportType,
    params: MasterReportListParams = {}
  ): Promise<MasterReportListResult> {
    const viewMap: Partial<Record<MasterReportType, string>> = {
      "service-requests": "v_master_report_service_requests",
      "incident-reports": "v_master_report_incidents",
      certificates: "v_master_report_certificates",
      "board-approvals": "v_master_report_board_approvals",
      "users-pending": "v_master_report_users_pending",
      "portal-signups": "v_master_report_portal_signups",
    };
    const view = viewMap[reportType];
    if (!view) return { rows: [], total: 0 };
    let query = sb().from(view).select("*", { count: "exact" });
    if (params.buildingId) query = query.eq("building_id", params.buildingId);
    const { data, count, error } = await query;
    mapDbError(error);
    const rows: MasterReportRow[] = (data ?? []).map((r) => mapMasterReportRow(r as Record<string, unknown>, reportType));
    return { rows, total: count ?? rows.length };
  },

  async getMasterReportStats(): Promise<CompanyMasterReportStats> {
    const buildings = await this.getBuildings();
    return {
      communities: buildings.length,
      owners: buildings.reduce((s, b) => s + (b.usersCount ?? 0), 0),
      activatedUsers: buildings.reduce((s, b) => s + (b.usersCount ?? 0), 0),
    };
  },

  async getBuildingTotals(): Promise<BuildingTotalRow[]> {
    const buildings = await this.getBuildings();
    return buildings.map((b) => ({
      id: b.id,
      subscription: b.subscriptionPackage,
      corp: b.code,
      name: b.name,
      address: b.address,
      owners: b.usersCount ?? 0,
      activatedUsers: b.usersCount ?? 0,
    }));
  },

  async getMasterReportBuildings(): Promise<{ value: string; label: string }[]> {
    const buildings = await this.getBuildings();
    return buildings.map((b) => ({
      value: b.id,
      label: `  - ${b.condoLine ?? b.name} - ${b.code}`,
    }));
  },

  async getMasterReports(reportType: MasterReportType, params?: MasterReportListParams) {
    return this.getMasterReportList(reportType, params);
  },

  async getMasterReportDetail(reportType: MasterReportType, id: string) {
    const result = await this.getMasterReportList(reportType);
    return result.rows.find((r) => r.id === id);
  },

  async getCertificateDetail(id: string) {
    return loadCertificateDetail(id);
  },

  async getBoardApprovalDetail(id: string) {
    return loadBoardApprovalDetail(id);
  },

  async getIncidentReportDetail(id: string) {
    return loadIncidentReportDetail(id);
  },

  async getUsersPending(params?: MasterReportListParams) {
    return this.getMasterReportList("users-pending", params);
  },

  async getPortalSignupRequest(id: string) {
    const companyId = await ensureCompanyId();
    const { data, error } = await sb()
      .from("portal_signup_requests")
      .select(
        "id, building_id, unit_number, first_name, corp_number, city, email, resident_type, quickbooks_matched, quickbooks_balance, status, created_at, buildings!inner(name, company_id)"
      )
      .eq("id", id)
      .eq("buildings.company_id", companyId)
      .maybeSingle();
    mapDbError(error);
    if (!data) return null;
    const building = data.buildings as { name: string };
    return {
      id: data.id as string,
      buildingId: data.building_id as string,
      buildingLabel: building.name,
      unitNumber: data.unit_number as string,
      firstName: data.first_name as string,
      corpNumber: data.corp_number as string,
      city: data.city as string,
      email: data.email as string,
      residentType: data.resident_type as string,
      quickbooksMatched: Boolean(data.quickbooks_matched),
      quickbooksBalance: (data.quickbooks_balance as string | null) ?? null,
      status: data.status as string,
      submittedAt: String(data.created_at),
    };
  },

  async getPortalSignups(params?: MasterReportListParams) {
    return this.getMasterReportList("portal-signups", params);
  },

  async getBoardApprovals(params?: MasterReportListParams) {
    return this.getMasterReportList("board-approvals", params);
  },

  async getBuildingStorePurchases(_params?: MasterReportListParams) {
    return { rows: [], total: 0 };
  },

  async getCertificateRequests(params?: MasterReportListParams) {
    return this.getMasterReportList("certificates", params);
  },

  async getChargebacks(_params?: MasterReportListParams) {
    return { rows: [], total: 0 };
  },

  async getBuildingSubscriptions(): Promise<BuildingSubscription[]> {
    const companyId = await ensureCompanyId();
    const { data, error } = await sb()
      .from("building_subscriptions")
      .select("*, buildings!inner(company_id)")
      .eq("buildings.company_id", companyId);
    mapDbError(error);
    return (data ?? []).map((s) => ({
      id: s.id as string,
      buildingId: s.building_id as string,
      buildingName: s.building_name as string,
      address: s.address as string,
      package: s.package as string,
      active: s.active as boolean,
    }));
  },

  async getCompanySubscriptions(): Promise<CompanySubscription[]> {
    const companyId = await ensureCompanyId();
    const { data, error } = await sb()
      .from("company_subscriptions")
      .select("*")
      .eq("company_id", companyId);
    mapDbError(error);
    return (data ?? []).map((s) => ({
      id: s.id as string,
      planName: s.plan_name as string,
      status: s.status as string,
      renewalDate: s.renewal_date as string,
      buildingsCount: s.buildings_count as number,
    }));
  },

  async getStripePayouts(): Promise<StripePayout[]> {
    const companyId = await ensureCompanyId();
    const { data, error } = await sb().from("stripe_payouts").select("*").eq("company_id", companyId);
    mapDbError(error);
    return (data ?? []).map((p) => ({
      id: p.id as string,
      payoutDate: p.payout_date as string,
      status: p.status as StripePayout["status"],
      total: Number(p.total),
      currency: p.currency as string,
    }));
  },

  async getMasterPortalModules(): Promise<PortalModuleConfig[]> {
    return [];
  },

  async getMasterCustomPortalTiles(): Promise<CustomPortalTile[]> {
    return [];
  },

  async getMasterPrimaryTileLimit(): Promise<number> {
    return 12;
  },

  async updateMasterPortalLayout(_input: {
    modules: PortalModuleConfig[];
    customTiles: CustomPortalTile[];
    primaryTileLimit: number;
  }): Promise<void> {
    /* no-op until master layout persisted */
  },

  addIncidentReportComment: companyReportOps.addIncidentReportComment,
  addIncidentReportAttachment: companyReportOps.addIncidentReportAttachment,
  archiveIncidentReport: companyReportOps.archiveIncidentReport,
  markIncidentReportUnread: companyReportOps.markIncidentReportUnread,
  reopenIncidentReport: companyReportOps.reopenIncidentReport,

  archiveBoardApproval: companyReportOps.archiveBoardApproval,
  markBoardApprovalUnread: companyReportOps.markBoardApprovalUnread,
  getBoardApprovalAttachmentUrl: companyReportOps.getBoardApprovalAttachmentUrl,
  addBoardApprovalComment: companyReportOps.addBoardApprovalComment,
  sendBoardApprovalVoteReminders: companyReportOps.sendBoardApprovalVoteReminders,
  bulkArchiveIncidentReports: companyReportOps.bulkArchiveIncidentReports,

  archiveStatusCertificate: companyReportOps.archiveStatusCertificate,
  markStatusCertificateUnread: companyReportOps.markStatusCertificateUnread,
  uploadCertificateFile: companyReportOps.uploadCertificateFile,
  deleteCertificateFile: companyReportOps.deleteCertificateFile,
  getCertificateFileUrl: companyReportOps.getCertificateFileUrl,
  addCertificateHistoryEntry: companyReportOps.addCertificateHistoryEntry,
  refundAndArchiveCertificate: companyReportOps.refundAndArchiveCertificate,
  resendCertificateToUser: companyReportOps.resendCertificateToUser,

  getCertificateSettings(buildingId: string): Promise<CertificateSettingsData> {
    return companyReportOps.getCertificateSettings(buildingId);
  },
  saveCertificateSettings(
    buildingId: string,
    settings: CertificateSettingsData
  ): Promise<CertificateSettingsData> {
    return companyReportOps.saveCertificateSettings(buildingId, settings);
  },
};

function mapPurchaseOrder(row: Record<string, unknown>): PurchaseOrder {
  const lineItems = (row.purchase_order_line_items as Record<string, unknown>[] | undefined) ?? [];
  return {
    id: row.id as string,
    poNumber: row.po_number as string,
    vendorId: row.vendor_id as string,
    buildingId: row.building_id as string,
    sourceRequest: row.source_kind
      ? {
          kind: row.source_kind as PurchaseOrder["sourceRequest"] extends infer S
            ? S extends { kind: infer K }
              ? K
              : never
            : never,
          requestId: row.source_request_id as string,
        }
      : undefined,
    status: row.status as PurchaseOrderStatus,
    lineItems: lineItems.map((li) => ({
      id: li.id as string,
      description: li.description as string,
      quantity: Number(li.quantity),
      unitPrice: Number(li.unit_price),
    })),
    total: Number(row.total),
    notes: (row.notes as string) ?? undefined,
    createdBy: row.created_by_name as string,
    createdAt: String(row.created_at).slice(0, 10),
    sentAt: row.sent_at ? String(row.sent_at).slice(0, 10) : undefined,
    respondedAt: row.responded_at ? String(row.responded_at).slice(0, 10) : undefined,
    declineReason: (row.decline_reason as string) ?? undefined,
    isQuoteRequest: (row.is_quote_request as boolean) ?? false,
    awaitingResponseFrom: (row.awaiting_response_from as PurchaseOrder["awaitingResponseFrom"]) ?? undefined,
  };
}

function mapMasterReportRow(row: Record<string, unknown>, reportType: MasterReportType): MasterReportRow {
  return {
    id: row.id as string,
    reportType,
    buildingId: row.building_id as string,
    buildingLabel: (row.building_label as string) ?? "",
    date: String(row.report_date ?? todayIsoDate()),
    title: (row.title as string) ?? "",
    status: (row.status as string) ?? "",
    severity: row.severity as string | undefined,
    unit: row.unit as string | undefined,
    owner: row.owner as string | undefined,
    pendingReply: row.pending_reply as boolean | undefined,
    archived: Boolean(row.archived),
    unread: Boolean(row.unread),
    incidentNumber: row.incident_number as string | undefined,
    location: row.location as string | undefined,
    resolutionTime: row.resolution_time as string | undefined,
    requestNumber: row.request_number as string | undefined,
    processing: row.processing as string | undefined,
    dueDate: row.due_date ? String(row.due_date) : undefined,
    closingDate: row.closing_date ? String(row.closing_date) : undefined,
    approvedCount: row.approved_count as number | undefined,
    disapprovedCount: row.disapproved_count as number | undefined,
    votesCollected: row.votes_collected as number | undefined,
    votesRequired: row.votes_required as number | undefined,
    extra: row.extra as string | undefined,
    residentType: row.resident_type as string | undefined,
  };
}

async function getBuildingForCompany(buildingId: string, companyId: string) {
  const { data, error } = await sb()
    .from("buildings")
    .select("*")
    .eq("id", buildingId)
    .eq("company_id", companyId)
    .maybeSingle();
  mapDbError(error);
  return data as Record<string, unknown> | null;
}

function formatBuildingLabel(building: Record<string, unknown>): string {
  const code = building.code as string;
  const address = building.address as string;
  const name = building.name as string;
  if (code && address) return `(${code}) ${address}`;
  return name || address || "";
}

function formatBuildingAddress(building: Record<string, unknown>): string {
  const parts = [
    building.condo_name as string,
    building.address as string,
    [building.city, building.province, building.postal_zip].filter(Boolean).join(", "),
  ].filter(Boolean);
  return parts.join(" ");
}

function mapCommentToIncident(comment: Comment): IncidentReportComment {
  return {
    dateTime: new Date(comment.createdAt).toLocaleString(),
    author: comment.author,
    message: comment.text,
    visibility: comment.visibility,
  };
}

async function loadIncidentReportDetail(id: string): Promise<IncidentReportDetail | undefined> {
  const companyId = await ensureCompanyId();
  const { data: report, error } = await sb().from("incident_reports").select("*").eq("id", id).maybeSingle();
  mapDbError(error);
  if (!report) return undefined;

  const building = await getBuildingForCompany(report.building_id as string, companyId);
  if (!building) return undefined;

  const [comments, attachments] = await Promise.all([
    loadEntityComments("incident_report", id),
    loadIncidentReportAttachments(id),
  ]);

  const submittedAt = report.submitted_at ? String(report.submitted_at) : undefined;
  const resolvedAt = report.resolved_at ? String(report.resolved_at) : undefined;

  return {
    id: report.id as string,
    incidentNumber: (report.incident_number as string) || (report.id as string),
    buildingLabel: formatBuildingLabel(building),
    buildingAddress: formatBuildingAddress(building),
    incidentDate: String(report.incident_date),
    incidentTime: report.incident_time as string,
    reportHeaderTime: submittedAt ? new Date(submittedAt).toLocaleString() : undefined,
    unit: report.unit as string,
    location: report.location as string,
    status: report.status as string,
    severity: report.severity as string,
    reportType: report.report_type as string,
    description: report.description as string,
    createdBy: report.created_by_name as string,
    resident: (report.resident as string) || (report.created_by_name as string),
    assignedTo: (report.assigned_to as string) || "All Admins",
    viewPermission: (report.view_permission as string) || "All Admins",
    submittedAt: submittedAt ? new Date(submittedAt).toLocaleString() : undefined,
    pendingReplyLabel: (report.pending_reply_label as IncidentReportDetail["pendingReplyLabel"]) || "N/A",
    resolutionTime: (report.resolution_time as string) || undefined,
    resolvedBy: (report.resolved_by as string) || undefined,
    resolvedAt: resolvedAt ? resolvedAt.slice(0, 10) : undefined,
    resolvedAtDisplay: resolvedAt ? new Date(resolvedAt).toLocaleString() : undefined,
    attachments,
    adminComments: comments.adminComments.map(mapCommentToIncident),
    publicComments: comments.publicComments.map(mapCommentToIncident),
    archived: Boolean(report.archived),
    unread: Boolean(report.unread),
  };
}

async function loadCertificateDetail(id: string): Promise<CertificateDetail | undefined> {
  const companyId = await ensureCompanyId();
  const { data, error } = await sb().from("status_certificates").select("*").eq("id", id).maybeSingle();
  mapDbError(error);
  if (!data) return undefined;

  const building = await getBuildingForCompany(data.building_id as string, companyId);
  if (!building) return undefined;

  const [{ data: files }, { data: history }] = await Promise.all([
    sb().from("certificate_files").select("*").eq("certificate_id", id),
    sb()
      .from("certificate_history")
      .select("*")
      .eq("certificate_id", id)
      .order("event_date", { ascending: true }),
  ]);

  const mapFile = (f: Record<string, unknown>): CertificateFile => ({
    id: f.id as string,
    label: f.label as string,
    fileName: f.file_name as string,
    size: f.size_label as string,
    uploadedDate: String(f.uploaded_at).slice(0, 10),
    kind: f.kind as CertificateFile["kind"],
  });

  const allFiles = (files ?? []).map((f) => mapFile(f as Record<string, unknown>));
  const historyEntries: CertificateHistoryEntry[] = (history ?? []).map((h) => ({
    date: String(h.event_date),
    user: h.actor_name as string,
    action: h.action as string,
  }));

  const detailJson = (data.detail as Record<string, unknown>) ?? {};
  const row: MasterReportRow = {
    id: data.id as string,
    reportType: "certificates",
    buildingId: data.building_id as string,
    buildingLabel: formatBuildingLabel(building),
    date: String(data.created_at).slice(0, 10),
    title: data.requested_by_name as string,
    status: data.status as string,
    unit: data.unit as string,
    archived: Boolean(data.archived),
    unread: Boolean(data.unread),
    requestNumber: data.request_number as string,
    processing: data.delivery_type as string,
    dueDate: data.date_due ? String(data.date_due) : undefined,
    closingDate: data.closing_date ? String(data.closing_date) : undefined,
  };
  const base = certificateDetailFromRow(row);
  const includedFiles = allFiles.filter(
    (f) => !(files ?? []).find((x) => x.id === f.id && x.excluded)
  );
  const excludedFiles = allFiles.filter((f) =>
    (files ?? []).some((x) => x.id === f.id && x.excluded)
  );

  return {
    ...base,
    id: data.id as string,
    requestNumber: data.request_number as string,
    unit: data.unit as string,
    dateCreated: String(data.created_at).slice(0, 10),
    deliveryType: data.delivery_type as string,
    dateDue: data.date_due ? String(data.date_due) : "—",
    closingDate: data.closing_date ? String(data.closing_date) : "",
    buildingName: (building.name as string) ?? base.buildingName,
    buildingAddress: (building.address as string) ?? base.buildingAddress,
    buildingCityLine: [building.city, building.province, building.postal_zip].filter(Boolean).join(", "),
    requestedByName: data.requested_by_name as string,
    files: includedFiles.length ? includedFiles : base.files,
    excludedFiles: excludedFiles.length ? excludedFiles : base.excludedFiles,
    history: historyEntries.length ? historyEntries : base.history,
    archived: Boolean(data.archived),
    unread: Boolean(data.unread),
    ownersName: (detailJson.ownersName as string) ?? base.ownersName,
    purchasersName: (detailJson.purchasersName as string) ?? base.purchasersName,
    reasonForRequest: (detailJson.reasonForRequest as string) ?? base.reasonForRequest,
    solicitorName: (detailJson.solicitorName as string) ?? base.solicitorName,
    solicitorPhone: (detailJson.solicitorPhone as string) ?? base.solicitorPhone,
    solicitorFax: (detailJson.solicitorFax as string) ?? base.solicitorFax,
    parkingSlots: (detailJson.parkingSlots as [string, string]) ?? base.parkingSlots,
    lockerSlots: (detailJson.lockerSlots as [string, string]) ?? base.lockerSlots,
    sellerRetainsSeparatelyDeeded:
      (detailJson.sellerRetainsSeparatelyDeeded as boolean) ?? base.sellerRetainsSeparatelyDeeded,
  };
}

function mapCommentToBoardApproval(comment: Comment): BoardApprovalComment {
  return {
    dateTime: new Date(comment.createdAt).toLocaleString(),
    author: comment.author,
    message: comment.text,
  };
}

async function loadBoardApprovalDetail(id: string): Promise<BoardApprovalDetail | undefined> {
  const companyId = await ensureCompanyId();
  const { data, error } = await sb().from("board_approvals").select("*").eq("id", id).maybeSingle();
  mapDbError(error);
  if (!data) return undefined;

  const building = await getBuildingForCompany(data.building_id as string, companyId);
  if (!building) return undefined;

  const [{ data: voteRows, error: voteError }, { data: attachmentRows, error: attachmentError }, comments] =
    await Promise.all([
      sb().from("board_approval_votes").select("*").eq("approval_id", id).order("vote_date", { ascending: true }),
      sb().from("board_approval_attachments").select("*").eq("approval_id", id),
      loadEntityComments("board_approval", id),
    ]);
  mapDbError(voteError);
  mapDbError(attachmentError);

  const row: MasterReportRow = {
    id: data.id as string,
    reportType: "board-approvals",
    buildingId: data.building_id as string,
    buildingLabel: formatBuildingLabel(building),
    date: String(data.created_at).slice(0, 10),
    title: data.title as string,
    status: data.status as string,
    archived: Boolean(data.archived),
    unread: Boolean(data.unread),
    approvedCount: data.approved_votes as number,
    disapprovedCount: data.disapproved_votes as number,
    votesCollected: data.votes_collected as number,
    votesRequired: data.votes_required as number,
  };

  const detail = boardApprovalDetailFromRow(row);
  detail.description = data.description as string;
  detail.createdBy = (data.created_by as string) || detail.createdBy;
  detail.closedBy = (data.closed_by as string) || undefined;
  detail.votes = (voteRows ?? []).map((vote) => ({
    kind: vote.vote_kind as BoardApprovalDetail["votes"][number]["kind"],
    boardMember: vote.board_member as string,
    voteDate: String(vote.vote_date).slice(0, 10),
  }));
  detail.attachments = (attachmentRows ?? []).map((attachment) => ({
    id: attachment.id as string,
    label: attachment.label as string,
    fileName: attachment.file_name as string,
  }));
  const adminComments = comments.adminComments.map(mapCommentToBoardApproval);
  const publicComments = comments.publicComments.map(mapCommentToBoardApproval);
  detail.comments = [...adminComments, ...publicComments];
  detail.archived = Boolean(data.archived);
  detail.unread = Boolean(data.unread);
  return detail;
}

export type SupabaseCompanyRepository = typeof supabaseCompanyRepository;
