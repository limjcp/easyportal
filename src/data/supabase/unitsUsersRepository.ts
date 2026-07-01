import type {
  ResidentDetailSection,
  ResidentProfileDetails,
  UnitsUsersArchivedRow,
  UnitsUsersCurrentRow,
  UnitsUsersPendingRow,
  UnitsUsersResidentType,
  UnitsUsersUnoccupiedRow,
  UnitsUsersUnitDetail,
  UnitsUsersUserDetail,
} from "../../resident/data/types";
import { mapDbError, nowIso, sb, todayIsoDate } from "./base";
import { buildingIdOrThrow } from "./base";
import { OCCUPANCY_LIST_WITH_UNIT } from "./queryColumns";
import { invokeSendPortalEmail } from "./sendPortalEmail";
import {
  aggregateOccupancyProfiles,
  applyProfileDetailsToDisplayFields,
  formatMaintFees,
  formatProfileSectionItems,
  loadOccupancyProfileDetails,
  saveOccupancyProfileDetails,
  saveChangedOccupancyProfileSections,
  saveOccupancyProfileSection,
} from "./occupancyProfileDetails";
import { provisionUser } from "./provisionUser";
import { splitResidentDisplayName } from "../../shared/splitResidentDisplayName";
import {
  defaultResidentTypeModuleEnabled,
  ensureResidentTypePortalModules,
  loadBuildingPortalModulePermissions,
  loadBuildingRolePermissionDefaults,
  mergeEffectiveBuildingAdminModules,
  mergeEffectivePortalModules,
  type BuildingAdminModulePermission,
  type ResidentPortalModulePermission,
} from "./portalModulePermissions";
import { BUILDING_ADMIN_ROLES } from "../../admin/data/buildingPermissions";

async function bid() {
  return buildingIdOrThrow();
}

function roleCodeForLabel(roleLabel: string): string {
  return BUILDING_ADMIN_ROLES.find((role) => role.label === roleLabel)?.value ?? "520";
}

async function loadPortalAccessFields(
  profileId: string | null | undefined,
  buildingId: string,
  occupancyRow: Record<string, unknown>
): Promise<Pick<
  UnitsUsersUserDetail,
  "canAccessResidentPortal" | "canAccessBuildingAdmin" | "buildingAdminRoleLabel" | "buildingMembershipId"
>> {
  const canAccessResidentPortal = occupancyRow.can_access_resident_portal !== false;
  const canAccessBuildingAdmin = occupancyRow.can_access_building_admin === true;
  const buildingAdminRoleLabel = (occupancyRow.building_admin_role_label as string) || "Resident";

  if (!profileId) {
    return {
      canAccessResidentPortal,
      canAccessBuildingAdmin,
      buildingAdminRoleLabel,
    };
  }

  const { data: membership } = await sb()
    .from("building_memberships")
    .select("id, status, role_label")
    .eq("profile_id", profileId)
    .eq("building_id", buildingId)
    .maybeSingle();

  return {
    canAccessResidentPortal,
    canAccessBuildingAdmin,
    buildingAdminRoleLabel: (membership?.role_label as string) || buildingAdminRoleLabel,
    buildingMembershipId: membership?.id as string | undefined,
  };
}

async function healStaleBuildingMembershipIfNeeded(
  profileId: string | null,
  buildingId: string,
  occupancyRow: Record<string, unknown>
): Promise<void> {
  if (!profileId) return;
  if (occupancyRow.can_access_building_admin !== false) return;
  const { data: membership } = await sb()
    .from("building_memberships")
    .select("id")
    .eq("profile_id", profileId)
    .eq("building_id", buildingId)
    .eq("status", "active")
    .maybeSingle();
  if (!membership?.id) return;
  await syncBuildingMembershipForOccupancy(profileId, buildingId, false, "Resident");
}

async function finalizeUserDetail(
  detail: UnitsUsersUserDetail,
  profileId: string | null,
  buildingId: string,
  occupancyRow: Record<string, unknown>
): Promise<UnitsUsersUserDetail> {
  Object.assign(detail, await loadPortalAccessFields(profileId, buildingId, occupancyRow));
  await healStaleBuildingMembershipIfNeeded(profileId, buildingId, occupancyRow);
  detail.portalModules = await loadOccupancyPortalModules(detail.id, detail.type);
  if (detail.canAccessBuildingAdmin) {
    detail.buildingAdminModules = await loadOccupancyBuildingAdminModules(
      detail.id,
      detail.buildingAdminRoleLabel ?? "Resident"
    );
  }

  const profileDetails = await loadOccupancyProfileDetails(detail.id, buildingId);
  detail.profileDetails = profileDetails;
  const display = applyProfileDetailsToDisplayFields(profileDetails);
  detail.parkingSpots = display.parkingSpots;
  detail.lockers = display.lockers;
  detail.bikeSpaces = display.bikeSpaces;
  detail.keyFobs = display.keyFobs;
  detail.vehicles = display.vehicles;
  detail.guestList = display.guestList;
  detail.pets = display.pets;
  detail.purchaseDateMaintFees = display.purchaseDateMaintFeesDisplay || undefined;

  return detail;
}

async function syncBuildingMembershipForOccupancy(
  profileId: string | null | undefined,
  buildingId: string,
  enabled: boolean,
  roleLabel: string
): Promise<void> {
  if (!profileId) return;

  const { data: existing } = await sb()
    .from("building_memberships")
    .select("id")
    .eq("profile_id", profileId)
    .eq("building_id", buildingId)
    .maybeSingle();

  if (!enabled) {
    if (existing?.id) {
      const { error } = await sb()
        .from("building_memberships")
        .update({ status: "inactive" })
        .eq("id", existing.id);
      mapDbError(error);
    }
    return;
  }

  const roleCode = roleCodeForLabel(roleLabel);
  if (existing?.id) {
    const { error } = await sb()
      .from("building_memberships")
      .update({
        status: "active",
        role_code: roleCode,
        role_label: roleLabel,
      })
      .eq("id", existing.id);
    mapDbError(error);
    return;
  }

  const { error } = await sb().from("building_memberships").insert({
    profile_id: profileId,
    building_id: buildingId,
    role_code: roleCode,
    role_label: roleLabel,
    status: "active",
  });
  mapDbError(error);
}

export async function refreshBuildingCounts(buildingId: string): Promise<void> {
  const { count: unitsCount, error: unitsError } = await sb()
    .from("units")
      .select("id", { count: "exact", head: true })
    .eq("building_id", buildingId);
  mapDbError(unitsError);

  const { count: usersCount, error: usersError } = await sb()
    .from("unit_occupancies")
      .select("id", { count: "exact", head: true })
    .eq("building_id", buildingId)
    .is("archived_at", null)
    .not("account_status", "in", '("Archived","Deleted")');
  mapDbError(usersError);

  const { count: adminsCount, error: adminsError } = await sb()
    .from("building_memberships")
      .select("id", { count: "exact", head: true })
    .eq("building_id", buildingId)
    .eq("status", "active");
  mapDbError(adminsError);

  const { error: updateError } = await sb()
    .from("buildings")
    .update({
      units_count: unitsCount ?? 0,
      users_count: usersCount ?? 0,
      admins_count: adminsCount ?? 0,
    })
    .eq("id", buildingId);
  mapDbError(updateError);
}

function mapOccupancyCurrent(row: Record<string, unknown>): UnitsUsersCurrentRow {
  const unit = row.units as { label: string } | null;
  return {
    id: row.id as string,
    unitId: row.unit_id as string,
    unitLabel: unit?.label ?? "",
    status: row.account_status as UnitsUsersCurrentRow["status"],
    statusTags: (row.status_tags as UnitsUsersCurrentRow["statusTags"]) ?? [],
    name: row.resident_name as string,
    type: row.resident_type as UnitsUsersCurrentRow["type"],
    email: row.email as string,
    phone: row.phone as string | undefined,
    dateCreated: String(row.date_created),
    lastLogin: row.last_login_at ? String(row.last_login_at) : undefined,
    parking: row.parking as string | undefined,
    lockers: row.lockers as string | undefined,
    fobs: row.fobs as string | undefined,
    vehicles: row.vehicles as string | undefined,
    pets: row.pets as string | undefined,
    buzzerCode: row.buzzer_code as string | undefined,
  };
}

function mapOccupancyPending(row: Record<string, unknown>): UnitsUsersPendingRow {
  return {
    id: row.id as string,
    status: row.account_status as UnitsUsersPendingRow["status"],
    name: row.resident_name as string,
    type: row.resident_type as UnitsUsersPendingRow["type"],
    email: row.email as string,
  };
}

async function loadResidentTypePortalModules(
  residentType: UnitsUsersResidentType
): Promise<ResidentPortalModulePermission[]> {
  const buildingId = await bid();
  await ensureResidentTypePortalModules(buildingId, residentType);
  const buildingModules = await loadBuildingPortalModulePermissions(buildingId);
  const { data: typeRows, error } = await sb()
    .from("resident_type_portal_modules")
    .select("module_id, enabled")
    .eq("building_id", buildingId)
    .eq("resident_type", residentType);
  mapDbError(error);
  const typeMap = new Map((typeRows ?? []).map((row) => [row.module_id as string, row.enabled as boolean]));
  return buildingModules.map((module) => {
    const buildingEnabled = module.buildingEnabled;
    const typeEnabled = typeMap.has(module.moduleId)
      ? typeMap.get(module.moduleId)!
      : defaultResidentTypeModuleEnabled(module.moduleId, residentType);
    return {
      ...module,
      buildingEnabled,
      enabled: buildingEnabled ? typeEnabled : false,
    };
  });
}

async function ensureOccupancyBuildingAdminModules(
  occupancyId: string,
  buildingId: string,
  roleLabel: string
): Promise<void> {
  const { data: existing, error: existingError } = await sb()
    .from("occupancy_building_admin_modules")
    .select("module_key")
    .eq("occupancy_id", occupancyId);
  mapDbError(existingError);
  if (existing?.length) return;

  const roleDefaults = await loadBuildingRolePermissionDefaults(roleLabel);
  const toInsert = roleDefaults
    .filter((row) => row.view && !row.moduleKey.startsWith("company-"))
    .map((row) => ({
      occupancy_id: occupancyId,
      building_id: buildingId,
      module_key: row.moduleKey,
      enabled: true,
    }));
  if (toInsert.length === 0) return;

  const { error } = await sb().from("occupancy_building_admin_modules").insert(toInsert);
  mapDbError(error);
}

export const unitsUsersRepository = {
  async getUnitsUsersCurrent(): Promise<UnitsUsersCurrentRow[]> {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("unit_occupancies")
      .select(OCCUPANCY_LIST_WITH_UNIT)
      .eq("building_id", buildingId)
      .is("archived_at", null);
    mapDbError(error);
    return (data ?? [])
      .filter(
        (row) =>
          row.unit_id &&
          !["Archived", "Deleted", "Pending Unit Assignment"].includes(row.account_status as string)
      )
      .map((r) => mapOccupancyCurrent(r as Record<string, unknown>));
  },

  async getUnitsUsersPending(): Promise<UnitsUsersPendingRow[]> {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("unit_occupancies")
      .select(OCCUPANCY_LIST_WITH_UNIT)
      .eq("building_id", buildingId)
      .is("archived_at", null)
      .in("account_status", ["Awaiting Activation", "Pending Unit Assignment"]);
    mapDbError(error);
    return (data ?? [])
      .filter(
        (row) =>
          row.account_status === "Pending Unit Assignment" ||
          (row.account_status === "Awaiting Activation" && !row.unit_id)
      )
      .map((r) => mapOccupancyPending(r as Record<string, unknown>));
  },

  async getUnitsUsersUnoccupied(): Promise<UnitsUsersUnoccupiedRow[]> {
    const buildingId = await bid();
    const { data: units, error } = await sb()
      .from("units")
      .select("id, label, is_occupied, updated_at")
      .eq("building_id", buildingId)
      .eq("is_occupied", false);
    mapDbError(error);
    return (units ?? []).map((u) => ({
      id: u.id as string,
      unitId: u.id as string,
      unitLabel: u.label as string,
      owners: 0,
      tenants: 0,
      occupants: 0,
      updatedAt: String(u.updated_at),
    }));
  },

  async getUnitsUsersArchived(): Promise<UnitsUsersArchivedRow[]> {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("unit_occupancies")
      .select(OCCUPANCY_LIST_WITH_UNIT)
      .eq("building_id", buildingId)
      .in("account_status", ["Archived", "Deleted"]);
    mapDbError(error);
    return (data ?? []).map((r) => {
      const unit = r.units as { label: string } | null;
      return {
        id: r.id as string,
        unitLabel: unit?.label,
        status: r.account_status as UnitsUsersArchivedRow["status"],
        name: r.resident_name as string,
        type: r.resident_type as UnitsUsersArchivedRow["type"],
        email: r.email as string,
        archivedAt: r.archived_at ? String(r.archived_at) : String(r.updated_at),
      };
    });
  },

  async getUnitsUsersUnitDetail(unitId: string): Promise<UnitsUsersUnitDetail | null> {
    const buildingId = await bid();
    const { data: unit, error } = await sb()
      .from("units")
      .select("*")
      .eq("id", unitId)
      .eq("building_id", buildingId)
      .maybeSingle();
    mapDbError(error);
    if (!unit) return null;

    const { data: occupancies } = await sb()
      .from("unit_occupancies")
      .select("id, profile_id, resident_name, email, resident_type, account_status, status_tags")
      .eq("unit_id", unitId)
      .is("archived_at", null);

    const occupancyRows = occupancies ?? [];
    const primaryOccupancy =
      occupancyRows.find((o) => o.profile_id) ?? occupancyRows[0] ?? null;
    const primaryOccupancyId = primaryOccupancy ? (primaryOccupancy.id as string) : undefined;

    const occupancyProfiles = await Promise.all(
      occupancyRows.map((o) => loadOccupancyProfileDetails(o.id as string, buildingId))
    );
    const aggregated = aggregateOccupancyProfiles(occupancyProfiles);
    const primaryProfile = primaryOccupancyId
      ? occupancyProfiles[occupancyRows.findIndex((o) => o.id === primaryOccupancyId)] ??
        (await loadOccupancyProfileDetails(primaryOccupancyId, buildingId))
      : undefined;

    const parkingSpots = (unit.parking_spots as string[]) ?? [];
    const lockers = (unit.lockers as string[]) ?? [];
    const bikeSpaces = (unit.bike_spaces as string[]) ?? [];

    const { count: srCount } = await sb()
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .eq("building_id", buildingId)
      .eq("unit", unit.label);

    const profileIds = occupancyRows
      .map((o) => o.profile_id as string | null)
      .filter((id): id is string => !!id);

    const { data: involvingReports } = await sb()
      .from("incident_reports")
      .select("id")
      .eq("building_id", buildingId)
      .eq("unit", unit.label);

    let byUsersReports: { id: string }[] = [];
    if (profileIds.length > 0) {
      const { data } = await sb()
        .from("incident_reports")
        .select("id")
        .eq("building_id", buildingId)
        .in("created_by_profile_id", profileIds);
      byUsersReports = (data ?? []) as { id: string }[];
    }

    const incidentReportIdsInvolvingUnit = (involvingReports ?? []).map((row) => row.id as string);
    const incidentReportIdsByUsers = byUsersReports.map((row) => row.id);

    return {
      id: unit.id as string,
      unitLabel: unit.label as string,
      serviceRequestsSubmitted: srCount ?? 0,
      deliveriesPendingPickup: 0,
      visitorsToUnit: 0,
      incidentReportsByUsers: incidentReportIdsByUsers.length,
      incidentReportsInvolvingUnit: incidentReportIdsInvolvingUnit.length,
      incidentReportIdsByUsers,
      incidentReportIdsInvolvingUnit,
      occupants: occupancyRows.map((o) => ({
        userId: (o.profile_id as string) ?? (o.id as string),
        type: o.resident_type as UnitsUsersUnitDetail["occupants"][0]["type"],
        name: o.resident_name as string,
        email: o.email as string,
        status: o.account_status as UnitsUsersUnitDetail["occupants"][0]["status"],
        statusTags: (o.status_tags as UnitsUsersUnitDetail["occupants"][0]["statusTags"]) ?? [],
      })),
      parkingSpots,
      lockers,
      keyFobs: aggregated.keyFobs,
      vehicles: aggregated.vehicles,
      guestList: aggregated.guestList,
      bikeSpaces,
      pets: aggregated.pets,
      documents: [],
      purchaseDateMaintFees: aggregated.purchaseDateMaintFees || undefined,
      notes: [],
      primaryOccupancyId,
      profileDetails: primaryProfile,
      occupancyProfiles: occupancyProfiles,
      occupancyProfileOccupancyIds: occupancyRows.map((o) => o.id as string),
    };
  },

  async updateUnitsUsersUnitDetail(
    unitId: string,
    updates: {
      parkingSpots?: string[];
      lockers?: string[];
      bikeSpaces?: string[];
      primaryOccupancyId?: string;
      profileDetails?: ResidentProfileDetails;
      changedProfileSections?: ResidentDetailSection[];
    }
  ): Promise<void> {
    const buildingId = await bid();
    const unitPayload: Record<string, unknown> = {};
    if (updates.parkingSpots !== undefined) unitPayload.parking_spots = updates.parkingSpots;
    if (updates.lockers !== undefined) unitPayload.lockers = updates.lockers;
    if (updates.bikeSpaces !== undefined) unitPayload.bike_spaces = updates.bikeSpaces;

    if (Object.keys(unitPayload).length > 0) {
      const { error: unitError } = await sb()
        .from("units")
        .update(unitPayload)
        .eq("id", unitId)
        .eq("building_id", buildingId);
      mapDbError(unitError);
    }

    const occupancyId = updates.primaryOccupancyId;
    const sections = updates.changedProfileSections ?? [];
    if (occupancyId && updates.profileDetails && sections.length > 0) {
      const profileDetails: ResidentProfileDetails = { ...updates.profileDetails };
      if (updates.parkingSpots !== undefined) profileDetails.parkingSpots = updates.parkingSpots;
      if (updates.lockers !== undefined) profileDetails.lockers = updates.lockers;
      if (updates.bikeSpaces !== undefined) profileDetails.bikeSpaces = updates.bikeSpaces;
      await saveChangedOccupancyProfileSections(occupancyId, buildingId, sections, profileDetails);
    }
  },

  async getUnitsUsersUserDetail(userId: string): Promise<UnitsUsersUserDetail | null> {
    const buildingId = await bid();
    const { data: occupancy, error } = await sb()
      .from("unit_occupancies")
      .select("*, units(label), profiles(*)")
      .eq("id", userId)
      .eq("building_id", buildingId)
      .maybeSingle();
    mapDbError(error);
    if (!occupancy) {
      const { data: byProfile } = await sb()
        .from("unit_occupancies")
        .select("*, units(label), profiles(*)")
        .eq("profile_id", userId)
        .eq("building_id", buildingId)
        .maybeSingle();
      if (!byProfile) return null;
      const detail = mapUserDetail(byProfile as Record<string, unknown>);
      const profileId = (byProfile.profile_id as string | null) ?? null;
      return finalizeUserDetail(detail, profileId, buildingId, byProfile as Record<string, unknown>);
    }
    const detail = mapUserDetail(occupancy as Record<string, unknown>);
    const profileId = (occupancy.profile_id as string | null) ?? null;
    return finalizeUserDetail(detail, profileId, buildingId, occupancy as Record<string, unknown>);
  },

  async createUnitOccupancy(input: {
    firstName: string;
    lastName: string;
    email: string;
    type: UnitsUsersResidentType;
    unitId?: string;
  }): Promise<{ id: string }> {
    const buildingId = await bid();
    const result = await provisionUser({
      kind: "resident",
      email: input.email.trim(),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      buildingId,
      residentType: input.type,
      unitId: input.unitId ?? null,
    });
    await refreshBuildingCounts(buildingId);
    if (!result.membershipId) {
      throw new Error("Failed to create resident record.");
    }
    await invokeSendPortalEmail({
      type: "occupancy_login_details",
      occupancyId: result.membershipId,
    });
    return { id: result.membershipId };
  },

  async assignUnitToOccupancy(occupancyId: string, unitId: string): Promise<void> {
    const buildingId = await bid();
    const { error } = await sb()
      .from("unit_occupancies")
      .update({ unit_id: unitId, account_status: "Awaiting Activation" })
      .eq("id", occupancyId)
      .eq("building_id", buildingId);
    mapDbError(error);
    await sb().from("units").update({ is_occupied: true }).eq("id", unitId);
    await refreshBuildingCounts(buildingId);
  },

  async updateUnitOccupancy(
    occupancyId: string,
    updates: Partial<{
      residentName: string;
      email: string;
      phone: string;
      type: UnitsUsersResidentType;
      unitId: string | null;
      buzzerCode: string;
    }>
  ): Promise<void> {
    const buildingId = await bid();
    const payload: Record<string, unknown> = {};
    if (updates.residentName !== undefined) payload.resident_name = updates.residentName;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.type !== undefined) payload.resident_type = updates.type;
    if (updates.unitId !== undefined) payload.unit_id = updates.unitId;
    if (updates.buzzerCode !== undefined) payload.buzzer_code = updates.buzzerCode;
    if (Object.keys(payload).length === 0) return;
    const { error } = await sb()
      .from("unit_occupancies")
      .update(payload)
      .eq("id", occupancyId)
      .eq("building_id", buildingId);
    mapDbError(error);
    await refreshBuildingCounts(buildingId);
  },

  async archiveUnitOccupancy(occupancyId: string): Promise<void> {
    const buildingId = await bid();
    const { data: occ, error: fetchError } = await sb()
      .from("unit_occupancies")
      .select("unit_id")
      .eq("id", occupancyId)
      .single();
    mapDbError(fetchError);
    const { error } = await sb()
      .from("unit_occupancies")
      .update({ archived_at: nowIso(), account_status: "Archived" })
      .eq("id", occupancyId)
      .eq("building_id", buildingId);
    mapDbError(error);
    if (occ?.unit_id) {
      const { count } = await sb()
        .from("unit_occupancies")
        .select("id", { count: "exact", head: true })
        .eq("unit_id", occ.unit_id)
        .is("archived_at", null);
      if ((count ?? 0) === 0) {
        await sb().from("units").update({ is_occupied: false }).eq("id", occ.unit_id);
      }
    }
    await refreshBuildingCounts(buildingId);
  },

  async restoreUnitOccupancy(occupancyId: string): Promise<void> {
    const buildingId = await bid();
    const { data: occ, error: fetchError } = await sb()
      .from("unit_occupancies")
      .select("unit_id")
      .eq("id", occupancyId)
      .single();
    mapDbError(fetchError);
    const { error } = await sb()
      .from("unit_occupancies")
      .update({
        archived_at: null,
        account_status: occ?.unit_id ? "Awaiting Activation" : "Pending Unit Assignment",
      })
      .eq("id", occupancyId)
      .eq("building_id", buildingId);
    mapDbError(error);
    if (occ?.unit_id) {
      await sb().from("units").update({ is_occupied: true }).eq("id", occ.unit_id);
    }
    await refreshBuildingCounts(buildingId);
  },

  async getDashboardSummary(): Promise<{
    buildingName: string;
    buildingAddress: string;
    unitsCount: number;
    floorCount: number;
    usersCount: number;
    imageUrl?: string;
  }> {
    const buildingId = await bid();
    const { data: building, error: buildingError } = await sb()
      .from("buildings")
      .select("condo_name, corporation, address, units_count, users_count, image_url")
      .eq("id", buildingId)
      .single();
    mapDbError(buildingError);
    const { data: floors, error: floorError } = await sb()
      .from("units")
      .select("floor")
      .eq("building_id", buildingId);
    mapDbError(floorError);
    const floorCount = new Set((floors ?? []).map((f) => f.floor as string).filter(Boolean)).size;
    const corp = building!.corporation as string;
    const address = building!.address as string;
    const imageUrl = (building!.image_url as string) || undefined;
    return {
      buildingName: building!.condo_name as string,
      buildingAddress: corp ? `(${corp}) ${address}` : address,
      unitsCount: (building!.units_count as number) ?? 0,
      floorCount,
      usersCount: (building!.users_count as number) ?? 0,
      imageUrl,
    };
  },

  async listAssignableUnits(): Promise<Array<{ id: string; label: string }>> {
    return this.listBuildingUnitsForAssignment();
  },

  async listBuildingUnitsForAssignment(): Promise<Array<{ id: string; label: string }>> {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("units")
      .select("id, label")
      .eq("building_id", buildingId)
      .order("label");
    mapDbError(error);
    return (data ?? []).map((u) => ({
      id: u.id as string,
      label: u.label as string,
    }));
  },

  async updateUnitsUsersUserDetail(
    occupancyId: string,
    updates: {
      firstName?: string;
      lastName?: string;
      email?: string;
      timezone?: string;
      type?: UnitsUsersResidentType;
      buzzerCode?: string;
      homePhone?: string;
      mobilePhone?: string;
      businessPhone?: string;
      profileDetails?: ResidentProfileDetails;
      changedProfileSections?: ResidentDetailSection[];
      canAccessResidentPortal?: boolean;
      canAccessBuildingAdmin?: boolean;
      buildingAdminRoleLabel?: string;
    }
  ): Promise<void> {
    const buildingId = await bid();
    const { data: occ, error: fetchError } = await sb()
      .from("unit_occupancies")
      .select("profile_id, can_access_building_admin, building_admin_role_label")
      .eq("id", occupancyId)
      .eq("building_id", buildingId)
      .single();
    mapDbError(fetchError);

    const profileId = occ?.profile_id as string | null;
    const occPayload: Record<string, unknown> = {};

    if (updates.firstName !== undefined || updates.lastName !== undefined) {
      const firstName = updates.firstName?.trim() ?? "";
      const lastName = updates.lastName?.trim() ?? "";
      occPayload.resident_name = `${firstName} ${lastName}`.trim();
    }
    if (updates.email !== undefined) occPayload.email = updates.email.trim();
    if (updates.type !== undefined) occPayload.resident_type = updates.type;
    if (updates.buzzerCode !== undefined) occPayload.buzzer_code = updates.buzzerCode.trim() || null;
    if (updates.mobilePhone !== undefined) occPayload.phone = updates.mobilePhone.trim() || null;
    if (updates.canAccessResidentPortal !== undefined) {
      occPayload.can_access_resident_portal = updates.canAccessResidentPortal;
    }
    if (updates.canAccessBuildingAdmin !== undefined) {
      occPayload.can_access_building_admin = updates.canAccessBuildingAdmin;
    }
    if (updates.buildingAdminRoleLabel !== undefined) {
      occPayload.building_admin_role_label = updates.buildingAdminRoleLabel.trim() || "Resident";
    }

    if (Object.keys(occPayload).length > 0) {
      const { error: occError } = await sb()
        .from("unit_occupancies")
        .update(occPayload)
        .eq("id", occupancyId)
        .eq("building_id", buildingId);
      mapDbError(occError);
    }

    if (profileId) {
      const profilePayload: Record<string, unknown> = {};
      if (updates.firstName !== undefined) profilePayload.first_name = updates.firstName.trim();
      if (updates.lastName !== undefined) profilePayload.last_name = updates.lastName.trim();
      if (updates.firstName !== undefined || updates.lastName !== undefined) {
        const firstName = updates.firstName?.trim() ?? "";
        const lastName = updates.lastName?.trim() ?? "";
        profilePayload.display_name = `${firstName} ${lastName}`.trim();
      }
      if (updates.email !== undefined) profilePayload.email = updates.email.trim();
      if (updates.timezone !== undefined) {
        profilePayload.timezone = updates.timezone.trim() || "America/Toronto";
      }
      if (updates.homePhone !== undefined) profilePayload.tel_home = updates.homePhone.trim() || null;
      if (updates.mobilePhone !== undefined) {
        profilePayload.tel_mobile = updates.mobilePhone.trim() || null;
        profilePayload.phone = updates.mobilePhone.trim() || "";
      }
      if (updates.businessPhone !== undefined) {
        profilePayload.tel_business = updates.businessPhone.trim() || null;
      }

      if (Object.keys(profilePayload).length > 0) {
        const { error: profileError } = await sb()
          .from("profiles")
          .update(profilePayload)
          .eq("id", profileId);
        mapDbError(profileError);
      }
    }

    if (updates.canAccessBuildingAdmin !== undefined || updates.buildingAdminRoleLabel !== undefined) {
      const buildingAdminEnabled =
        updates.canAccessBuildingAdmin ?? occ?.can_access_building_admin === true;
      const buildingAdminRoleLabel =
        updates.buildingAdminRoleLabel?.trim() ||
        (occ?.building_admin_role_label as string | undefined) ||
        "Resident (Admin)";
      await syncBuildingMembershipForOccupancy(
        profileId,
        buildingId,
        buildingAdminEnabled,
        buildingAdminRoleLabel
      );
      if (buildingAdminEnabled) {
        await ensureOccupancyBuildingAdminModules(
          occupancyId,
          buildingId,
          buildingAdminRoleLabel
        );
      }
    }

    const sections = updates.changedProfileSections ?? [];
    if (updates.profileDetails && sections.length > 0) {
      await saveChangedOccupancyProfileSections(occupancyId, buildingId, sections, updates.profileDetails);
    }

    const affectsBuildingCounts =
      updates.type !== undefined ||
      updates.canAccessBuildingAdmin !== undefined ||
      updates.canAccessResidentPortal !== undefined;
    if (affectsBuildingCounts) {
      await refreshBuildingCounts(buildingId);
    }
  },

  async deleteUnitOccupancy(occupancyId: string): Promise<void> {
    const buildingId = await bid();
    const { data: occ, error: fetchError } = await sb()
      .from("unit_occupancies")
      .select("unit_id")
      .eq("id", occupancyId)
      .single();
    mapDbError(fetchError);
    const { error } = await sb()
      .from("unit_occupancies")
      .update({ archived_at: nowIso(), account_status: "Deleted" })
      .eq("id", occupancyId)
      .eq("building_id", buildingId);
    mapDbError(error);
    if (occ?.unit_id) {
      const { count } = await sb()
        .from("unit_occupancies")
        .select("id", { count: "exact", head: true })
        .eq("unit_id", occ.unit_id)
        .is("archived_at", null);
      if ((count ?? 0) === 0) {
        await sb().from("units").update({ is_occupied: false }).eq("id", occ.unit_id);
      }
    }
    await refreshBuildingCounts(buildingId);
  },

  async getResidentTypePortalModules(
    residentType: UnitsUsersResidentType
  ): Promise<ResidentPortalModulePermission[]> {
    return loadResidentTypePortalModules(residentType);
  },

  async saveResidentTypePortalModules(
    residentType: UnitsUsersResidentType,
    modules: ResidentPortalModulePermission[]
  ): Promise<void> {
    const buildingId = await bid();
    if (modules.length === 0) return;
    const { error } = await sb()
      .from("resident_type_portal_modules")
      .upsert(
        modules.map((module) => ({
          building_id: buildingId,
          resident_type: residentType,
          module_id: module.moduleId,
          enabled: module.enabled,
        })),
        { onConflict: "building_id,resident_type,module_id" }
      );
    mapDbError(error);
  },

  async getOccupancyPortalModules(
    occupancyId: string,
    residentType: UnitsUsersResidentType
  ): Promise<ResidentPortalModulePermission[]> {
    const buildingId = await bid();
    await ensureResidentTypePortalModules(buildingId, residentType);
    const buildingModules = await loadBuildingPortalModulePermissions(buildingId);
    const { data: typeRows, error: typeError } = await sb()
      .from("resident_type_portal_modules")
      .select("module_id, enabled")
      .eq("building_id", buildingId)
      .eq("resident_type", residentType);
    mapDbError(typeError);
    const { data: occRows, error: occError } = await sb()
      .from("occupancy_portal_modules")
      .select("module_id, enabled")
      .eq("occupancy_id", occupancyId);
    mapDbError(occError);
    return mergeEffectivePortalModules(
      buildingModules,
      (typeRows ?? []) as Array<{ module_id: string; enabled: boolean }>,
      (occRows ?? []) as Array<{ module_id: string; enabled: boolean }>
    );
  },

  async saveOccupancyPortalModules(
    occupancyId: string,
    residentType: UnitsUsersResidentType,
    modules: ResidentPortalModulePermission[]
  ): Promise<void> {
    const buildingId = await bid();
    const typeDefaults = await loadResidentTypePortalModules(residentType);
    const typeMap = new Map(typeDefaults.map((module) => [module.moduleId, module.enabled]));

    const overrides = modules.filter((module) => {
      if (module.buildingEnabled === false) return false;
      const typeEnabled = typeMap.get(module.moduleId);
      if (typeEnabled === undefined) return module.enabled !== true;
      return module.enabled !== typeEnabled;
    });

    const { error: deleteError } = await sb()
      .from("occupancy_portal_modules")
      .delete()
      .eq("occupancy_id", occupancyId);
    mapDbError(deleteError);

    if (overrides.length === 0) return;

    const { error } = await sb().from("occupancy_portal_modules").insert(
      overrides.map((module) => ({
        occupancy_id: occupancyId,
        building_id: buildingId,
        module_id: module.moduleId,
        enabled: module.enabled,
      }))
    );
    mapDbError(error);
  },

  async getBuildingAdminModulesForRole(roleLabel: string): Promise<BuildingAdminModulePermission[]> {
    const roleDefaults = await loadBuildingRolePermissionDefaults(roleLabel);
    return roleDefaults.map((row) => ({
      moduleKey: row.moduleKey,
      label: row.label,
      enabled: row.view,
    }));
  },

  async getOccupancyBuildingAdminModules(
    occupancyId: string,
    roleLabel: string
  ): Promise<BuildingAdminModulePermission[]> {
    const roleDefaults = await loadBuildingRolePermissionDefaults(roleLabel);
    const { data: occRows, error: occError } = await sb()
      .from("occupancy_building_admin_modules")
      .select("module_key, enabled")
      .eq("occupancy_id", occupancyId);
    mapDbError(occError);
    return mergeEffectiveBuildingAdminModules(
      roleDefaults,
      (occRows ?? []) as Array<{ module_key: string; enabled: boolean }>
    );
  },

  async saveOccupancyBuildingAdminModules(
    occupancyId: string,
    modules: BuildingAdminModulePermission[]
  ): Promise<void> {
    const buildingId = await bid();
    await sb().from("occupancy_building_admin_modules").delete().eq("occupancy_id", occupancyId);
    if (modules.length === 0) return;
    const { error } = await sb().from("occupancy_building_admin_modules").insert(
      modules.map((module) => ({
        occupancy_id: occupancyId,
        building_id: buildingId,
        module_key: module.moduleKey,
        enabled: module.enabled,
      }))
    );
    mapDbError(error);
  },

  async emailOccupancyLoginDetails(occupancyId: string) {
    return invokeSendPortalEmail({
      type: "occupancy_login_details",
      occupancyId,
    });
  },

  async sendOccupancyEmail(occupancyId: string, subject: string, body: string) {
    return invokeSendPortalEmail({
      type: "occupancy_custom_email",
      occupancyId,
      subject,
      body,
    });
  },

  async activateOccupancy(occupancyId: string) {
    const result = await invokeSendPortalEmail({
      type: "occupancy_activate",
      occupancyId,
    });
    const buildingId = await bid();
    await refreshBuildingCounts(buildingId);
    return result;
  },

  async activateOccupancies(occupancyIds: string[]) {
    const successes: string[] = [];
    const failures: string[] = [];
    for (const occupancyId of occupancyIds) {
      try {
        await invokeSendPortalEmail({
          type: "occupancy_activate",
          occupancyId,
        });
        successes.push(occupancyId);
      } catch (err) {
        failures.push(
          `${occupancyId}: ${err instanceof Error ? err.message : "Activation failed."}`
        );
      }
    }
    if (successes.length > 0) {
      const buildingId = await bid();
      await refreshBuildingCounts(buildingId);
    }
    return { successes, failures };
  },
};

async function loadOccupancyPortalModules(
  occupancyId: string,
  residentType: UnitsUsersResidentType
): Promise<ResidentPortalModulePermission[]> {
  const buildingId = await bid();
  await ensureResidentTypePortalModules(buildingId, residentType);
  const buildingModules = await loadBuildingPortalModulePermissions(buildingId);
  const { data: typeRows } = await sb()
    .from("resident_type_portal_modules")
    .select("module_id, enabled")
    .eq("building_id", buildingId)
    .eq("resident_type", residentType);
  const { data: occRows } = await sb()
    .from("occupancy_portal_modules")
    .select("module_id, enabled")
    .eq("occupancy_id", occupancyId);
  return mergeEffectivePortalModules(
    buildingModules,
    (typeRows ?? []) as Array<{ module_id: string; enabled: boolean }>,
    (occRows ?? []) as Array<{ module_id: string; enabled: boolean }>
  );
}

async function loadOccupancyBuildingAdminModules(
  occupancyId: string,
  roleLabel: string
): Promise<BuildingAdminModulePermission[]> {
  const roleDefaults = await loadBuildingRolePermissionDefaults(roleLabel);
  const { data: occRows } = await sb()
    .from("occupancy_building_admin_modules")
    .select("module_key, enabled")
    .eq("occupancy_id", occupancyId);
  return mergeEffectiveBuildingAdminModules(
    roleDefaults,
    (occRows ?? []) as Array<{ module_key: string; enabled: boolean }>
  );
}

function mapUserDetail(row: Record<string, unknown>): UnitsUsersUserDetail {
  const unit = row.units as { label: string } | null;
  const profile = row.profiles as Record<string, unknown> | null;
  const residentName = String(row.resident_name ?? "");
  const parsed = splitResidentDisplayName(residentName);
  const profileFirst = String(profile?.first_name ?? "").trim();
  const profileLast = String(profile?.last_name ?? "").trim();
  const firstName = profileLast ? profileFirst : parsed.firstName;
  const lastName = profileLast ? profileLast : parsed.lastName;
  return {
    id: row.id as string,
    unitLabel: unit?.label,
    status: row.account_status as UnitsUsersUserDetail["status"],
    statusTags: (row.status_tags as UnitsUsersUserDetail["statusTags"]) ?? [],
    name: row.resident_name as string,
    firstName,
    lastName,
    type: row.resident_type as UnitsUsersUserDetail["type"],
    email: row.email as string,
    timezone: (profile?.timezone as string) ?? "America/Toronto",
    homePhone: profile?.tel_home as string | undefined,
    mobilePhone: (profile?.tel_mobile as string) ?? (row.phone as string | undefined),
    businessPhone: profile?.tel_business as string | undefined,
    lastLogin: row.last_login_at ? String(row.last_login_at) : undefined,
    buzzerCode: row.buzzer_code as string | undefined,
    parkingSpots: [],
    lockers: [],
    keyFobs: [],
    vehicles: [],
    guestList: [],
    bikeSpaces: [],
    pets: [],
    notes: [],
  };
}
