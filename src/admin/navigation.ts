import type { IconType } from "react-icons";
import type { ExternalDataTab } from "../resident/data/types";
import {
  FaBell,
  FaBuilding,
  FaCalendarAlt,
  FaCertificate,
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
  | { page: "fire-safety" }
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
  | { page: "newsletters" }
  | { page: "newsletter-edit"; id: string }
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
  dividerBefore?: boolean;
};

export const adminNavItems: AdminNavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: FaTachometerAlt, route: { page: "dashboard" } },
  {
    id: "consultation-leads",
    label: "Consultation Leads",
    icon: FaClipboardList,
    route: { page: "consultation-leads" },
  },
  { id: "building", label: "Building Definition", icon: FaBuilding, route: { page: "building-definition", tab: "building" } },
  {
    id: "external-data",
    label: "External Data Links",
    icon: FaLink,
    route: { page: "external-data-links", tab: "stripe" },
  },
  { id: "portal", label: "Portal Settings", icon: FaCog, route: { page: "portal-settings", tab: "public-settings" } },
  { id: "admins", label: "Admins", icon: FaUserShield, route: { page: "admins" }, dividerBefore: true },
  { id: "board", label: "Board Approvals", icon: FaClipboardList, route: { page: "board-approvals", tab: "current" } },
  { id: "board-members", label: "Board Members", icon: FaUserTie, route: { page: "board-members", tab: "members" } },
  { id: "board-elections", label: "Board Elections", icon: FaVoteYea, route: { page: "board-elections" } },
  { id: "agm", label: "AGM Meetings", icon: FaCalendarAlt, route: { page: "agm" } },
  { id: "fire-safety", label: "Fire Safety Plan", icon: FaFireExtinguisher, route: { page: "fire-safety" } },
  { id: "documents", label: "Documents", icon: FaFileAlt, route: { page: "documents", folderId: "0" } },
  { id: "events", label: "Events", icon: FaCalendarAlt, route: { page: "events", tab: "calendar", calendarFilter: "all" } },
  { id: "faq", label: "FAQ", icon: FaQuestionCircle, route: { page: "faq" } },
  { id: "galleries", label: "Galleries", icon: FaImage, route: { page: "galleries" } },
  { id: "incidents", label: "Incident Reports", icon: FaExclamationTriangle, route: { page: "incident-reports", tab: "current" } },
  { id: "news-notices", label: "News & Notices", icon: FaBell, route: { page: "news-notices", tab: "current" } },
  { id: "newsletters", label: "Newsletters", icon: FaFile, route: { page: "newsletters" } },
  { id: "service-requests", label: "Service Requests", icon: FaTools, route: { page: "service-requests", tab: "current" } },
  {
    id: "status-certificates",
    label: "Status Certificates",
    icon: FaCertificate,
    route: { page: "status-certificates", tab: "current" },
  },
  { id: "suggestions", label: "Suggestion Box", icon: FaCommentDots, route: { page: "suggestions" } },
  { id: "chat", label: "Chat", icon: FaComments, route: { page: "chat" } },
  { id: "polls", label: "Polls", icon: FaClipboardList, route: { page: "polls" } },
  { id: "units-users", label: "Units & Users", icon: FaUsers, route: { page: "units-users" } },
];

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
    case "newsletters":
      return route.page === "newsletters" || route.page === "newsletter-edit";
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
    case "fire-safety":
      return "Fire Safety Plan";
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
    case "newsletters":
      return "Newsletters";
    case "newsletter-edit":
      return "Edit Newsletter";
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
    case "fire-safety":
      return [{ label: "Fire Safety Plan", route }];
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
    case "newsletters":
      return [{ label: "Newsletters", route }];
    case "newsletter-edit":
      return [{ label: "Newsletters", route: { page: "newsletters" } }, { label: "Edit" }];
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
