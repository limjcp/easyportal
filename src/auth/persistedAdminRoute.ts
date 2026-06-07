import type { AdminRoute } from "../admin/navigation";

const ADMIN_ROUTE_KEY = "mvpcondos_admin_route";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAdminRoute(value: unknown): value is AdminRoute {
  if (!isRecord(value) || typeof value.page !== "string") return false;
  return true;
}

export function getPersistedAdminRoute(): AdminRoute | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(ADMIN_ROUTE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isAdminRoute(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function setPersistedAdminRoute(route: AdminRoute | null) {
  if (typeof window === "undefined") return;
  if (route) sessionStorage.setItem(ADMIN_ROUTE_KEY, JSON.stringify(route));
  else sessionStorage.removeItem(ADMIN_ROUTE_KEY);
}
