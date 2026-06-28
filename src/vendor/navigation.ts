export type VendorRoute =
  | { page: "dashboard" }
  | { page: "purchase-orders"; tab?: "action" | "history" }
  | { page: "purchase-order-detail"; id: string }
  | { page: "compliance" }
  | { page: "payment-settings" }
  | { page: "profile" };

export const vendorNavItems: { id: string; label: string; route: VendorRoute }[] = [
  { id: "dashboard", label: "Dashboard", route: { page: "dashboard" } },
  { id: "purchase-orders", label: "Purchase Orders", route: { page: "purchase-orders", tab: "action" } },
  { id: "compliance", label: "Compliance", route: { page: "compliance" } },
  { id: "payment-settings", label: "Payment Settings", route: { page: "payment-settings" } },
  { id: "profile", label: "Profile", route: { page: "profile" } },
];

export function isVendorNavActive(route: VendorRoute, navId: string): boolean {
  switch (navId) {
    case "dashboard":
      return route.page === "dashboard";
    case "purchase-orders":
      return route.page === "purchase-orders" || route.page === "purchase-order-detail";
    case "compliance":
      return route.page === "compliance";
    case "payment-settings":
      return route.page === "payment-settings";
    case "profile":
      return route.page === "profile";
    default:
      return false;
  }
}

export function getVendorPageTitle(route: VendorRoute): string {
  switch (route.page) {
    case "dashboard":
      return "Dashboard";
    case "purchase-orders":
      return route.tab === "history" ? "PO History" : "Purchase Orders";
    case "purchase-order-detail":
      return "PO Details";
    case "compliance":
      return "Compliance";
    case "payment-settings":
      return "Payment Settings";
    case "profile":
      return "Profile";
    default:
      return "Vendor Portal";
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
    case "compliance":
      return [{ label: "Compliance" }];
    case "payment-settings":
      return [{ label: "Payment Settings" }];
    case "profile":
      return [{ label: "Profile" }];
    default:
      return [{ label: "Home" }];
  }
}
