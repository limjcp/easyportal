import type {
  AdminUser,
  AdminIncidentReport,
  AdminNewsItem,
  AdminServiceRequest,
  AdminSuggestion,
  BoardApproval,
  BuildingDefinition,
  BuildingLockerGroup,
  BuildingParkingGroup,
  BuildingParkingPricing,
  BuildingReminder,
  BuildingExternalData,
  BuildingAdmin,
  BuildingRolePermissionDefaults,
  BuildingTaxSettings,
  BuildingUnitGroup,
  BuildingUnitGroupDefinition,
  CalendarEvent,
  AgmMeeting,
  DocumentFile,
  DocumentFolder,
  FaqItem,
  GalleryAlbum,
  IncidentContactEmail,
  IncidentReportCategory,
  NotificationPreference,
  CustomPortalTile,
  PortalImage,
  PortalModuleConfig,
  PortalSettings,
  PortalTileSettings,
  ProfileFieldOption,
  PublicPortalDocument,
  PublicPortalSettings,
  RegistrationFieldOption,
  BoardMember,
  BoardFaqItem,
  BoardMemberApplication,
  FireSafetySubmission,
  ResidentProfileDetails,
  Poll,
  PollAttachment,
  RsvpItem,
  ServiceRequestCategory,
  StatusCertificate,
  MasterReportRow,
  BoardElection,
  ElectionPosition,
  ElectionCandidate,
  ElectionBallot,
  ParkingRequest,
  ConsultationSubmission,
  ResidentUser,
} from "../../resident/data/types";
import {
  BUILDING_ADMIN_ROLES,
  createDefaultBuildingPermissionsForRole,
} from "../../admin/data/buildingPermissions";
import { DEFAULT_PROFILE_FIELD_OPTIONS } from "../../data/defaults/profileFieldOptions";
import {
  DEFAULT_PORTAL_MODULES,
  DEFAULT_PORTAL_TILE_SETTINGS,
} from "../../data/defaults/portalModules";
import type { ArrangeTile } from "../../resident/data/portalTileLayout";
import { DEFAULT_PRIMARY_TILE_LIMIT, normalizePortalLayout } from "../../resident/data/portalTileLayout";

export const seedFaqs: FaqItem[] = [
  {
    id: "1",
    question: "How do I submit a service request?",
    answer: "Log in to the resident portal and navigate to Service Requests, then click Add New.",
  },
  {
    id: "2",
    question: "Where can I find the building rules?",
    answer: "Documents are available under the Documents section in the resident portal.",
  },
];

const emptyBuildingDefinition: BuildingDefinition = {
  condoName: "",
  corporation: "",
  corpNumber: "",
  address: "",
  multiAddressProperty: false,
  city: "",
  postalZip: "",
  country: "",
  province: "",
  propertyPhone: "",
  propertyEmail: "",
  accountingEmail: "",
  billingEmail: "",
  sparcEmail: "",
  buildingTypes: [],
  buildingFeatures: [],
  amenities: [],
  commonAreas: [],
  linkedBuildingIds: [],
};

const emptyPortalSettings: PortalSettings = {
  enableDocuments: true,
  enableEvents: true,
  enableGallery: true,
  enableFaq: true,
  enableServiceRequests: true,
  enableSuggestions: true,
  enableIncidentReports: true,
  defaultLanguage: "English",
};

const emptyPublicPortalSettings: PublicPortalSettings = {
  portalThemeColor: "#3278f7",
  subdomain: "",
  aboutBuilding: "",
  enableLobbyDisplay: false,
  lobbyDisplayUrl: "",
  twitterUrl: "",
  facebookUrl: "",
  instaUrl: "",
  youTubeUrl: "",
};

const emptyBuildingExternalData: BuildingExternalData = {
  stripe: { connected: false, country: "", accountNumber: "", routingNumber: "", currency: "" },
  quickbooks: { qboConnected: false },
};

const emptyResidentDetails: ResidentProfileDetails = {
  parkingSpots: [],
  lockers: [],
  keyFobs: [],
  vehicles: [],
  guestList: [],
  bikeSpaces: [],
  pets: [],
  purchaseDateMaintFees: { purchaseDate: "" },
};

const emptyResidentUser: ResidentUser = {
  id: "",
  name: "",
  buildingId: "",
  buildingName: "",
  unit: "",
  email: "",
  phone: "",
  role: "Resident",
};

const emptyAdminUser: AdminUser = {
  id: "",
  displayName: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "",
  title: "",
  managementCompany: "",
  timezone: "America/Toronto",
};

const emptyBuildingTaxSettings: BuildingTaxSettings = {
  masterTaxRate: null,
  serviceRequestsTaxable: false,
  serviceRequestsTaxRate: null,
};

const buildingRolePermissions: BuildingRolePermissionDefaults[] = BUILDING_ADMIN_ROLES.map((r) => ({
  role: r.label,
  permissions: createDefaultBuildingPermissionsForRole(r.label),
}));

export const store = {
  adminNews: [] as AdminNewsItem[],
  polls: [] as Poll[],
  pollAttachments: [] as PollAttachment[],
  agmMeetings: [] as AgmMeeting[],
  serviceRequests: [] as AdminServiceRequest[],
  serviceCategories: [] as ServiceRequestCategory[],
  serviceRequestTerms: `By submitting a service request, you agree to allow property management and authorized personnel access to your unit as specified. Emergency requests will be prioritized. The corporation is not responsible for items within your unit unless caused by common element failure.

Please ensure all contact information is accurate. Requests submitted outside business hours will be reviewed on the next business day.`,
  suggestions: [] as AdminSuggestion[],
  statusCertificates: [] as StatusCertificate[],
  incidentReports: [] as AdminIncidentReport[],
  incidentCategories: [] as IncidentReportCategory[],
  incidentContactEmails: [] as IncidentContactEmail[],
  notificationPrefs: [] as NotificationPreference[],
  residentUser: { ...emptyResidentUser },
  adminNotificationPrefs: [] as NotificationPreference[],
  documentFolders: [] as DocumentFolder[],
  documents: [] as DocumentFile[],
  events: [] as CalendarEvent[],
  rsvps: [] as RsvpItem[],
  faqs: [...seedFaqs] as FaqItem[],
  galleryAlbums: [] as GalleryAlbum[],
  boardApprovals: [] as BoardApproval[],
  buildingDefinition: { ...emptyBuildingDefinition },
  buildingTaxSettings: { ...emptyBuildingTaxSettings },
  buildingUnits: [] as BuildingUnitGroup[],
  buildingUnitGroups: [] as BuildingUnitGroupDefinition[],
  buildingParking: [] as BuildingParkingGroup[],
  buildingParkingPricing: {
    regularMonthlyCost: "",
    visitorMonthlyCost: "",
  } as BuildingParkingPricing,
  buildingLockers: [] as BuildingLockerGroup[],
  buildingReminders: [] as BuildingReminder[],
  portalSettings: { ...emptyPortalSettings },
  buildingExternalData: { ...emptyBuildingExternalData },
  buildingAdmins: [] as BuildingAdmin[],
  buildingCertificateRequests: [] as MasterReportRow[],
  buildingRolePermissions,
  publicPortalSettings: { ...emptyPublicPortalSettings },
  portalImages: [] as PortalImage[],
  publicPortalDocuments: [] as PublicPortalDocument[],
  portalModules: DEFAULT_PORTAL_MODULES.map((m) => ({ ...m })) as PortalModuleConfig[],
  portalTileSettings: { ...DEFAULT_PORTAL_TILE_SETTINGS } as PortalTileSettings,
  customPortalTiles: [] as CustomPortalTile[],
  companyMasterPortalModules: DEFAULT_PORTAL_MODULES.map((m) => ({ ...m })) as PortalModuleConfig[],
  companyMasterCustomPortalTiles: [] as CustomPortalTile[],
  companyMasterPrimaryTileLimit: DEFAULT_PRIMARY_TILE_LIMIT,
  registrationFieldOptions: [] as RegistrationFieldOption[],
  profileFieldOptions: DEFAULT_PROFILE_FIELD_OPTIONS.map((f) => ({ ...f })) as ProfileFieldOption[],
  residentDetails: structuredClone(emptyResidentDetails) as ResidentProfileDetails,
  boardMembers: [] as BoardMember[],
  boardFaqs: [] as BoardFaqItem[],
  boardMemberApplications: [] as BoardMemberApplication[],
  boardElections: [] as BoardElection[],
  electionPositions: [] as ElectionPosition[],
  electionCandidates: [] as ElectionCandidate[],
  electionBallots: [] as ElectionBallot[],
  fireSafetySubmissions: [] as FireSafetySubmission[],
  parkingRequests: [] as ParkingRequest[],
  consultationSubmissions: [] as ConsultationSubmission[],
  residentPersonalTileLayout: null as ArrangeTile[] | null,
  adminUser: { ...emptyAdminUser },
};

const normalizedBuildingLayout = normalizePortalLayout(
  store.portalModules,
  store.customPortalTiles,
  store.portalTileSettings.primaryTileLimit
);
store.portalModules = normalizedBuildingLayout.modules;
store.customPortalTiles = normalizedBuildingLayout.customTiles;

const normalizedMasterLayout = normalizePortalLayout(
  store.companyMasterPortalModules,
  store.companyMasterCustomPortalTiles,
  store.companyMasterPrimaryTileLimit
);
store.companyMasterPortalModules = normalizedMasterLayout.modules;
store.companyMasterCustomPortalTiles = normalizedMasterLayout.customTiles;
