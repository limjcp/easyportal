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
} from "../../resident/data/types";
import { seedAdminNews } from "../../admin/data/mock/adminNews";
import { seedAdminServiceRequests } from "../../admin/data/mock/adminServiceRequests";
import { seedAdminSuggestions } from "../../admin/data/mock/adminSuggestions";
import { seedBoardApprovals } from "../../admin/data/mock/boardApprovals";
import { seedBuildingDefinition } from "../../admin/data/mock/buildingDefinition";
import { seedBuildingLockers } from "../../admin/data/mock/buildingLockers";
import { seedBuildingParking } from "../../admin/data/mock/buildingParking";
import { seedBuildingReminders } from "../../admin/data/mock/buildingReminders";
import { seedBuildingTaxSettings } from "../../admin/data/mock/buildingTaxSettings";
import { seedBuildingUnitGroups } from "../../admin/data/mock/buildingUnitGroups";
import { seedBuildingUnits } from "../../admin/data/mock/buildingUnits";
import { seedGalleryAlbums } from "../../admin/data/mock/galleryAlbums";
import { seedCustomPortalTiles, seedPortalModules, seedPortalTileSettings } from "../../admin/data/mock/portalModules";
import { seedPortalImages } from "../../admin/data/mock/portalImages";
import { seedBuildingAdmins } from "../../admin/data/mock/buildingAdmins";
import { seedBuildingCertificateRequests } from "../../admin/data/mock/buildingStatusCertificates";
import { seedBuildingExternalData } from "../../admin/data/mock/externalData";
import { seedBuildingRolePermissions } from "../../admin/data/mock/buildingPermissions";
import { seedPortalSettings } from "../../admin/data/mock/portalSettings";
import { seedProfileFieldOptions } from "../../admin/data/mock/profileFields";
import { seedPublicPortalDocuments } from "../../admin/data/mock/publicPortalDocuments";
import { seedPublicPortalSettings } from "../../admin/data/mock/publicPortalSettings";
import { seedRegistrationFieldOptions } from "../../admin/data/mock/registrationFields";
import { seedServiceCategories } from "../../admin/data/mock/serviceCategories";
import { seedPolls } from "../../admin/data/mock/polls";
import { seedAgmMeetings } from "../../admin/data/mock/agmMeetings";
import {
  seedBoardElections,
  seedElectionBallots,
  seedElectionCandidates,
  seedElectionPositions,
} from "../../admin/data/mock/boardElections";
import { seedStatusCertificates } from "../../resident/data/mock/statusCertificates";
import { seedAdminDocuments } from "../../admin/data/mock/adminDocuments";
import { seedDocumentFolders } from "../../admin/data/mock/documentFolders";
import { seedAdminEvents } from "../../admin/data/mock/adminEvents";
import { seedRsvps } from "../../resident/data/mock/events";
import { seedResidentDetails } from "../../resident/data/mock/residentDetails";
import { seedBoardMembers } from "../../resident/data/mock/boardMembers";
import { seedBoardMemberApplications } from "../../resident/data/mock/boardMemberApplications";
import { seedBoardFaqs } from "../../resident/data/mock/boardFaqs";
import { seedFireSafetySubmissions } from "../../resident/data/mock/fireSafetySubmissions";
import { seedNotificationPreferences, seedUser } from "../../resident/data/mock/user";
import { seedAdminNotificationPreferences, seedAdminUser } from "../../admin/data/mock/adminUser";
import { seedParkingRequests } from "../../resident/data/mock/parkingRequests";
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

export const store = {
  adminNews: [...seedAdminNews] as AdminNewsItem[],
  polls: [...seedPolls] as Poll[],
  pollAttachments: [] as PollAttachment[],
  agmMeetings: [...seedAgmMeetings] as AgmMeeting[],
  serviceRequests: [...seedAdminServiceRequests] as AdminServiceRequest[],
  serviceCategories: [...seedServiceCategories] as ServiceRequestCategory[],
  serviceRequestTerms: `By submitting a service request, you agree to allow property management and authorized personnel access to your unit as specified. Emergency requests will be prioritized. The corporation is not responsible for items within your unit unless caused by common element failure.

Please ensure all contact information is accurate. Requests submitted outside business hours will be reviewed on the next business day.`,
  suggestions: [...seedAdminSuggestions] as AdminSuggestion[],
  statusCertificates: [...seedStatusCertificates] as StatusCertificate[],
  incidentReports: [] as AdminIncidentReport[],
  incidentCategories: [] as IncidentReportCategory[],
  incidentContactEmails: [] as IncidentContactEmail[],
  notificationPrefs: [...seedNotificationPreferences] as NotificationPreference[],
  residentUser: { ...seedUser },
  adminNotificationPrefs: [...seedAdminNotificationPreferences] as NotificationPreference[],
  documentFolders: [...seedDocumentFolders] as DocumentFolder[],
  documents: [...seedAdminDocuments] as DocumentFile[],
  events: [...seedAdminEvents] as CalendarEvent[],
  rsvps: [...seedRsvps] as RsvpItem[],
  faqs: [...seedFaqs] as FaqItem[],
  galleryAlbums: [...seedGalleryAlbums] as GalleryAlbum[],
  boardApprovals: [...seedBoardApprovals] as BoardApproval[],
  buildingDefinition: { ...seedBuildingDefinition } as BuildingDefinition,
  buildingTaxSettings: { ...seedBuildingTaxSettings } as BuildingTaxSettings,
  buildingUnits: [...seedBuildingUnits] as BuildingUnitGroup[],
  buildingUnitGroups: [...seedBuildingUnitGroups] as BuildingUnitGroupDefinition[],
  buildingParking: [...seedBuildingParking] as BuildingParkingGroup[],
  buildingParkingPricing: {
    regularMonthlyCost: "$120.00",
    visitorMonthlyCost: "$30.00",
  } as BuildingParkingPricing,
  buildingLockers: [...seedBuildingLockers] as BuildingLockerGroup[],
  buildingReminders: [...seedBuildingReminders] as BuildingReminder[],
  portalSettings: { ...seedPortalSettings } as PortalSettings,
  buildingExternalData: { ...seedBuildingExternalData } as BuildingExternalData,
  buildingAdmins: [...seedBuildingAdmins] as BuildingAdmin[],
  buildingCertificateRequests: [...seedBuildingCertificateRequests] as MasterReportRow[],
  buildingRolePermissions: seedBuildingRolePermissions() as BuildingRolePermissionDefaults[],
  publicPortalSettings: { ...seedPublicPortalSettings } as PublicPortalSettings,
  portalImages: [...seedPortalImages] as PortalImage[],
  publicPortalDocuments: [...seedPublicPortalDocuments] as PublicPortalDocument[],
  portalModules: seedPortalModules.map((m) => ({ ...m })) as PortalModuleConfig[],
  portalTileSettings: { ...seedPortalTileSettings } as PortalTileSettings,
  customPortalTiles: [...seedCustomPortalTiles] as CustomPortalTile[],
  companyMasterPortalModules: seedPortalModules.map((m) => ({ ...m })) as PortalModuleConfig[],
  companyMasterCustomPortalTiles: [...seedCustomPortalTiles] as CustomPortalTile[],
  companyMasterPrimaryTileLimit: DEFAULT_PRIMARY_TILE_LIMIT,
  registrationFieldOptions: seedRegistrationFieldOptions.map((f) => ({ ...f })) as RegistrationFieldOption[],
  profileFieldOptions: seedProfileFieldOptions.map((f) => ({ ...f })) as ProfileFieldOption[],
  residentDetails: structuredClone(seedResidentDetails) as ResidentProfileDetails,
  boardMembers: [...seedBoardMembers] as BoardMember[],
  boardFaqs: [...seedBoardFaqs] as BoardFaqItem[],
  boardMemberApplications: [...seedBoardMemberApplications] as BoardMemberApplication[],
  boardElections: [...seedBoardElections] as BoardElection[],
  electionPositions: [...seedElectionPositions] as ElectionPosition[],
  electionCandidates: [...seedElectionCandidates] as ElectionCandidate[],
  electionBallots: [...seedElectionBallots] as ElectionBallot[],
  fireSafetySubmissions: [...seedFireSafetySubmissions] as FireSafetySubmission[],
  parkingRequests: [...seedParkingRequests] as ParkingRequest[],
  consultationSubmissions: [] as ConsultationSubmission[],
  residentPersonalTileLayout: null as ArrangeTile[] | null,
  adminUser: { ...seedAdminUser } as AdminUser,
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
