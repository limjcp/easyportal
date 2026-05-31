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
} from "../../resident/data/types";
import { seedVendorNotifications } from "../../vendor/data/mock/notifications";
import { seedCompanyBuildings } from "./mock/buildings";
import { seedCompanyEmployees } from "./mock/employees";
import { seedCompanyNotifications } from "./mock/notifications";
import { seedCompanyUser } from "./mock/companyUser";
import { seedManagementCompanyProfile } from "./mock/managementCompanyProfile";
import { seedBuildingTotals } from "./mock/buildingTotals";
import { seedMasterReports } from "./mock/masterReports";
import { seedPurchaseOrders } from "./mock/purchaseOrders";
import { DEFAULT_ROLE_NAMES, createDefaultPermissionsForRole } from "./mock/permissions";
import { seedBuildingSubscriptions, seedCompanySubscriptions, seedStripePayouts } from "./mock/subscriptions";
import { seedVendors } from "./mock/vendors";
import type { CompanyRole } from "../../resident/data/types";

export const companyStore = {
  user: { ...seedCompanyUser },
  managementCompany: { ...seedManagementCompanyProfile },
  buildings: [...seedCompanyBuildings] as CompanyBuilding[],
  employees: [...seedCompanyEmployees] as CompanyEmployee[],
  vendors: [...seedVendors] as Vendor[],
  vendorInvitations: [] as VendorInvitation[],
  vendorSession: null as VendorSession | null,
  vendorNotifications: [...seedVendorNotifications] as VendorNotification[],
  purchaseOrders: [...seedPurchaseOrders] as PurchaseOrder[],
  notifications: [...seedCompanyNotifications] as CompanyNotification[],
  masterReports: [...seedMasterReports] as MasterReportRow[],
  buildingTotals: [...seedBuildingTotals] as BuildingTotalRow[],
  buildingSubscriptions: [...seedBuildingSubscriptions] as BuildingSubscription[],
  companySubscriptions: [...seedCompanySubscriptions] as CompanySubscription[],
  stripePayouts: [...seedStripePayouts] as StripePayout[],
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
  nextPoNumber: 5,
  nextId: 1000,
};

export function nextCompanyId(prefix: string): string {
  companyStore.nextId += 1;
  return `${prefix}-${companyStore.nextId}`;
}
