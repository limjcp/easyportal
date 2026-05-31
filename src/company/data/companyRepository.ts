import type {
  CompanyBuilding,
  CompanyEmployee,
  CompanyNotification,
  CompanySubscription,
  CompanyUser,
  ManagementCompanyProfile,
  UpdateCompanyUserInput,
  UpdateManagementCompanyInput,
  BuildingSubscription,
  BuildingTotalRow,
  CompanyMasterReportStats,
  CreateBuildingInput,
  CreateEmployeeInput,
  CreatePurchaseOrderInput,
  CreateVendorInput,
  MasterReportListParams,
  MasterReportListResult,
  BoardApprovalDetail,
  CertificateDetail,
  IncidentReportDetail,
  MasterReportRow,
  MasterReportType,
  PermissionModuleRow,
  PurchaseOrder,
  PurchaseOrderStatus,
  RoleNameOverride,
  RolePermissionDefaults,
  StripePayout,
  Vendor,
  UpdateVendorInput,
  CustomPortalTile,
  PortalModuleConfig,
} from "../../resident/data/types";
import type { CompanyRole } from "../../resident/data/types";
import { boardApprovalDetailFromRow } from "./mock/boardApprovalDetails";
import { certificateDetailFromRow } from "./mock/certificateDetails";
import { incidentReportDetailFromRow } from "./mock/incidentReportDetails";
import { companyStore, nextCompanyId } from "./companyStore";
import { createDefaultPermissionsForRole } from "./mock/permissions";
import { pushVendorNotification } from "../../vendor/data/pushVendorNotification";
import { store } from "../../resident/data/sharedStore";
import { normalizePortalLayout } from "../../resident/data/portalTileLayout";

const delay = () => new Promise<void>((r) => setTimeout(r, 50));

function normalizeSearch(s: string | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function rowMatchesSearch(row: MasterReportRow, search: string): boolean {
  if (!search) return true;
  const haystack = [
    row.id,
    row.incidentNumber,
    row.buildingLabel,
    row.title,
    row.status,
    row.severity,
    row.unit,
    row.owner,
    row.location,
    row.extra,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(search);
}

function normalizeBuildingIds(ids: string[] | undefined): string[] | undefined {
  if (!ids?.length) return undefined;
  const normalized = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
  return normalized.length ? normalized : undefined;
}

export const companyRepository = {
  async getCompanyUser(): Promise<CompanyUser> {
    await delay();
    return { ...companyStore.user };
  },

  async updateCompanyUser(input: UpdateCompanyUserInput): Promise<CompanyUser> {
    await delay();
    const updated: CompanyUser = {
      ...companyStore.user,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email.trim(),
      displayName: `${input.firstName.trim()} ${input.lastName.trim()}`,
      timezone: input.timezone,
      telHome: input.telHome?.trim() ?? "",
      telMobile: input.telMobile?.trim() ?? "",
      telWork: input.telWork?.trim() ?? "",
    };
    companyStore.user = updated;
    return { ...updated };
  },

  async getManagementCompanyProfile(): Promise<ManagementCompanyProfile> {
    await delay();
    return { ...companyStore.managementCompany };
  },

  async updateManagementCompanyProfile(
    input: UpdateManagementCompanyInput
  ): Promise<ManagementCompanyProfile> {
    await delay();
    const updated: ManagementCompanyProfile = {
      ...companyStore.managementCompany,
      companyName: input.companyName.trim(),
      address: input.address.trim(),
      city: input.city.trim(),
      postalZip: input.postalZip.trim(),
      country: input.country,
      provinceState: input.provinceState,
      timezone: input.timezone,
      companyEmail: input.companyEmail.trim(),
      tel1: input.tel1.trim(),
      tel2: input.tel2?.trim() ?? "",
      fax: input.fax?.trim() ?? "",
    };
    companyStore.user = {
      ...companyStore.user,
      managementCompany: updated.companyName,
    };
    companyStore.managementCompany = updated;
    return { ...updated };
  },

  async deleteManagementCompanyLogo(): Promise<ManagementCompanyProfile> {
    await delay();
    companyStore.managementCompany = {
      ...companyStore.managementCompany,
      logoUrl: undefined,
    };
    return { ...companyStore.managementCompany };
  },

  async getBuildings(): Promise<CompanyBuilding[]> {
    await delay();
    return [...companyStore.buildings];
  },

  async getBuilding(id: string): Promise<CompanyBuilding | undefined> {
    await delay();
    return companyStore.buildings.find((b) => b.id === id);
  },

  async checkSubdomainAvailable(subdomain: string): Promise<boolean> {
    await delay();
    const normalized = subdomain.trim().toLowerCase();
    if (!normalized || normalized.length < 2) return false;
    const reserved = ["www", "admin", "api", "demo", "test"];
    if (reserved.includes(normalized)) return false;
    const taken = companyStore.buildings.some(
      (b) => b.code.toLowerCase() === normalized || b.name.toLowerCase().replace(/\s+/g, "") === normalized
    );
    return !taken;
  },

  async createBuilding(input: CreateBuildingInput): Promise<CompanyBuilding> {
    await delay();
    const id = String(2125700000 + companyStore.nextId);
    companyStore.nextId += 1;

    const corp = input.corp.trim();
    const corpNo = input.corpNo?.trim() ?? "";
    const code =
      (input.buildingName?.trim().replace(/\s+/g, "") || `${corp}${corpNo}` || input.subdomain).slice(0, 12) ||
      input.subdomain;
    const displayName = input.buildingName?.trim() || `${corp} ${corpNo}`.trim() || code;
    const condoLine = corp
      ? `(${corp}${corpNo ? ` ${corpNo}` : ""}) ${input.address}`
      : input.address;
    const cityProvincePostal = [input.city, input.provinceState, input.postalZip, input.country]
      .filter(Boolean)
      .join(", ");

    const MVP_ADMINS =
      "Admin MVP Condos, Cientlyn Porras, Claudio Lim, Darren East, Gay Hundey, Mayflor Paraunda, Office MVP Condos, Reyneil Paraunda, Richelle Diane, Scott Hundey, Vina Porras";

    const building: CompanyBuilding = {
      id,
      code,
      name: displayName,
      condoLine,
      cityProvincePostal,
      address: `${condoLine}, ${cityProvincePostal}`,
      admins: MVP_ADMINS,
      unitsCount: 0,
      adminsCount: 13,
      usersCount: 0,
      imageUrl: `https://picsum.photos/seed/bld-${id}/100/80`,
      subscriptionPackage: "Basic Package",
      status: "active",
      lastActivity: new Date().toISOString().slice(0, 10),
    };

    companyStore.buildings.push(building);

    companyStore.buildingTotals.push({
      id,
      subscription: "",
      corp: code,
      name: displayName,
      address: condoLine,
      owners: 0,
      activatedUsers: 0,
    });

    if (!companyStore.buildingSubscriptions.some((s) => s.buildingId === id)) {
      companyStore.buildingSubscriptions.push({
        id: nextCompanyId("sub"),
        buildingId: id,
        buildingName: displayName,
        address: building.address,
        package: "Basic Package",
        active: true,
      });
    }

    return { ...building };
  },

  async getEmployees(): Promise<CompanyEmployee[]> {
    await delay();
    return [...companyStore.employees];
  },

  async createEmployee(input: CreateEmployeeInput): Promise<CompanyEmployee> {
    await delay();
    const emp: CompanyEmployee = {
      id: nextCompanyId("emp"),
      ...input,
      lastLogin: undefined,
    };
    companyStore.employees.push(emp);
    return emp;
  },

  async updateEmployee(id: string, input: Partial<CreateEmployeeInput>): Promise<CompanyEmployee | undefined> {
    await delay();
    const idx = companyStore.employees.findIndex((e) => e.id === id);
    if (idx < 0) return undefined;
    companyStore.employees[idx] = { ...companyStore.employees[idx], ...input };
    return companyStore.employees[idx];
  },

  async emailEmployeeLoginDetails(employeeId: string): Promise<{ ok: boolean; message: string }> {
    await delay();
    const emp = companyStore.employees.find((e) => e.id === employeeId);
    if (!emp) {
      return { ok: false, message: "Employee not found." };
    }
    return {
      ok: true,
      message: `Login details emailed to ${emp.email}.`,
    };
  },

  async getRoleNameOverrides(): Promise<RoleNameOverride[]> {
    await delay();
    return companyStore.roleNameOverrides.map((r) => ({ ...r }));
  },

  async saveRoleNameOverrides(overrides: RoleNameOverride[]): Promise<void> {
    await delay();
    companyStore.roleNameOverrides = overrides.map((r) => ({ ...r }));
  },

  async getRolePermissions(role: CompanyRole): Promise<PermissionModuleRow[]> {
    await delay();
    const found = companyStore.rolePermissions.find((r) => r.role === role);
    return found ? found.permissions.map((p) => ({ ...p })) : createDefaultPermissionsForRole(role);
  },

  async saveRolePermissions(role: CompanyRole, permissions: RolePermissionDefaults["permissions"]): Promise<void> {
    await delay();
    const idx = companyStore.rolePermissions.findIndex((r) => r.role === role);
    if (idx >= 0) {
      companyStore.rolePermissions[idx].permissions = permissions.map((p) => ({ ...p }));
    } else {
      companyStore.rolePermissions.push({ role, permissions: permissions.map((p) => ({ ...p })) });
    }
  },

  async getVendors(): Promise<Vendor[]> {
    await delay();
    return [...companyStore.vendors];
  },

  async createVendor(input: CreateVendorInput): Promise<Vendor> {
    await delay();
    const sup: Vendor = {
      id: nextCompanyId("sup"),
      ...input,
      buildingIds: normalizeBuildingIds(input.buildingIds),
      status: input.status ?? "active",
    };
    companyStore.vendors.push(sup);
    return sup;
  },

  async updateVendor(id: string, input: UpdateVendorInput): Promise<Vendor | undefined> {
    await delay();
    const idx = companyStore.vendors.findIndex((s) => s.id === id);
    if (idx < 0) return undefined;
    companyStore.vendors[idx] = {
      ...companyStore.vendors[idx],
      ...input,
      ...(input.buildingIds ? { buildingIds: normalizeBuildingIds(input.buildingIds) } : {}),
    };
    return companyStore.vendors[idx];
  },

  async inviteVendor(vendorId: string, email: string): Promise<Vendor | undefined> {
    await delay();
    const idx = companyStore.vendors.findIndex((s) => s.id === vendorId);
    if (idx < 0) return undefined;
    companyStore.vendors[idx] = {
      ...companyStore.vendors[idx],
      status: "pending_invite",
      email: email || companyStore.vendors[idx].email,
    };
    companyStore.vendorInvitations.push({
      id: nextCompanyId("inv"),
      vendorId,
      invitedEmail: email,
      sentAt: new Date().toISOString(),
    });
    return companyStore.vendors[idx];
  },

  async getPurchaseOrders(archived = false): Promise<PurchaseOrder[]> {
    await delay();
    return companyStore.purchaseOrders.filter((po) => {
      const isArchived = po.status === "declined" || po.status === "accepted";
      return archived ? isArchived : !isArchived;
    });
  },

  async getAllPurchaseOrders(): Promise<PurchaseOrder[]> {
    await delay();
    return [...companyStore.purchaseOrders];
  },

  async getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined> {
    await delay();
    return companyStore.purchaseOrders.find((p) => p.id === id);
  },

  async getPurchaseOrdersByVendor(vendorId: string): Promise<PurchaseOrder[]> {
    await delay();
    return companyStore.purchaseOrders.filter((po) => po.vendorId === vendorId);
  },

  async getActivePurchaseOrderCountsByVendor(): Promise<Record<string, number>> {
    await delay();
    const counts: Record<string, number> = {};
    companyStore.purchaseOrders.forEach((po) => {
      if (po.status === "accepted" || po.status === "declined") return;
      counts[po.vendorId] = (counts[po.vendorId] ?? 0) + 1;
    });
    return counts;
  },

  async getPurchaseOrdersBySourceRequest(
    kind: "company-service-request" | "admin-service-request",
    requestId: string
  ): Promise<PurchaseOrder[]> {
    await delay();
    return companyStore.purchaseOrders
      .filter((po) => po.sourceRequest?.kind === kind && po.sourceRequest?.requestId === requestId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async createPurchaseOrder(input: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
    await delay();
    const lineItems = input.lineItems.map((li, i) => ({
      id: `li-${companyStore.nextId + i}`,
      ...li,
    }));
    const total = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
    const poNumber = `PO-2024-${String(companyStore.nextPoNumber).padStart(3, "0")}`;
    companyStore.nextPoNumber += 1;
    const po: PurchaseOrder = {
      id: nextCompanyId("po"),
      poNumber,
      vendorId: input.vendorId,
      buildingId: input.buildingId,
      sourceRequest: input.sourceRequest,
      status: input.status ?? "draft",
      lineItems,
      total,
      notes: input.notes,
      createdBy: companyStore.user.displayName,
      createdAt: new Date().toISOString().slice(0, 10),
      sentAt: input.status === "sent" ? new Date().toISOString().slice(0, 10) : undefined,
    };
    companyStore.purchaseOrders.push(po);
    return po;
  },

  async updatePurchaseOrderStatus(id: string, status: PurchaseOrderStatus): Promise<PurchaseOrder | undefined> {
    await delay();
    const idx = companyStore.purchaseOrders.findIndex((p) => p.id === id);
    if (idx < 0) return undefined;
    const po = companyStore.purchaseOrders[idx];
    po.status = status;
    if (status === "sent" && !po.sentAt) {
      po.sentAt = new Date().toISOString().slice(0, 10);
      pushVendorNotification(po.vendorId, po.id, po.poNumber, "po_received");
    }
    if (status === "accepted" || status === "declined") {
      po.respondedAt = new Date().toISOString().slice(0, 10);
      const vendor = companyStore.vendors.find((s) => s.id === po.vendorId);
      const notif: CompanyNotification = {
        id: nextCompanyId("notif"),
        type: status === "accepted" ? "po_accepted" : "po_declined",
        message: `${po.poNumber} was ${status} by ${vendor?.companyName ?? "vendor"}.`,
        read: false,
        createdAt: new Date().toISOString(),
        poId: po.id,
      };
      companyStore.notifications.unshift(notif);
    }
    return po;
  },

  async sendPurchaseOrder(id: string): Promise<PurchaseOrder | undefined> {
    return this.updatePurchaseOrderStatus(id, "sent");
  },

  async getNotifications(): Promise<CompanyNotification[]> {
    await delay();
    return [...companyStore.notifications];
  },

  async markNotificationRead(id: string): Promise<void> {
    await delay();
    const n = companyStore.notifications.find((x) => x.id === id);
    if (n) n.read = true;
  },

  async markAllNotificationsRead(): Promise<void> {
    await delay();
    companyStore.notifications.forEach((n) => {
      n.read = true;
    });
  },

  async getUnreadNotificationCount(): Promise<number> {
    await delay();
    return companyStore.notifications.filter((n) => !n.read).length;
  },

  async getMasterReports(
    reportType: MasterReportType,
    archived = false,
    buildingId?: string,
    filters?: { unit?: string; owner?: string }
  ): Promise<MasterReportRow[]> {
    await delay();
    return companyStore.masterReports.filter((r) => {
      if (r.reportType !== reportType) return false;
      if (r.archived !== archived) return false;
      if (buildingId && buildingId !== "all" && r.buildingId !== buildingId) return false;
      if (filters?.unit && filters.unit !== "all" && r.unit !== filters.unit) return false;
      if (filters?.owner && filters.owner !== "all" && r.owner !== filters.owner) return false;
      return true;
    });
  },

  /**
   * Aggregate stats shown above the Community Totals table on the master reports hub.
   *
   * Legacy parity note: `/admin/masterReports/` summary cards (Communities / Owners / Activated Users).
   */
  async getMasterReportStats(): Promise<CompanyMasterReportStats> {
    await delay();
    const rows = companyStore.buildingTotals;
    return {
      communities: rows.length,
      owners: rows.reduce((sum, r) => sum + r.owners, 0),
      activatedUsers: rows.reduce((sum, r) => sum + r.activatedUsers, 0),
    };
  },

  /**
   * Community Totals table on the master reports hub.
   *
   * Legacy parity note: DataTables `#table-reports` on `/admin/masterReports/`.
   */
  async getBuildingTotals(): Promise<BuildingTotalRow[]> {
    await delay();
    return [...companyStore.buildingTotals].sort((a, b) => b.address.localeCompare(a.address));
  },

  async getMasterReportBuildings(): Promise<{ value: string; label: string }[]> {
    await delay();
    const buildings = [...companyStore.buildings]
      .slice()
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((b) => ({
        value: b.id,
        label: `  - ${b.condoLine ?? b.name} - ${b.code}`,
      }));
    return [{ value: "all", label: "All" }, ...buildings];
  },

  /**
   * Lists master report rows for the company portal.
   *
   * Legacy parity note: this corresponds to the "ajax_*.asp" DataTables endpoints used by the old
   * master reports pages (server-side pagination/filtering). For now, this is backed by mock data.
   */
  async getMasterReportList(reportType: MasterReportType, params: MasterReportListParams = {}): Promise<MasterReportListResult> {
    await delay();

    const tab = params.tab ?? "current";
    const archived = tab === "archived";
    const search = normalizeSearch(params.search);
    const pageSize = Math.max(1, params.pageSize ?? 10);
    const page = Math.max(1, params.page ?? 1);

    const filtered = companyStore.masterReports.filter((r) => {
      if (r.reportType !== reportType) return false;
      if (r.archived !== archived) return false;

      if (params.buildingId && params.buildingId !== "all" && r.buildingId !== params.buildingId) return false;
      if (params.status && params.status !== "all" && r.status !== params.status) return false;
      if (params.severity && params.severity !== "all" && r.severity !== params.severity) return false;
      if (params.unit && params.unit !== "all" && r.unit !== params.unit) return false;
      if (params.owner && params.owner !== "all" && r.owner !== params.owner) return false;
      if (typeof params.pendingReply === "boolean" && r.pendingReply !== params.pendingReply) return false;

      if (!rowMatchesSearch(r, search)) return false;
      return true;
    });

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const rows = filtered.slice(start, start + pageSize);
    return { rows, total };
  },

  /**
   * Loads one master report row for the "View" modal.
   *
   * Legacy parity note: this is where the legacy UI would open an iframe to a report detail page.
   * In v1, we return enough data to render a simple iframe srcDoc until real endpoints exist.
   */
  async getMasterReportDetail(reportType: MasterReportType, id: string): Promise<MasterReportRow | undefined> {
    await delay();
    return companyStore.masterReports.find((r) => r.reportType === reportType && r.id === id);
  },

  /**
   * Full certificate view for the legacy m-view.asp iframe modal.
   */
  async getCertificateDetail(id: string): Promise<CertificateDetail | undefined> {
    await delay();
    const row = companyStore.masterReports.find((r) => r.reportType === "certificates" && r.id === id);
    if (!row) return undefined;
    return certificateDetailFromRow(row);
  },

  async getBoardApprovalDetail(id: string): Promise<BoardApprovalDetail | undefined> {
    await delay();
    const row = companyStore.masterReports.find((r) => r.reportType === "board-approvals" && r.id === id);
    if (!row) return undefined;
    return boardApprovalDetailFromRow(row);
  },

  async getIncidentReportDetail(id: string): Promise<IncidentReportDetail | undefined> {
    await delay();
    const row = companyStore.masterReports.find((r) => r.reportType === "incident-reports" && r.id === id);
    if (!row) return undefined;
    return incidentReportDetailFromRow(row);
  },

  /**
   * Users Pending Assignment list.
   *
   * Legacy parity note: `/admin/masterReports/usersPendingAssignment/`.
   */
  async getUsersPending(params: MasterReportListParams = {}): Promise<MasterReportListResult> {
    return this.getMasterReportList("users-pending", params);
  },

  /**
   * Board Approvals list (current/archived).
   *
   * Legacy parity note: `/admin/masterReports/boardApprovals/` + ajax list endpoint.
   */
  async getBoardApprovals(params: MasterReportListParams = {}): Promise<MasterReportListResult> {
    return this.getMasterReportList("board-approvals", params);
  },

  /**
   * Building Store purchases list.
   *
   * Legacy parity note: `/admin/masterReports/buildingStore/` + ajax list endpoint.
   */
  async getBuildingStorePurchases(params: MasterReportListParams = {}): Promise<MasterReportListResult> {
    return this.getMasterReportList("building-store", params);
  },

  /**
   * Certificate Requests list (current/archived).
   *
   * Legacy parity note: `/admin/masterReports/certificates/` + ajax list endpoint.
   */
  async getCertificateRequests(params: MasterReportListParams = {}): Promise<MasterReportListResult> {
    return this.getMasterReportList("certificates", params);
  },

  /**
   * Chargebacks list.
   *
   * Legacy parity note: `/admin/masterReports/chargebacks/`.
   */
  async getChargebacks(params: MasterReportListParams = {}): Promise<MasterReportListResult> {
    return this.getMasterReportList("chargebacks", params);
  },

  async getBuildingSubscriptions(): Promise<BuildingSubscription[]> {
    await delay();
    return [...companyStore.buildingSubscriptions];
  },

  async getCompanySubscriptions(): Promise<CompanySubscription[]> {
    await delay();
    return [...companyStore.companySubscriptions];
  },

  async getStripePayouts(): Promise<StripePayout[]> {
    await delay();
    return [...companyStore.stripePayouts];
  },

  async getMasterPortalModules(): Promise<PortalModuleConfig[]> {
    await delay();
    return store.companyMasterPortalModules.map((m) => ({ ...m }));
  },

  async getMasterCustomPortalTiles(): Promise<CustomPortalTile[]> {
    await delay();
    return store.companyMasterCustomPortalTiles.map((t) => ({ ...t }));
  },

  async getMasterPrimaryTileLimit(): Promise<number> {
    await delay();
    return store.companyMasterPrimaryTileLimit;
  },

  async updateMasterPortalLayout(input: {
    modules: PortalModuleConfig[];
    customTiles: CustomPortalTile[];
    primaryTileLimit: number;
  }): Promise<void> {
    await delay();
    store.companyMasterPrimaryTileLimit = Math.max(1, Math.floor(input.primaryTileLimit));
    const normalized = normalizePortalLayout(
      input.modules.map((m) => ({ ...m })),
      input.customTiles.map((t) => ({ ...t })),
      store.companyMasterPrimaryTileLimit
    );
    store.companyMasterPortalModules = normalized.modules;
    store.companyMasterCustomPortalTiles = normalized.customTiles;
  },
};
