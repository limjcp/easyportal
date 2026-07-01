import type {
  CompanyBuilding,
  CompanyEmployee,
  CompanyNotification,
  CompanySubscription,
  CompanyUser,
  ManagementCompanyProfile,
  BuildingSubscription,
  BuildingTotalRow,
  MasterReportRow,
  PurchaseOrder,
  RoleNameOverride,
  RolePermissionDefaults,
  StripePayout,
  Vendor,
  VendorInvitation,
  VendorNotification,
  VendorSession,
  CompanyRole,
} from "../../resident/data/types";
import { DEFAULT_ROLE_NAMES, createDefaultPermissionsForRole } from "../../company/data/permissions";

const emptyCompanyUser: CompanyUser = {
  id: "",
  displayName: "",
  firstName: "",
  lastName: "",
  email: "",
  role: "Company Owner",
  managementCompany: "",
};

const emptyManagementCompany: ManagementCompanyProfile = {
  id: "",
  companyName: "",
  address: "",
  city: "",
  postalZip: "",
  country: "",
  provinceState: "",
  timezone: "America/Toronto",
  companyEmail: "",
  tel1: "",
  tel2: "",
  fax: "",
};

export const companyStore = {
  user: { ...emptyCompanyUser },
  managementCompany: { ...emptyManagementCompany },
  buildings: [] as CompanyBuilding[],
  employees: [] as CompanyEmployee[],
  vendors: [] as Vendor[],
  vendorInvitations: [] as VendorInvitation[],
  vendorSession: null as VendorSession | null,
  vendorNotifications: [] as VendorNotification[],
  purchaseOrders: [] as PurchaseOrder[],
  notifications: [] as CompanyNotification[],
  masterReports: [] as MasterReportRow[],
  buildingTotals: [] as BuildingTotalRow[],
  buildingSubscriptions: [] as BuildingSubscription[],
  companySubscriptions: [] as CompanySubscription[],
  stripePayouts: [] as StripePayout[],
  roleNameOverrides: DEFAULT_ROLE_NAMES.map((r) => ({ ...r })) as RoleNameOverride[],
  rolePermissions: [
    "Company Owner",
    "Company Administrator",
    "Company Accountant",
    "Property Manager",
    "Property Administrator",
  ].map((role) => ({
    role: role as CompanyRole,
    permissions: createDefaultPermissionsForRole(role as CompanyRole),
  })) as RolePermissionDefaults[],
  nextPoNumber: 1,
  nextId: 1000,
};

export function nextCompanyId(prefix: string): string {
  companyStore.nextId += 1;
  return `${prefix}-${companyStore.nextId}`;
}
