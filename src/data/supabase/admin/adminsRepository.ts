import type {
  AdminUser,
  BuildingAdmin,
  CreateBuildingAdminInput,
  PermissionModuleRow,
  UpdateAdminUserInput,
  UpdateBuildingAdminInput,
} from "../../../resident/data/types";
import {
  BUILDING_ADMIN_ROLES,
  createDefaultBuildingPermissionsForRole,
} from "../../../admin/data/mock/buildingPermissions";
import { mapDbError, sb } from "../base";
import { provisionUser } from "../provisionUser";
import { invokeSendPortalEmail } from "../sendPortalEmail";
import { ADMIN_USER_PROFILE_COLUMNS } from "../queryColumns";
import { bid } from "./shared";
import { mapCompanyPermissionDbRows } from "../portalModulePermissions";
import { refreshBuildingCounts } from "../unitsUsersRepository";

export const adminsRepository = {
  async getAdminUser(): Promise<AdminUser> {
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
    const buildingId = await bid();
    const { data: membership } = await sb()
      .from("building_memberships")
      .select("role_label")
      .eq("profile_id", user.id)
      .eq("building_id", buildingId)
      .maybeSingle();
    const { data: building } = await sb()
      .from("buildings")
      .select("company_id")
      .eq("id", buildingId)
      .single();
    let companyName = "";
    if (building?.company_id) {
      const { data: company } = await sb()
        .from("management_companies")
        .select("company_name")
        .eq("id", building.company_id)
        .maybeSingle();
      companyName = (company?.company_name as string) ?? "";
    }
    const { data: occupancy } = await sb()
      .from("unit_occupancies")
      .select("units(label)")
      .eq("profile_id", user.id)
      .eq("building_id", buildingId)
      .maybeSingle();
    const unit = occupancy?.units as { label: string } | undefined;
    return {
      id: user.id,
      displayName: profile!.display_name,
      firstName: profile!.first_name,
      lastName: profile!.last_name,
      email: profile!.email,
      phone: profile!.phone,
      role: membership?.role_label ?? "Property Manager",
      title: membership?.role_label ?? "",
      managementCompany: companyName,
      unit: unit?.label,
      timezone: profile!.timezone,
      telHome: profile!.tel_home ?? undefined,
      telMobile: profile!.tel_mobile ?? undefined,
      telBusiness: profile!.tel_business ?? undefined,
      avatarUrl: profile!.avatar_url ?? undefined,
    };
  },

  async updateAdminUser(updates: UpdateAdminUserInput) {
    const {
      data: { user },
    } = await sb().auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const firstName = updates.firstName;
    const lastName = updates.lastName;
    await sb()
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        email: updates.email,
        display_name: `${firstName} ${lastName}`.trim(),
        timezone: updates.timezone,
        tel_home: updates.telHome,
        tel_mobile: updates.telMobile,
        tel_business: updates.telBusiness,
        phone: updates.telMobile ?? updates.telHome ?? "",
      })
      .eq("id", user.id);
    return this.getAdminUser();
  },

  async getAdminEmails() {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("email_records")
      .select("*")
      .eq("building_id", buildingId)
      .order("sent_date", { ascending: false });
    mapDbError(error);
    return (data ?? []).map((e) => ({
      id: e.id as string,
      sentDate: String(e.sent_date),
      subject: e.subject as string,
      status: e.status as string,
      body: e.body as string,
    }));
  },

  async getAdminEmailById(id: string) {
    const { data, error } = await sb().from("email_records").select("*").eq("id", id).maybeSingle();
    mapDbError(error);
    return data
      ? {
          id: data.id as string,
          sentDate: String(data.sent_date),
          subject: data.subject as string,
          status: data.status as string,
          body: data.body as string,
        }
      : null;
  },

  async getAdminNotificationPreferences() {
    const {
      data: { user },
    } = await sb().auth.getUser();
    if (!user) return [];
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("notification_preferences")
      .select("*")
      .eq("profile_id", user.id)
      .eq("building_id", buildingId);
    mapDbError(error);
    return (data ?? []).map((p) => ({
      id: p.id as string,
      label: p.label as string,
      enabled: p.enabled as boolean,
    }));
  },

  async updateAdminNotificationPreference(id: string, enabled: boolean) {
    await sb().from("notification_preferences").update({ enabled }).eq("id", id);
  },

  async getBuildingAdmins(): Promise<BuildingAdmin[]> {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("building_memberships")
      .select("*, profiles(first_name, last_name, email, last_login_at)")
      .eq("building_id", buildingId);
    mapDbError(error);
    return (data ?? []).map((m) => {
      const p = m.profiles as {
        first_name: string;
        last_name: string;
        email: string;
        last_login_at: string | null;
      };
      return {
        id: m.id as string,
        firstName: p.first_name,
        lastName: p.last_name,
        name: `${p.first_name} ${p.last_name}`.trim(),
        email: p.email,
        role: m.role_label as string,
        status: m.status as BuildingAdmin["status"],
        lastLogin: p.last_login_at ?? "",
      };
    });
  },

  async getBuildingAdmin(id: string) {
    const admins = await this.getBuildingAdmins();
    return admins.find((a) => a.id === id);
  },

  async createBuildingAdmin(input: CreateBuildingAdminInput) {
    const buildingId = await bid();
    const roleLabel =
      BUILDING_ADMIN_ROLES.find((r) => r.value === input.role)?.label ?? input.role;
    if (!input.email?.trim()) {
      throw new Error("Email is required to create a building admin login.");
    }
    const result = await provisionUser({
      kind: "building_admin",
      email: input.email.trim(),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      buildingId,
      roleCode: input.role,
      roleLabel,
    });
    const membershipId = result.membershipId ?? result.profileId;
    await invokeSendPortalEmail({
      type: "building_admin_login_details",
      membershipId,
    });
    await refreshBuildingCounts(buildingId);
    return {
      id: result.membershipId ?? result.profileId,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      name: `${input.firstName.trim()} ${input.lastName.trim()}`,
      email: input.email.trim(),
      role: roleLabel,
      status: "active" as const,
      lastLogin: "",
    };
  },

  async updateBuildingAdmin(id: string, input: UpdateBuildingAdminInput) {
    const admins = await this.getBuildingAdmins();
    const current = admins.find((a) => a.id === id);
    if (!current) return undefined;
    const roleLabel = input.role
      ? BUILDING_ADMIN_ROLES.find((r) => r.value === input.role)?.label ?? input.role
      : current.role;
    const firstName = input.firstName?.trim() ?? current.firstName;
    const lastName = input.lastName?.trim() ?? current.lastName;
    const updates: Record<string, unknown> = {};
    if (input.role) {
      updates.role_code = input.role;
      updates.role_label = roleLabel;
    }
    if (input.status) updates.status = input.status;
    if (Object.keys(updates).length) {
      await sb().from("building_memberships").update(updates).eq("id", id);
      if (input.status) {
        const buildingId = await bid();
        await refreshBuildingCounts(buildingId);
      }
    }
    if (input.firstName || input.lastName || input.email) {
      const { data: membership } = await sb()
        .from("building_memberships")
        .select("profile_id")
        .eq("id", id)
        .single();
      if (membership?.profile_id) {
        await sb()
          .from("profiles")
          .update({
            first_name: firstName,
            last_name: lastName,
            email: input.email?.trim() ?? current.email,
            display_name: `${firstName} ${lastName}`.trim(),
          })
          .eq("id", membership.profile_id);
      }
    }
    return {
      ...current,
      ...input,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      email: input.email?.trim() ?? current.email,
      role: roleLabel,
    };
  },

  async emailBuildingAdminLoginDetails(id: string) {
    const admin = await this.getBuildingAdmin(id);
    if (!admin) throw new Error("Building admin not found.");
    await invokeSendPortalEmail({
      type: "building_admin_login_details",
      membershipId: id,
    });
    return true;
  },

  async getBuildingRolePermissions(role: string): Promise<PermissionModuleRow[]> {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("building_role_permission_defaults")
      .select("module_key, can_create, can_view, can_edit, can_delete, can_archive")
      .eq("building_id", buildingId)
      .eq("role_label", role);
    mapDbError(error);
    if (!data?.length) return createDefaultBuildingPermissionsForRole(role);
    return mapCompanyPermissionDbRows(data, BUILDING_PERMISSION_MODULES);
  },

  async saveBuildingRolePermissions(role: string, permissions: PermissionModuleRow[]) {
    const buildingId = await bid();
    for (const p of permissions) {
      await sb().from("building_role_permission_defaults").upsert({
        building_id: buildingId,
        role_label: role,
        module_key: p.moduleKey,
        can_create: p.create,
        can_view: p.view,
        can_edit: p.edit,
        can_delete: p.delete,
        can_archive: p.archive,
      });
    }
    return permissions.map((p) => ({ ...p }));
  },
};
