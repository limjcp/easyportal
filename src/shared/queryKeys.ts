export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    portalAccess: (userId: string) => ["auth", "portalAccess", userId] as const,
  },
  company: {
    all: (userId: string, companyId: string) => ["company", userId, companyId] as const,
    user: (userId: string, companyId: string) => ["company", userId, companyId, "user"] as const,
    buildings: (userId: string, companyId: string) => ["company", userId, companyId, "buildings"] as const,
    archivedBuildings: (userId: string, companyId: string) =>
      ["company", userId, companyId, "buildings", "archived"] as const,
    employees: (userId: string, companyId: string) => ["company", userId, companyId, "employees"] as const,
    vendors: (userId: string, companyId: string) => ["company", userId, companyId, "vendors"] as const,
    purchaseOrders: (userId: string, companyId: string, tab: string) =>
      ["company", userId, companyId, "purchaseOrders", tab] as const,
    activePoCounts: (userId: string, companyId: string) =>
      ["company", userId, companyId, "activePoCounts"] as const,
    navAccess: (userId: string, companyId: string) =>
      ["company", userId, companyId, "navAccess"] as const,
  },
  building: {
    root: (buildingId: string) => ["building", buildingId] as const,
    portalConfig: (userId: string, buildingId: string) =>
      ["building", buildingId, "portalConfig", userId] as const,
    navAccess: (userId: string, buildingId: string) =>
      ["building", buildingId, "navAccess", userId] as const,
    badgeCounts: (userId: string, buildingId: string) =>
      ["building", buildingId, "badgeCounts", userId] as const,
    adminServiceRequests: (userId: string, buildingId: string, tab: string) =>
      ["building", buildingId, "adminServiceRequests", userId, tab] as const,
    adminServiceCategories: (userId: string, buildingId: string) =>
      ["building", buildingId, "adminServiceCategories", userId] as const,
    adminServiceRequestTerms: (userId: string, buildingId: string) =>
      ["building", buildingId, "adminServiceRequestTerms", userId] as const,
    adminIncidentReports: (userId: string, buildingId: string, tab: string) =>
      ["building", buildingId, "adminIncidentReports", userId, tab] as const,
    adminAmenityBookings: (userId: string, buildingId: string, tab: string) =>
      ["building", buildingId, "adminAmenityBookings", userId, tab] as const,
    adminAmenitySettings: (userId: string, buildingId: string) =>
      ["building", buildingId, "adminAmenitySettings", userId] as const,
    adminSuggestions: (userId: string, buildingId: string) =>
      ["building", buildingId, "adminSuggestions", userId] as const,
    adminUnitsUsers: (userId: string, buildingId: string, tab: string) =>
      ["building", buildingId, "adminUnitsUsers", userId, tab] as const,
    residentServiceRequests: (userId: string, buildingId: string) =>
      ["building", buildingId, "residentServiceRequests", userId] as const,
    residentIncidentReports: (userId: string, buildingId: string) =>
      ["building", buildingId, "residentIncidentReports", userId] as const,
    residentDocuments: (userId: string, buildingId: string, folderId: string) =>
      ["building", buildingId, "residentDocuments", userId, folderId] as const,
    residentAmenityBookings: (userId: string, buildingId: string) =>
      ["building", buildingId, "residentAmenityBookings", userId] as const,
  },
};
