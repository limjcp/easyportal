import type { CustomPortalTile, PortalModuleConfig, PortalTileSettings } from "../../resident/data/types";

export const DEFAULT_PORTAL_TILE_SETTINGS: PortalTileSettings = {
  portalTileOpacity: 0.75,
  defaultLanguage: "English",
  primaryTileLimit: 8,
  useMasterLayout: false,
};

export const DEFAULT_PORTAL_MODULES: PortalModuleConfig[] = [
  { moduleId: "home", name: "Home Page", tileLabel: "", enabled: true, message: "", sortOrder: 1, layoutZone: "primary", locked: true },
  { moduleId: "documents", name: "Documents", tileLabel: "Documents", enabled: true, message: "", sortOrder: 2, layoutZone: "primary" },
  { moduleId: "events", name: "Events", tileLabel: "Events", enabled: true, message: "", sortOrder: 3, layoutZone: "primary" },
  { moduleId: "faq", name: "FAQ", tileLabel: "Frequently Asked Questions", enabled: true, message: "", sortOrder: 4, layoutZone: "primary" },
  { moduleId: "galleries", name: "Galleries", tileLabel: "Photo Gallery", enabled: true, message: "", sortOrder: 5, layoutZone: "primary" },
  { moduleId: "incidentReport", name: "Incident Reports", tileLabel: "Incident Reports", enabled: true, message: "", sortOrder: 6, layoutZone: "primary" },
  { moduleId: "news", name: "News & Notices", tileLabel: "News / Notices", enabled: true, message: "", sortOrder: 7, layoutZone: "primary" },
  { moduleId: "newsletters", name: "Newsletters", tileLabel: "Newsletters", enabled: false, message: "", sortOrder: 8, layoutZone: "primary" },
  { moduleId: "serviceRequest", name: "Service Requests", tileLabel: "Service Requests", enabled: true, message: "", sortOrder: 1, layoutZone: "compact" },
  { moduleId: "statusCerts", name: "Status Certificates", tileLabel: "Status Certificates", enabled: false, message: "", sortOrder: 2, layoutZone: "compact" },
  { moduleId: "suggestion", name: "Suggestion Box", tileLabel: "Suggestions", enabled: true, message: "", sortOrder: 3, layoutZone: "compact" },
  { moduleId: "polls", name: "Polls", tileLabel: "Polls", enabled: true, message: "", sortOrder: 4, layoutZone: "compact" },
  { moduleId: "parkingSpots", name: "Parking", tileLabel: "Parking", enabled: true, message: "", sortOrder: 5, layoutZone: "compact" },
  { moduleId: "lockers", name: "Lockers", tileLabel: "Lockers", enabled: true, message: "", sortOrder: 6, layoutZone: "compact" },
  { moduleId: "keyFobs", name: "Key Fobs", tileLabel: "Key Fobs", enabled: true, message: "", sortOrder: 7, layoutZone: "compact" },
  { moduleId: "vehicles", name: "Vehicles", tileLabel: "Vehicles", enabled: true, message: "", sortOrder: 8, layoutZone: "compact" },
  { moduleId: "guestList", name: "Guest List", tileLabel: "Guest List", enabled: true, message: "", sortOrder: 9, layoutZone: "compact" },
  { moduleId: "bikeSpaces", name: "Bike Spaces", tileLabel: "Bike Spaces", enabled: true, message: "", sortOrder: 10, layoutZone: "compact" },
  { moduleId: "pets", name: "Pets", tileLabel: "Pets", enabled: true, message: "", sortOrder: 11, layoutZone: "compact" },
  {
    moduleId: "purchaseDateMaintFees",
    name: "Condo Fees",
    tileLabel: "Condo Fees",
    enabled: true,
    message: "",
    sortOrder: 12,
    layoutZone: "compact",
  },
  { moduleId: "boardMember", name: "Become a Board Member", tileLabel: "Become a Board Member", enabled: true, message: "", sortOrder: 13, layoutZone: "compact" },
  { moduleId: "boardElections", name: "Board Elections", tileLabel: "Board Elections", enabled: true, message: "", sortOrder: 14, layoutZone: "compact" },
  { moduleId: "fireSafetyPlan", name: "Fire Safety Plan", tileLabel: "Fire Safety Plan", enabled: true, message: "", sortOrder: 15, layoutZone: "compact" },
  { moduleId: "chat", name: "Chat", tileLabel: "Chat", enabled: true, message: "", sortOrder: 16, layoutZone: "compact" },
  {
    moduleId: "amenityBookings",
    name: "Amenity Bookings",
    tileLabel: "Amenity Bookings",
    enabled: true,
    message: "",
    sortOrder: 17,
    layoutZone: "compact",
  },
];

export const DEFAULT_CUSTOM_PORTAL_TILES: CustomPortalTile[] = [];
