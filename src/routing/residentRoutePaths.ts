import type { ResidentRoute } from "../resident/navigation";

const DEFAULT_RESIDENT_ROUTE: ResidentRoute = { page: "home" };

/** Path segments after `/resident` (no leading slash). */
export function residentRouteToPath(route: ResidentRoute): string {
  switch (route.page) {
    case "home":
      return "";
    case "news":
      return "news";
    case "news-detail":
      return `news/${encodeURIComponent(route.id)}`;
    case "documents":
      return "documents";
    case "service-requests":
      return "service-requests";
    case "incident-reports":
      return "incident-reports";
    case "suggestions":
      return "suggestions";
    case "events":
      return "events";
    case "gallery":
      return "gallery";
    case "gallery-detail":
      return `gallery/${encodeURIComponent(route.id)}`;
    case "faq":
      return "faq";
    case "status-certificates":
      return "status-certificates";
    case "parking-spots":
      return "parking-spots";
    case "lockers":
      return "lockers";
    case "key-fobs":
      return "key-fobs";
    case "vehicles":
      return "vehicles";
    case "guest-list":
      return "guest-list";
    case "bike-spaces":
      return "bike-spaces";
    case "pets":
      return "pets";
    case "purchase-date-maint-fees":
      return "condo-fees";
    case "board-member":
      return "board-member";
    case "board-elections":
      return "board-elections";
    case "board-election-vote":
      return `board-elections/${encodeURIComponent(route.electionId)}/vote`;
    case "polls":
      return "polls";
    case "fire-safety-plan":
      return "fire-safety-plan";
    case "chat":
      return "chat";
    case "amenity-bookings":
      return "amenity-bookings";
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

export function pathToResidentRoute(subPath: string): ResidentRoute {
  const trimmed = subPath.replace(/^\/+|\/+$/g, "");
  if (!trimmed) return DEFAULT_RESIDENT_ROUTE;

  const segments = trimmed.split("/").filter(Boolean);
  const first = segments[0];
  const second = segments[1];
  const third = segments[2];

  switch (first) {
    case "news":
      return second ? { page: "news-detail", id: decodeId(second) } : { page: "news" };
    case "documents":
      return { page: "documents" };
    case "service-requests":
      return { page: "service-requests" };
    case "incident-reports":
      return { page: "incident-reports" };
    case "suggestions":
      return { page: "suggestions" };
    case "events":
      return { page: "events" };
    case "gallery":
      return second ? { page: "gallery-detail", id: decodeId(second) } : { page: "gallery" };
    case "faq":
      return { page: "faq" };
    case "status-certificates":
      return { page: "status-certificates" };
    case "parking-spots":
      return { page: "parking-spots" };
    case "lockers":
      return { page: "lockers" };
    case "key-fobs":
      return { page: "key-fobs" };
    case "vehicles":
      return { page: "vehicles" };
    case "guest-list":
      return { page: "guest-list" };
    case "bike-spaces":
      return { page: "bike-spaces" };
    case "pets":
      return { page: "pets" };
    case "condo-fees":
    case "purchase-date-maint-fees":
      return { page: "purchase-date-maint-fees" };
    case "board-member":
      return { page: "board-member" };
    case "board-elections":
      if (second && third === "vote") {
        return { page: "board-election-vote", electionId: decodeId(second) };
      }
      return { page: "board-elections" };
    case "polls":
      return { page: "polls" };
    case "fire-safety-plan":
      return { page: "fire-safety-plan" };
    case "chat":
      return { page: "chat" };
    case "amenity-bookings":
      return { page: "amenity-bookings" };
    default:
      return DEFAULT_RESIDENT_ROUTE;
  }
}

export function extractResidentSubPath(pathname: string, prefix = "/resident"): string {
  const normalizedPrefix = prefix.replace(/\/+$/, "");
  if (pathname === normalizedPrefix) return "";
  if (!pathname.startsWith(`${normalizedPrefix}/`)) return "";
  return pathname.slice(normalizedPrefix.length + 1);
}

export function buildResidentPath(prefix: string, route: ResidentRoute): string {
  const sub = residentRouteToPath(route);
  const base = prefix.replace(/\/+$/, "");
  return sub ? `${base}/${sub}` : base;
}

export function isResidentPortalPath(pathname: string): boolean {
  return pathname === "/resident" || pathname.startsWith("/resident/");
}

export const RESIDENT_PATH_PREFIX = "/resident";
