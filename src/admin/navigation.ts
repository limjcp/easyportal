import type { IconType } from "react-icons";
import type { ExternalDataTab } from "../resident/data/types";
import {
  FaBell,
  FaBuilding,
  FaCalendarAlt,
  FaCalendarCheck,
  FaCertificate,
  FaClipboardCheck,
  FaClipboardList,
  FaCommentDots,
  FaExclamationTriangle,
  FaFile,
  FaFileAlt,
  FaImage,
  FaLink,
  FaQuestionCircle,
  FaTachometerAlt,
  FaTools,
  FaCog,
  FaUsers,
  FaUserShield,
  FaUserTie,
  FaFireExtinguisher,
  FaComments,
  FaVoteYea,
} from "react-icons/fa";

export type BuildingDefinitionTab =
  | "building"
  | "tax"
  | "units"
  | "unit-groups"
  | "parking"
  | "lockers"
  | "amenities"
  | "reminders";

export type { ExternalDataTab };

export type PortalSettingsTab =
  | "public-settings"
  | "public-images"
  | "public-documents"
  | "resident-images"
  | "modules"
  | "registration"
  | "profile";

export type AdminRoute =
  | { page: "dashboard" }
  | { page: "consultation-leads" }
  | { page: "building-definition"; tab: BuildingDefinitionTab }
  | { page: "external-data-links"; tab: ExternalDataTab }
  | { page: "portal-settings"; tab: PortalSettingsTab }
  | { page: "admins" }
  | { page: "board-approvals"; tab: "current" | "archived" }
  | { page: "board-members"; tab: "members" | "applications" }
  | { page: "board-application-detail"; id: string }
  | { page: "board-elections" }
  | { page: "board-election-edit"; id: string }
  | { page: "agm" }
  | { page: "compliance-dashboard" }
  | { page: "fire-safety" }
  | { page: "amenity-bookings"; tab: "current" | "past" | "cancelled" | "settings" }
  | { page: "documents"; folderId?: string }
  | {
      page: "events";
      tab: "calendar" | "once" | "recurring" | "paid";
      calendarFilter?: "all" | "admin-only";
    }
  | { page: "faq" }
  | { page: "galleries" }
  | { page: "incident-reports"; tab: "current" | "archived" | "contact-emails" | "categories" }
  | { page: "news-notices"; tab: "current" | "archived" }
  | { page: "news-notice-edit"; id: string }
  | { page: "polls" }
  | { page: "poll-edit"; id: string }
  | { page: "service-requests"; tab: "current" | "archived" | "categories" | "terms" }
  | { page: "status-certificates"; tab?: "current" | "archived" | "settings" }
  | { page: "suggestions" }
  | { page: "suggestion-detail"; id: string }
  | { page: "units-users" }
  | { page: "chat" };

export type AdminNavItem = {
  id: string;
  label: string;
  icon: IconType;
  route: AdminRoute;
  moduleKey?: string;
};

export type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

export const adminDashboardNavItem: AdminNavItem = {
  id: "dashboard",
  label: "Dashboard",
  icon: FaTachometerAlt,
  route: { page: "dashboard" },
};

const adminNavItemsById = {
  "consultation-leads": {
    id: "consultation-leads",
    label: "Consultation Leads",
    icon: FaClipboardList,
    route: { page: "consultation-leads" },
    moduleKey: "consultation-leads",
  },
  building: {
    id: "building",
    label: "Building Definition",
    icon: FaBuilding,
    route: { page: "building-definition", tab: "building" },
    moduleKey: "building-definitions",
  },
  "external-data": {
    id: "external-data",
    label: "External Data Links",
    icon: FaLink,
    route: { page: "external-data-links", tab: "stripe" },
    moduleKey: "external-data",
  },
  portal: {
    id: "portal",
    label: "Portal Settings",
    icon: FaCog,
    route: { page: "portal-settings", tab: "public-settings" },
    moduleKey: "portal-settings",
  },
  admins: {
    id: "admins",
    label: "Admins",
    icon: FaUserShield,
    route: { page: "admins" },
    moduleKey: "admins",
  },
  board: {
    id: "board",
    label: "Board Approvals",
    icon: FaClipboardList,
    route: { page: "board-approvals", tab: "current" },
    moduleKey: "board-approvals",
  },
  "board-members": {
    id: "board-members",
    label: "Board Members",
    icon: FaUserTie,
    route: { page: "board-members", tab: "members" },
    moduleKey: "board-members",
  },
  "board-elections": {
    id: "board-elections",
    label: "Board Elections",
    icon: FaVoteYea,
    route: { page: "board-elections" },
    moduleKey: "board-elections",
  },
  agm: {
    id: "agm",
    label: "AGM Meetings",
    icon: FaCalendarAlt,
    route: { page: "agm" },
    moduleKey: "agm",
  },
  "compliance-dashboard": {
    id: "compliance-dashboard",
    label: "Compliance Dashboard",
    icon: FaClipboardCheck,
    route: { page: "compliance-dashboard" },
    moduleKey: "compliance-dashboard",
  },
  "fire-safety": {
    id: "fire-safety",
    label: "Fire Safety Plan",
    icon: FaFireExtinguisher,
    route: { page: "fire-safety" },
    moduleKey: "fire-safety",
  },
  "amenity-bookings": {
    id: "amenity-bookings",
    label: "Amenity Bookings",
    icon: FaCalendarCheck,
    route: { page: "amenity-bookings", tab: "current" },
    moduleKey: "amenities",
  },
  documents: {
    id: "documents",
    label: "Documents",
    icon: FaFileAlt,
    route: { page: "documents" },
    moduleKey: "documents",
  },
  events: {
    id: "events",
    label: "Events",
    icon: FaCalendarAlt,
    route: { page: "events", tab: "calendar", calendarFilter: "all" },
    moduleKey: "events",
  },
  faq: {
    id: "faq",
    label: "FAQ",
    icon: FaQuestionCircle,
    route: { page: "faq" },
    moduleKey: "faq",
  },
  galleries: {
    id: "galleries",
    label: "Galleries",
    icon: FaImage,
    route: { page: "galleries" },
    moduleKey: "galleries",
  },
  incidents: {
    id: "incidents",
    label: "Incident Reports",
    icon: FaExclamationTriangle,
    route: { page: "incident-reports", tab: "current" },
    moduleKey: "incident-reports",
  },
  "news-notices": {
    id: "news-notices",
    label: "News & Notices",
    icon: FaBell,
    route: { page: "news-notices", tab: "current" },
    moduleKey: "news-notices",
  },
  "service-requests": {
    id: "service-requests",
    label: "Service Requests",
    icon: FaTools,
    route: { page: "service-requests", tab: "current" },
    moduleKey: "service-requests",
  },
  "status-certificates": {
    id: "status-certificates",
    label: "Status Certificates",
    icon: FaCertificate,
    route: { page: "status-certificates", tab: "current" },
    moduleKey: "status-certificates",
  },
  suggestions: {
    id: "suggestions",
    label: "Suggestion Box",
    icon: FaCommentDots,
    route: { page: "suggestions" },
    moduleKey: "suggestions",
  },
  chat: {
    id: "chat",
    label: "Chat",
    icon: FaComments,
    route: { page: "chat" },
    moduleKey: "chat",
  },
  polls: {
    id: "polls",
    label: "Polls",
    icon: FaClipboardList,
    route: { page: "polls" },
    moduleKey: "polls",
  },
  "units-users": {
    id: "units-users",
    label: "Units & Users",
    icon: FaUsers,
    route: { page: "units-users" },
    moduleKey: "units-users",
  },
} as const satisfies Record<string, AdminNavItem>;

function navItems(ids: (keyof typeof adminNavItemsById)[]): AdminNavItem[] {
  return ids.map((id) => adminNavItemsById[id]);
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    id: "property-operations",
    label: "Property Operations",
    items: navItems(["amenity-bookings", "service-requests", "status-certificates", "incidents"]),
  },
  {
    id: "governance",
    label: "Governance",
    items: navItems(["board-members", "board", "board-elections", "agm"]),
  },
  {
    id: "compliance-safety",
    label: "Compliance & Safety",
    items: navItems(["compliance-dashboard", "fire-safety"]),
  },
  {
    id: "communications-content",
    label: "Communications & Content",
    items: navItems(["news-notices", "events", "documents", "faq", "galleries"]),
  },
  {
    id: "community-engagement",
    label: "Community & Engagement",
    items: navItems(["consultation-leads", "suggestions", "chat", "polls"]),
  },
  {
    id: "people-access",
    label: "People & Access",
    items: navItems(["units-users", "admins"]),
  },
  {
    id: "system-configuration",
    label: "System Configuration",
    items: navItems(["building", "portal", "external-data"]),
  },
];

export const adminNavItems: AdminNavItem[] = [
  adminDashboardNavItem,
  ...adminNavGroups.flatMap((group) => group.items),
];

function filterAdminNavItemsList(
  items: AdminNavItem[],
  access: Map<string, boolean> | null
): AdminNavItem[] {
  if (!access) return items;
  return items.filter((item) => !item.moduleKey || access.get(item.moduleKey) === true);
}

export function filterAdminNavGroups(
  groups: AdminNavGroup[],
  access: Map<string, boolean> | null
): AdminNavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: filterAdminNavItemsList(group.items, access),
    }))
    .filter((group) => group.items.length > 0);
}

/** @deprecated Use filterAdminNavGroups */
export function filterAdminNavItems(
  items: AdminNavItem[],
  access: Map<string, boolean> | null
): AdminNavItem[] {
  return filterAdminNavItemsList(items, access);
}

export function isAdminNavGroupActive(route: AdminRoute, group: AdminNavGroup): boolean {
  return group.items.some((item) => isNavActive(route, item.id));
}

export function isAdminRouteAllowed(route: AdminRoute, access: Map<string, boolean> | null): boolean {
  if (!access) return true;
  if (route.page === "dashboard") return true;
  const navItem = adminNavItems.find((item) => isNavActive(route, item.id));
  if (!navItem?.moduleKey) return true;
  return access.get(navItem.moduleKey) === true;
}

export function isNavActive(route: AdminRoute, navId: string): boolean {
  switch (navId) {
    case "dashboard":
      return route.page === "dashboard";
    case "consultation-leads":
      return route.page === "consultation-leads";
    case "building":
      return route.page === "building-definition";
    case "external-data":
      return route.page === "external-data-links";
    case "portal":
      return route.page === "portal-settings";
    case "admins":
      return route.page === "admins";
    case "board":
      return route.page === "board-approvals";
    case "board-members":
      return route.page === "board-members" || route.page === "board-application-detail";
    case "board-elections":
      return route.page === "board-elections" || route.page === "board-election-edit";
    case "fire-safety":
      return route.page === "fire-safety";
    case "amenity-bookings":
      return route.page === "amenity-bookings";
    case "documents":
      return route.page === "documents";
    case "events":
      return route.page === "events";
    case "faq":
      return route.page === "faq";
    case "galleries":
      return route.page === "galleries";
    case "incidents":
      return route.page === "incident-reports";
    case "news-notices":
      return route.page === "news-notices" || route.page === "news-notice-edit";
    case "service-requests":
      return route.page === "service-requests";
    case "status-certificates":
      return route.page === "status-certificates";
    case "suggestions":
      return route.page === "suggestions" || route.page === "suggestion-detail";
    case "chat":
      return route.page === "chat";
    case "agm":
      return route.page === "agm";
    case "compliance-dashboard":
      return route.page === "compliance-dashboard";
    case "polls":
      return route.page === "polls" || route.page === "poll-edit";
    case "units-users":
      return route.page === "units-users";
    default:
      return false;
  }
}

export function getPageTitle(route: AdminRoute): string {
  switch (route.page) {
    case "dashboard":
      return "Dashboard";
    case "consultation-leads":
      return "Consultation Leads";
    case "building-definition":
      switch (route.tab) {
        case "building":
          return "Building Definition";
        case "tax":
          return "Tax Settings";
        case "units":
          return "Define Units";
        case "unit-groups":
          return "Unit Groups";
        case "parking":
          return "Define Parking";
        case "lockers":
          return "Define Lockers";
        case "amenities":
          return "Define Amenities";
        case "reminders":
          return "Reminders";
        default:
          return "Building Definition";
      }
    case "external-data-links": {
      const tabLabels: Record<ExternalDataTab, string> = {
        stripe: "Stripe Online Payments",
        quickbooks: "QuickBooks",
      };
      return tabLabels[route.tab];
    }
    case "portal-settings": {
      const tabLabels: Record<PortalSettingsTab, string> = {
        "public-settings": "Public Portal Settings",
        "public-images": "Public Portal Images",
        "public-documents": "Public Portal Documents",
        "resident-images": "Resident Portal Images",
        modules: "Resident Portal Tiles/Modules",
        registration: "Resident Portal Registration",
        profile: "Resident Portal Profile",
      };
      return tabLabels[route.tab];
    }
    case "admins":
      return "Administrators";
    case "board-approvals":
      return "Board Approvals";
    case "board-members":
      return route.tab === "applications" ? "Board Applications" : "Board Members";
    case "board-application-detail":
      return "Board Application";
    case "board-elections":
      return "Board Elections";
    case "board-election-edit":
      return "Edit Election";
    case "agm":
      return "AGM Meetings";
    case "compliance-dashboard":
      return "Compliance Dashboard";
    case "fire-safety":
      return "Fire Safety Plan";
    case "amenity-bookings":
      return "Amenity Bookings";
    case "documents":
      return "Documents";
    case "events":
      return "Events";
    case "faq":
      return "FAQ";
    case "galleries":
      return "Galleries";
    case "incident-reports":
      return "Incident Reports";
    case "news-notices":
      return "News & Notices";
    case "news-notice-edit":
      return "Edit News/Notice";
    case "polls":
      return "Polls";
    case "poll-edit":
      return "Edit Poll";
    case "service-requests":
      return "Service Requests";
    case "status-certificates":
      return "Status Certificates";
    case "suggestions":
      return "Suggestions";
    case "suggestion-detail":
      return "Suggestion";
    case "chat":
      return "Chat";
    case "units-users":
      return "Units & Users";
    default:
      return "Dashboard";
  }
}

export function getBreadcrumbTrail(route: AdminRoute): { label: string; route?: AdminRoute }[] {
  const home: AdminRoute = { page: "dashboard" };
  switch (route.page) {
    case "dashboard":
      return [{ label: "Dashboard", route }];
    case "consultation-leads":
      return [{ label: "Consultation Leads", route }];
    case "building-definition": {
      const tabLabels: Record<BuildingDefinitionTab, string> = {
        building: "Building Details",
        tax: "Tax",
        units: "Define Units",
        "unit-groups": "Unit Groups",
        parking: "Parking",
        lockers: "Lockers",
        amenities: "Amenities",
        reminders: "Reminders",
      };
      return [
        { label: "Building Definition", route: { page: "building-definition", tab: "building" } },
        { label: tabLabels[route.tab] },
      ];
    }
    case "external-data-links": {
      const tabLabels: Record<ExternalDataTab, string> = {
        stripe: "Stripe Online Payments",
        quickbooks: "QuickBooks",
      };
      return [
        {
          label: "External Data Options & Settings",
          route: { page: "external-data-links", tab: "stripe" },
        },
        { label: tabLabels[route.tab] },
      ];
    }
    case "portal-settings": {
      const tabLabels: Record<PortalSettingsTab, string> = {
        "public-settings": "Public Portal Settings",
        "public-images": "Public Portal Images",
        "public-documents": "Public Portal Documents",
        "resident-images": "Resident Portal Images",
        modules: "Resident Portal Tiles/Modules",
        registration: "Resident Portal Registration",
        profile: "Resident Portal Profile",
      };
      return [
        { label: "Portal Settings", route: { page: "portal-settings", tab: "public-settings" } },
        { label: tabLabels[route.tab] },
      ];
    }
    case "admins":
      return [{ label: "Administrators", route }];
    case "board-approvals": {
      const tabLabel = route.tab === "archived" ? "Archived Board Approvals" : "Current Board Approvals";
      return [
        { label: "Board Approvals", route: { page: "board-approvals", tab: "current" } },
        { label: tabLabel },
      ];
    }
    case "board-members": {
      const tabLabel = route.tab === "applications" ? "Applications" : "Current Members";
      return [
        { label: "Board Members", route: { page: "board-members", tab: "members" } },
        { label: tabLabel },
      ];
    }
    case "board-application-detail":
      return [
        { label: "Board Members", route: { page: "board-members", tab: "applications" } },
        { label: "Application" },
      ];
    case "board-elections":
      return [{ label: "Board Elections", route }];
    case "board-election-edit":
      return [{ label: "Board Elections", route: { page: "board-elections" } }, { label: "Edit" }];
    case "agm":
      return [{ label: "AGM Meetings", route }];
    case "compliance-dashboard":
      return [{ label: "Compliance Dashboard", route }];
    case "fire-safety":
      return [{ label: "Fire Safety Plan", route }];
    case "amenity-bookings": {
      const tabLabels: Record<string, string> = {
        current: "Current",
        past: "Past",
        cancelled: "Cancelled",
        settings: "Settings",
      };
      return [
        { label: "Amenity Bookings", route: { page: "amenity-bookings", tab: "current" } },
        { label: tabLabels[route.tab] ?? "Current" },
      ];
    }
    case "documents":
      return [{ label: "Documents", route }];
    case "events": {
      const tabLabels: Record<string, string> = {
        calendar: "Event Calendar",
        once: "One-Time Events",
        recurring: "Recurring Events",
        paid: "Paid Events",
      };
      const trail: { label: string; route?: AdminRoute }[] = [
        { label: "Events", route: { page: "events", tab: "calendar", calendarFilter: "all" } },
        { label: tabLabels[route.tab] },
      ];
      return trail;
    }
    case "faq":
      return [{ label: "FAQ", route }];
    case "galleries":
      return [{ label: "Galleries", route }];
    case "incident-reports": {
      const tabLabels: Record<string, string> = {
        current: "Current Reports",
        archived: "Archived Reports",
        "contact-emails": "Contact Emails",
        categories: "Report Categories",
      };
      return [
        { label: "Incident Reports", route: { page: "incident-reports", tab: "current" } },
        { label: tabLabels[route.tab] },
      ];
    }
    case "news-notices":
      return [{ label: "News & Notices", route }];
    case "news-notice-edit":
      return [{ label: "News & Notices", route: { page: "news-notices", tab: "current" } }, { label: "Edit" }];
    case "polls":
      return [{ label: "Polls", route }];
    case "poll-edit":
      return [{ label: "Polls", route: { page: "polls" } }, { label: "Edit" }];
    case "service-requests":
      return [{ label: "Service Requests", route }];
    case "status-certificates":
      return [{ label: "Status Certificates", route }];
    case "suggestions":
      return [{ label: "Suggestions", route }];
    case "suggestion-detail":
      return [{ label: "Suggestions", route: { page: "suggestions" } }, { label: "View" }];
    case "chat":
      return [{ label: "Chat", route }];
    case "units-users":
      return [{ label: "Units & Users", route }];
    default:
      return [{ label: "Home", route: home }];
  }
}

export function formatBuildingOptionLabel(b: { code: string; name: string; address: string }): string {
  return ` - (${b.code}) ${b.address} - ${b.code}`;
}
