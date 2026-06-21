import type { CompanyRoute } from "../company/navigation";
import type { MasterReportTab, MasterReportType } from "../resident/data/types";

const DEFAULT_COMPANY_ROUTE: CompanyRoute = { page: "buildings" };

const MASTER_REPORT_TYPES = new Set<MasterReportType>([
  "amenity-reservations",
  "board-approvals",
  "building-store",
  "certificates",
  "incident-reports",
  "chargebacks",
  "service-requests",
  "users-pending",
  "portal-signups",
]);

export function companyRouteToPath(route: CompanyRoute): string {
  switch (route.page) {
    case "buildings":
      return "/company/buildings";
    case "master-reports":
      return "/company/master-reports";
    case "master-report-detail": {
      const base = `/company/master-reports/${route.reportType}`;
      if (route.tab) return `${base}?tab=${route.tab}`;
      return base;
    }
    case "employees":
      return "/company/employees";
    case "vendors":
      return "/company/vendors";
    case "purchase-orders": {
      const params = new URLSearchParams();
      if (route.tab) params.set("tab", route.tab);
      if (route.vendorId) params.set("vendorId", route.vendorId);
      const qs = params.toString();
      return qs ? `/company/purchase-orders?${qs}` : "/company/purchase-orders";
    }
    case "account": {
      const tab = route.tab ?? "building-subscriptions";
      return `/company/account?tab=${tab}`;
    }
    case "chat":
      return "/company/chat";
    default:
      return "/company/buildings";
  }
}

export function parseCompanyRoute(pathname: string, search = ""): CompanyRoute {
  const params = new URLSearchParams(search.replace(/^\?/, ""));

  if (pathname === "/company" || pathname === "/company/buildings") {
    return DEFAULT_COMPANY_ROUTE;
  }
  if (pathname === "/company/master-reports") {
    return { page: "master-reports" };
  }
  const masterMatch = pathname.match(/^\/company\/master-reports\/([^/]+)$/);
  if (masterMatch) {
    const reportType = masterMatch[1] as MasterReportType;
    if (MASTER_REPORT_TYPES.has(reportType)) {
      const tab = params.get("tab") as MasterReportTab | null;
      return tab
        ? { page: "master-report-detail", reportType, tab }
        : { page: "master-report-detail", reportType };
    }
  }
  if (pathname === "/company/employees") return { page: "employees" };
  if (pathname === "/company/vendors") return { page: "vendors" };
  if (pathname === "/company/purchase-orders") {
    const tab = params.get("tab");
    const vendorId = params.get("vendorId") ?? undefined;
    return {
      page: "purchase-orders",
      tab: tab === "archived" ? "archived" : "current",
      vendorId,
    };
  }
  if (pathname === "/company/chat") return { page: "chat" };
  if (pathname === "/company/account") {
    const tab = params.get("tab");
    const validTab =
      tab === "company-subscriptions" || tab === "stripe"
        ? tab
        : "building-subscriptions";
    return { page: "account", tab: validTab };
  }

  return DEFAULT_COMPANY_ROUTE;
}

/** Match `/company/buildings/:buildingId/admin/...` and return building id + admin sub-path. */
export function parseCompanyBuildingAdminPath(pathname: string): {
  buildingId: string;
  adminSubPath: string;
} | null {
  const match = pathname.match(/^\/company\/buildings\/([^/]+)\/admin(?:\/(.*))?$/);
  if (!match) return null;
  return {
    buildingId: decodeURIComponent(match[1]),
    adminSubPath: match[2] ?? "",
  };
}

export function isCompanyPortalPath(pathname: string): boolean {
  return pathname === "/company" || pathname.startsWith("/company/");
}
