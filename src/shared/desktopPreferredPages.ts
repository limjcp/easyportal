import type { AdminRoute } from "../admin/navigation";
import type { CompanyRoute } from "../company/navigation";
import type { ResidentRoute } from "../resident/navigation";
import type { VendorRoute } from "../vendor/navigation";

const ADMIN_DESKTOP_PREFERRED_PAGES = new Set<AdminRoute["page"]>([
  "building-definition",
  "external-data-links",
  "portal-settings",
  "units-users",
  "admins",
  "agm",
  "events",
  "poll-edit",
  "board-election-edit",
  "news-notice-edit",
]);

const COMPANY_DESKTOP_PREFERRED_PAGES = new Set<CompanyRoute["page"]>([
  "master-report-detail",
  "employees",
  "vendors",
  "account",
]);

const RESIDENT_DESKTOP_PREFERRED_PAGES = new Set<ResidentRoute["page"]>([
  "parking-spots",
  "lockers",
  "key-fobs",
  "vehicles",
  "guest-list",
  "bike-spaces",
  "pets",
  "purchase-date-maint-fees",
]);

const VENDOR_DESKTOP_PREFERRED_PAGES = new Set<VendorRoute["page"]>([
  "payment-settings",
  "compliance",
]);

export function isAdminDesktopPreferred(route: AdminRoute): boolean {
  return ADMIN_DESKTOP_PREFERRED_PAGES.has(route.page);
}

export function isCompanyDesktopPreferred(route: CompanyRoute): boolean {
  return COMPANY_DESKTOP_PREFERRED_PAGES.has(route.page);
}

export function isResidentDesktopPreferred(route: ResidentRoute): boolean {
  return RESIDENT_DESKTOP_PREFERRED_PAGES.has(route.page);
}

export function isVendorDesktopPreferred(route: VendorRoute): boolean {
  return VENDOR_DESKTOP_PREFERRED_PAGES.has(route.page);
}

export function desktopPreferredBannerKey(
  portal: "admin" | "company" | "resident" | "vendor",
  pageKey: string
): string {
  return `desktop-preferred-dismiss:${portal}:${pageKey}`;
}

export function adminDesktopPreferredPageKey(route: AdminRoute): string {
  if (route.page === "building-definition") return `building-definition:${route.tab}`;
  if (route.page === "external-data-links") return `external-data:${route.tab}`;
  if (route.page === "portal-settings") return `portal-settings:${route.tab}`;
  if (route.page === "events") return `events:${route.tab}`;
  return route.page;
}

export function companyDesktopPreferredPageKey(route: CompanyRoute): string {
  if (route.page === "master-report-detail") return `master-report:${route.reportType}`;
  if (route.page === "account") return `account:${route.tab ?? "default"}`;
  return route.page;
}

export function residentDesktopPreferredPageKey(route: ResidentRoute): string {
  return route.page;
}

export function vendorDesktopPreferredPageKey(route: VendorRoute): string {
  return route.page;
}
