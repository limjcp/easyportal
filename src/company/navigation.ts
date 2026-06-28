import type { IconType } from "react-icons";
import {
  FaBuilding,
  FaChartBar,
  FaCog,
  FaFileInvoice,
  FaTruck,
  FaUserPlus,
  FaUsers,
  FaComments,
} from "react-icons/fa";
import type { MasterReportTab, MasterReportType } from "../resident/data/types";

export type CompanyRoute =
  | { page: "buildings" }
  | { page: "master-reports" }
  | { page: "master-report-detail"; reportType: MasterReportType; tab?: MasterReportTab }
  | { page: "employees" }
  | { page: "vendors" }
  | { page: "purchase-orders"; tab?: "current" | "archived"; vendorId?: string }
  | { page: "account"; tab?: "building-subscriptions" | "company-subscriptions" | "stripe" }
  | { page: "chat" };

export type CompanyNavItem = {
  id: string;
  label: string;
  icon: IconType;
  route: CompanyRoute;
  moduleKey?: string;
};

export const companyNavItems: CompanyNavItem[] = [
  { id: "buildings", label: "Buildings", icon: FaBuilding, route: { page: "buildings" }, moduleKey: "company-condos" },
  { id: "master-reports", label: "Master Reports", icon: FaChartBar, route: { page: "master-reports" }, moduleKey: "company-master-reports" },
  { id: "employees", label: "Employees", icon: FaUsers, route: { page: "employees" }, moduleKey: "company-employees" },
  { id: "vendors", label: "Vendors", icon: FaTruck, route: { page: "vendors" }, moduleKey: "company-vendors" },
  { id: "purchase-orders", label: "POs", icon: FaFileInvoice, route: { page: "purchase-orders", tab: "current" }, moduleKey: "company-purchase-orders" },
  { id: "chat", label: "Chat", icon: FaComments, route: { page: "chat" }, moduleKey: "chat" },
  { id: "account", label: "Account", icon: FaCog, route: { page: "account", tab: "building-subscriptions" }, moduleKey: "company-subscriptions" },
];

export function filterCompanyNavItems(
  items: CompanyNavItem[],
  access: Map<string, boolean> | null
): CompanyNavItem[] {
  if (!access) return items;
  return items.filter((item) => !item.moduleKey || access.get(item.moduleKey) === true);
}

export function isCompanyRouteAllowed(
  route: CompanyRoute,
  access: Map<string, boolean> | null
): boolean {
  if (!access) return true;
  if (route.page === "master-report-detail") {
    return access.get("company-master-reports") === true;
  }
  const navItem = companyNavItems.find((item) => isCompanyNavActive(route, item.id));
  if (!navItem?.moduleKey) return true;
  return access.get(navItem.moduleKey) === true;
}

export function defaultCompanyRoute(access: Map<string, boolean> | null): CompanyRoute {
  const allowed = filterCompanyNavItems(companyNavItems, access);
  return allowed[0]?.route ?? { page: "buildings" };
}

export function isCompanyNavActive(
  route: CompanyRoute,
  navId: string,
  activeBuilding?: boolean
): boolean {
  switch (navId) {
    case "buildings":
      return route.page === "buildings" || !!activeBuilding;
    case "master-reports":
      return route.page === "master-reports" || route.page === "master-report-detail";
    case "employees":
      return route.page === "employees";
    case "vendors":
      return route.page === "vendors";
    case "purchase-orders":
      return route.page === "purchase-orders";
    case "chat":
      return route.page === "chat";
    case "account":
      return route.page === "account";
    default:
      return false;
  }
}

export const MASTER_REPORT_TILES: {
  id: MasterReportType;
  label: string;
  color: string;
}[] = [
  { id: "amenity-reservations", label: "Amenity Reservations", color: "bg-[#7b4bb7]" },
  { id: "board-approvals", label: "Board Approvals", color: "bg-[#89c64c]" },
  { id: "building-store", label: "Building Store", color: "bg-[#5bc0de]" },
  { id: "certificates", label: "Certificates", color: "bg-[#9b8fd4]" },
  { id: "incident-reports", label: "Incident Reports", color: "bg-[#d9534f]" },
  { id: "chargebacks", label: "Chargebacks", color: "bg-[#333333]" },
  { id: "service-requests", label: "Service Requests", color: "bg-[#e8913a]" },
  { id: "users-pending", label: "Users Pending", color: "bg-[#5bc0de]" },
  { id: "portal-signups", label: "Portal Registrations", color: "bg-[#5bc0de]" },
];

export function getMasterReportTitle(reportType: MasterReportType): string {
  return MASTER_REPORT_TILES.find((t) => t.id === reportType)?.label ?? reportType;
}

export function getCompanyPageTitle(route: CompanyRoute): string {
  switch (route.page) {
    case "buildings":
      return "Buildings";
    case "master-reports":
      return "Master Reports";
    case "master-report-detail":
      return getMasterReportTitle(route.reportType);
    case "employees":
      return "Employees";
    case "vendors":
      return "Vendors";
    case "purchase-orders":
      return "Purchase Orders";
    case "chat":
      return "Chat";
    case "account":
      return "Account";
    default:
      return "Company Portal";
  }
}

export function getCompanyBreadcrumbs(route: CompanyRoute): { label: string; route?: CompanyRoute }[] {
  const home: CompanyRoute = { page: "buildings" };
  switch (route.page) {
    case "buildings":
      return [{ label: "Home", route: home }, { label: "Buildings" }];
    case "master-reports":
      return [{ label: "Home", route: home }, { label: "Master Reports" }];
    case "master-report-detail":
      return [
        { label: "Home", route: home },
        { label: "Master Reports", route: { page: "master-reports" } },
        { label: getMasterReportTitle(route.reportType) },
      ];
    case "employees":
      return [{ label: "Home", route: home }, { label: "Employees" }];
    case "vendors":
      return [{ label: "Home", route: home }, { label: "Vendors" }];
    case "purchase-orders":
      return [{ label: "Home", route: home }, { label: "POs" }];
    case "chat":
      return [{ label: "Home", route: home }, { label: "Chat" }];
    case "account":
      return [{ label: "Home", route: home }, { label: "Account" }];
    default:
      return [{ label: "Home", route: home }];
  }
}
