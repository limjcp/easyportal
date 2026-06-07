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
import { seedCompanyBuildings } from "../../company/data/mock/buildings";
import { seedCompanyEmployees } from "../../company/data/mock/employees";
import { seedCompanyNotifications } from "../../company/data/mock/notifications";
import { seedCompanyUser } from "../../company/data/mock/companyUser";
import { seedManagementCompanyProfile } from "../../company/data/mock/managementCompanyProfile";
import { seedBuildingTotals } from "../../company/data/mock/buildingTotals";
import { seedMasterReports } from "../../company/data/mock/masterReports";
import { seedPurchaseOrders } from "../../company/data/mock/purchaseOrders";
import { DEFAULT_ROLE_NAMES, createDefaultPermissionsForRole } from "../../company/data/mock/permissions";
import { seedBuildingSubscriptions, seedCompanySubscriptions, seedStripePayouts } from "../../company/data/mock/subscriptions";
import { seedVendors } from "../../company/data/mock/vendors";
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
