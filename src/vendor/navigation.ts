export type VendorRoute =
  | { page: "dashboard" }
  | { page: "purchase-orders"; tab?: "action" | "history" }
  | { page: "purchase-order-detail"; id: string }
  | { page: "profile" };

export const vendorNavItems: { id: string; label: string; route: VendorRoute }[] = [
  { id: "dashboard", label: "Dashboard", route: { page: "dashboard" } },
  { id: "purchase-orders", label: "Purchase Orders", route: { page: "purchase-orders", tab: "action" } },
  { id: "profile", label: "Profile", route: { page: "profile" } },
];

export function isVendorNavActive(route: VendorRoute, navId: string): boolean {
  switch (navId) {
    case "dashboard":
      return route.page === "dashboard";
    case "purchase-orders":
      return route.page === "purchase-orders" || route.page === "purchase-order-detail";
    case "profile":
      return route.page === "profile";
    default:
      return false;
  }
}

export function getVendorBreadcrumbs(
  route: VendorRoute
): { label: string; route?: VendorRoute }[] {
  switch (route.page) {
    case "dashboard":
      return [{ label: "Dashboard" }];
    case "purchase-orders":
      return [
        { label: "Purchase Orders", route: { page: "purchase-orders", tab: route.tab ?? "action" } },
        { label: route.tab === "history" ? "History" : "Action Required" },
      ];
    case "purchase-order-detail":
      return [
        { label: "Purchase Orders", route: { page: "purchase-orders", tab: "action" } },
        { label: "Details" },
      ];
    case "profile":
      return [{ label: "Profile" }];
    default:
      return [{ label: "Home" }];
  }
}
