const ACTIVE_VIEW_KEY = "mvpcondos_active_view";

export type PersistedPortalView = "company" | "admin" | "resident" | "vendor";

export function getPersistedPortalView(): PersistedPortalView | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(ACTIVE_VIEW_KEY);
  if (value === "company" || value === "admin" || value === "resident" || value === "vendor") {
    return value;
  }
  return null;
}

export function setPersistedPortalView(view: PersistedPortalView | null) {
  if (typeof window === "undefined") return;
  if (view) sessionStorage.setItem(ACTIVE_VIEW_KEY, view);
  else sessionStorage.removeItem(ACTIVE_VIEW_KEY);
}
