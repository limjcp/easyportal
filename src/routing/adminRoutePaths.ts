import type { AdminRoute } from "../admin/navigation";
import type { BuildingDefinitionTab } from "../admin/navigation";
import type { PortalSettingsTab } from "../admin/navigation";
import type { ExternalDataTab } from "../resident/data/types";

const DEFAULT_ADMIN_ROUTE: AdminRoute = { page: "dashboard" };

/** Path segments after the admin base (no leading slash). */
export function adminRouteToPath(route: AdminRoute): string {
  switch (route.page) {
    case "dashboard":
      return "";
    case "consultation-leads":
      return "consultation-leads";
    case "building-definition":
      return `building-definition/${route.tab}`;
    case "external-data-links":
      return `external-data/${route.tab}`;
    case "portal-settings":
      return `portal-settings/${route.tab}`;
    case "admins":
      return "admins";
    case "board-approvals":
      return `board-approvals/${route.tab}`;
    case "board-members":
      return `board-members/${route.tab}`;
    case "board-application-detail":
      return `board-applications/${encodeURIComponent(route.id)}`;
    case "board-elections":
      return "board-elections";
    case "board-election-edit":
      return `board-elections/${encodeURIComponent(route.id)}/edit`;
    case "agm":
      return "agm";
    case "compliance-dashboard":
      return "compliance-dashboard";
    case "fire-safety":
      return "fire-safety";
    case "amenity-bookings":
      return `amenity-bookings/${route.tab}`;
    case "documents":
      return route.folderId
        ? `documents/${encodeURIComponent(route.folderId)}`
        : "documents";
    case "events": {
      const base = `events/${route.tab}`;
      if (route.calendarFilter && route.calendarFilter !== "all") {
        return `${base}?calendarFilter=${route.calendarFilter}`;
      }
      return base;
    }
    case "faq":
      return "faq";
    case "galleries":
      return "galleries";
    case "incident-reports":
      return `incident-reports/${route.tab}`;
    case "news-notices":
      return `news-notices/${route.tab}`;
    case "news-notice-edit":
      return `news-notices/${encodeURIComponent(route.id)}/edit`;
    case "polls":
      return "polls";
    case "poll-edit":
      return `polls/${encodeURIComponent(route.id)}/edit`;
    case "service-requests":
      return `service-requests/${route.tab}`;
    case "status-certificates":
      return route.tab ? `status-certificates/${route.tab}` : "status-certificates";
    case "suggestions":
      return "suggestions";
    case "suggestion-detail":
      return `suggestions/${encodeURIComponent(route.id)}`;
    case "units-users":
      return route.tab ? `units-users/${route.tab}` : "units-users/current";
    case "chat":
      return "chat";
    default:
      return "";
  }
}

function decodeId(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** Parse admin sub-path (and optional query) into AdminRoute. */
export function pathToAdminRoute(subPath: string, search = ""): AdminRoute {
  const trimmed = subPath.replace(/^\/+|\/+$/g, "");
  if (!trimmed) return DEFAULT_ADMIN_ROUTE;

  const queryIndex = trimmed.indexOf("?");
  const pathOnly = queryIndex >= 0 ? trimmed.slice(0, queryIndex) : trimmed;
  const inlineQuery = queryIndex >= 0 ? trimmed.slice(queryIndex + 1) : "";
  const params = new URLSearchParams(inlineQuery || search.replace(/^\?/, ""));
  const segments = pathOnly.split("/").filter(Boolean);

  const first = segments[0];
  const second = segments[1];
  const third = segments[2];

  switch (first) {
    case "dashboard":
      return DEFAULT_ADMIN_ROUTE;
    case "consultation-leads":
      return { page: "consultation-leads" };
    case "building-definition":
      return {
        page: "building-definition",
        tab: (second as BuildingDefinitionTab) ?? "building",
      };
    case "external-data":
      return {
        page: "external-data-links",
        tab: (second as ExternalDataTab) ?? "stripe",
      };
    case "portal-settings":
      return {
        page: "portal-settings",
        tab: (second as PortalSettingsTab) ?? "public-settings",
      };
    case "admins":
      return { page: "admins" };
    case "board-approvals":
      return { page: "board-approvals", tab: second === "archived" ? "archived" : "current" };
    case "board-members":
      return {
        page: "board-members",
        tab: second === "applications" ? "applications" : "members",
      };
    case "board-applications":
      return second
        ? { page: "board-application-detail", id: decodeId(second) }
        : { page: "board-members", tab: "applications" };
    case "board-elections":
      if (second && third === "edit") {
        return { page: "board-election-edit", id: decodeId(second) };
      }
      return { page: "board-elections" };
    case "agm":
      return { page: "agm" };
    case "compliance-dashboard":
      return { page: "compliance-dashboard" };
    case "fire-safety":
      return { page: "fire-safety" };
    case "amenity-bookings":
      return {
        page: "amenity-bookings",
        tab:
          second === "past" || second === "cancelled" || second === "settings"
            ? second
            : "current",
      };
    case "documents":
      return second
        ? { page: "documents", folderId: decodeId(second) }
        : { page: "documents" };
    case "events": {
      const tab =
        second === "once" || second === "recurring" || second === "paid" ? second : "calendar";
      const calendarFilter = params.get("calendarFilter");
      if (calendarFilter === "admin-only") {
        return { page: "events", tab, calendarFilter: "admin-only" };
      }
      return { page: "events", tab };
    }
    case "faq":
      return { page: "faq" };
    case "galleries":
      return { page: "galleries" };
    case "incident-reports":
      return {
        page: "incident-reports",
        tab:
          second === "archived" ||
          second === "contact-emails" ||
          second === "categories"
            ? second
            : "current",
      };
    case "news-notices":
      if (second && third === "edit") {
        return { page: "news-notice-edit", id: decodeId(second) };
      }
      return { page: "news-notices", tab: second === "archived" ? "archived" : "current" };
    case "polls":
      if (second && third === "edit") {
        return { page: "poll-edit", id: decodeId(second) };
      }
      return { page: "polls" };
    case "service-requests":
      return {
        page: "service-requests",
        tab:
          second === "archived" || second === "categories" || second === "terms"
            ? second
            : "current",
      };
    case "status-certificates":
      return {
        page: "status-certificates",
        tab:
          second === "archived" || second === "settings" ? second : undefined,
      };
    case "suggestions":
      if (second && !third) {
        return { page: "suggestion-detail", id: decodeId(second) };
      }
      return { page: "suggestions" };
    case "units-users":
      return {
        page: "units-users",
        tab:
          second === "pending" || second === "unoccupied" || second === "archived"
            ? second
            : "current",
      };
    case "chat":
      return { page: "chat" };
    default:
      return DEFAULT_ADMIN_ROUTE;
  }
}

/** Extract admin sub-path from a full pathname given its prefix. */
export function extractAdminSubPath(pathname: string, adminPathPrefix: string): string {
  const normalizedPrefix = adminPathPrefix.replace(/\/+$/, "");
  if (!pathname.startsWith(normalizedPrefix)) return "";
  const remainder = pathname.slice(normalizedPrefix.length);
  return remainder.replace(/^\/+/, "");
}

export function buildAdminPath(adminPathPrefix: string, route: AdminRoute): string {
  const sub = adminRouteToPath(route);
  const base = adminPathPrefix.replace(/\/+$/, "");
  return sub ? `${base}/${sub}` : base;
}

export function companyBuildingAdminPrefix(buildingId: string): string {
  return `/company/buildings/${encodeURIComponent(buildingId)}/admin`;
}

export function standaloneAdminPrefix(buildingId: string): string {
  return `/admin/buildings/${encodeURIComponent(buildingId)}`;
}

/** Match `/admin/buildings/:buildingId/...` and return building id + admin sub-path. */
export function parseStandaloneAdminPath(pathname: string): {
  buildingId: string;
  adminSubPath: string;
} | null {
  const match = pathname.match(/^\/admin\/buildings\/([^/]+)(?:\/(.*))?$/);
  if (!match) return null;
  return {
    buildingId: decodeURIComponent(match[1]),
    adminSubPath: match[2] ?? "",
  };
}

export function isStandaloneAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}
