export type EmailStatus = "delivered" | "bounced" | "pending";

export interface ResidentUser {
  id: string;
  name: string;
  buildingId: string;
  buildingName: string;
  buildingAddress?: string;
  unit: string;
  email: string;
  phone: string;
  role: string;
  birthMonth?: number;
  birthDay?: number;
}

export type ConsultationCondoHealth = "excellent" | "good" | "fair" | "poor";
export type ConsultationManagementExperience = "very-good" | "good" | "needs-improvement" | "poor";
export type ConsultationChangeIntent = "yes" | "no" | "not-sure";
export type ConsultationCondoType = "high-rise" | "townhouse" | "mixed-use" | "commercial-residential" | "other";
export type ConsultationUnitCount = "under-50" | "50-100" | "100-250" | "250-plus";
export type ConsultationYourRole =
  | "board-president"
  | "board-director"
  | "treasurer"
  | "owner"
  | "other";
export type ConsultationRegion = "gta" | "kitchener-waterloo" | "southwestern-ontario" | "other-ontario";
export type ConsultationTopConcern =
  | "communication"
  | "financial-reporting"
  | "vendor-execution"
  | "compliance"
  | "fees"
  | "other";

export interface ConsultationSurveyAnswers {
  condoType: ConsultationCondoType;
  unitCount: ConsultationUnitCount;
  yourRole: ConsultationYourRole;
  region: ConsultationRegion;
  condoHealth: ConsultationCondoHealth;
  managementExperience: ConsultationManagementExperience;
  topConcern: ConsultationTopConcern;
  consideringManagementChange: ConsultationChangeIntent;
  /** @deprecated Legacy submissions only */
  currentPainPoint?: string;
}

export interface ConsultationSubmission {
  id: string;
  submittedAt: string;
  name: string;
  corporationNumber: string;
  municipalAddress: string;
  email: string;
  phone: string;
  survey: ConsultationSurveyAnswers;
  status: "new" | "contacted";
  unread: boolean;
}

export type CreateConsultationSubmissionInput = Omit<
  ConsultationSubmission,
  "id" | "submittedAt" | "status" | "unread"
>;

export interface AdminUser {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  title: string;
  managementCompany: string;
  unit?: string;
  timezone: string;
  telHome?: string;
  telMobile?: string;
  telBusiness?: string;
  avatarUrl?: string;
}

export type UpdateAdminUserInput = Pick<
  AdminUser,
  | "firstName"
  | "lastName"
  | "email"
  | "timezone"
  | "telHome"
  | "telMobile"
  | "telBusiness"
  | "avatarUrl"
>;

export interface NewsItem {
  id: string;
  title: string;
  date: string;
  body: string;
  imageUrl?: string;
  attachmentName?: string;
  attachmentUrl?: string;
}

export type DocumentFolderSection = "resident-portal" | "admin-only";

export interface DocumentFolder {
  id: string;
  name: string;
  section?: DocumentFolderSection;
}

export interface DocumentFile {
  id: string;
  folderId: string;
  fileType: string;
  title: string;
  date: string;
  filename: string;
  size: string;
  shownTo: string;
  downloadCount: number;
}

export type CreateDocumentInput = Omit<DocumentFile, "id">;

export interface DocumentStorageStats {
  usedMb: number;
  totalMb: number;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface GalleryAlbum {
  id: string;
  title: string;
  coverUrl?: string;
  photoCount: number;
}

export type AdminEventType = "once" | "recurring" | "paid";
export type AdminEventStatus = "Draft" | "Active";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  description?: string;
  eventType?: AdminEventType;
  status?: AdminEventStatus;
  created?: string;
  location?: string;
  showTo?: string;
  adminOnly?: boolean;
  occurrence?: string;
  day?: string;
}

export type CreateCalendarEventInput = Omit<CalendarEvent, "id">;

export interface RsvpItem {
  id: string;
  eventTitle: string;
  date: string;
  status: string;
}

export interface EmailRecord {
  id: string;
  date: string;
  subject: string;
  status: EmailStatus;
  body: string;
}

export interface NotificationPreference {
  id: string;
  label: string;
  enabled: boolean;
}

export interface ServiceRequest {
  id: string;
  createdBy: string;
  createdAt: string;
  contact: string;
  location: string;
  severity: string;
  category: string;
  description: string;
  status: string;
  unread?: boolean;
  pendingReply?: boolean;
}

export interface ResidentServiceRequestDetail extends ServiceRequest {
  visibility: string;
  permissionToEnter: string;
  permissionNotes: string;
  submittedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  publicComments: Comment[];
  attachments: IncidentReportAttachment[];
}

export type CreateServiceRequestInput = {
  contact: string;
  location: string;
  visibility: string;
  permissionToEnter: string;
  permissionNotes: string;
  severity: string;
  category: string;
  description: string;
  files?: File[];
};

export interface IncidentReport {
  id: string;
  incidentDate: string;
  incidentTime: string;
  severity: string;
  reportType: string;
  location: string;
  description: string;
  status: string;
  archived?: boolean;
}

export interface ResidentIncidentReportDetail extends IncidentReport {
  submittedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  pendingReplyLabel?: string;
  publicComments: Comment[];
  attachments: IncidentReportAttachment[];
}

export type CreateIncidentReportInput = {
  incidentDate: string;
  incidentTime: string;
  severity: string;
  reportType: string;
  visibility: string;
  location: string;
  description: string;
  files?: File[];
};

export interface Suggestion {
  id: string;
  text: string;
  createdAt: string;
  status: string;
}

export interface CreateSuggestionInput {
  text: string;
}

export interface StatusCertificate {
  id: string;
  certificateType: string;
  unit: string;
  requestedBy: string;
  createdAt: string;
  status: string;
  notes: string;
  rushProcessing: boolean;
}

export type CreateStatusCertificateInput = {
  certificateType: string;
  notes: string;
  rushProcessing: boolean;
};

export type ContentStatus = "draft" | "active" | "archived";

export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  visibility: "admin" | "public";
}

export interface EmailNoticeStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  spamReports: number;
  rejections: number;
  delayed: number;
}

export interface NewsEditHistoryEntry {
  status: string;
  date: string;
  user: string;
  action: string;
  notification?: string;
}

export interface AdminNewsItem extends NewsItem {
  status: ContentStatus;
  expires?: string;
  emailDelivered: number;
  emailTotal: number;
  emailStats?: EmailNoticeStats;
  noticeHistoryId?: string;
  postTime?: string;
  noNotifications: boolean;
  residentTypes: string[];
  adminCcTypes: string[];
  showToFilter: string;
  editHistory: NewsEditHistoryEntry[];
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
}

export type BoardApprovalVoteStatus =
  | "Approved"
  | "Disapproved"
  | "Tie Vote"
  | "Pending"
  | "No Votes Required";

export interface BoardApproval {
  id: string;
  title: string;
  description: string;
  created: string;
  closed?: string;
  archived: boolean;
  status: BoardApprovalVoteStatus;
  approvedVotes: number;
  disapprovedVotes: number;
  votes: string;
  vendor: string;
  type: string;
  amount: string;
  items: string;
  unread?: boolean;
}

export type CreateBoardApprovalInput = {
  title: string;
  description: string;
  vendor?: string;
  type?: string;
  amount?: string;
  items?: string;
};

export interface AdminServiceRequest extends ServiceRequest {
  assignedTo: string;
  resident: string;
  unit: string;
  visibility: string;
  permissionToEnter: string;
  permissionNotes: string;
  adminSeverity: string;
  adminCategory: string;
  actionRequired: boolean;
  archived: boolean;
  pendingReply: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  adminComments: Comment[];
  publicComments: Comment[];
  attachments: IncidentReportAttachment[];
}

export type CreateAdminServiceRequestInput = {
  assignedTo: string;
  resident: string;
  unit?: string;
  visibility: string;
  contact: string;
  location: string;
  permissionToEnter: string;
  permissionNotes: string;
  severity: string;
  category: string;
  description: string;
  files?: File[];
};

export interface ServiceRequestCategory {
  id: string;
  name: string;
  status: "active" | "inactive";
  usageCount: number;
}

export interface AdminIncidentReport extends IncidentReport {
  archived: boolean;
  createdBy: string;
  submittedAt: string;
  unit: string;
  resident: string;
  visibility: string;
  assignedToAdmin: string;
  adminSeverity: string;
  adminType: string;
  pendingReply: string;
  resolutionTime?: string;
  unread?: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  adminComments: Comment[];
  publicComments: Comment[];
  attachments: IncidentReportAttachment[];
}

export type CreateAdminIncidentReportInput = {
  incidentDate: string;
  incidentTime: string;
  severity: string;
  reportType: string;
  location: string;
  description: string;
  status: "Draft" | "Pending" | "Resolved";
  unit?: string;
  assignedToAdmin?: string;
};

export interface IncidentReportCategory {
  id: string;
  status: "active" | "inactive";
  name: string;
  usageCount: number;
}

export interface IncidentContactEmail {
  id: string;
  email: string;
  status: "active" | "inactive";
}

export interface AdminSuggestion {
  id: string;
  text: string;
  createdAt: string;
  status: string;
  visibility: string;
  createdBy: string;
  unit: string;
  unread?: boolean;
  adminComments: Comment[];
  publicComments: Comment[];
  attachments: string[];
}

export type CreateAdminSuggestionInput = {
  text: string;
  visibility: string;
  createdBy: string;
  unit: string;
};

export type PollStatus = "draft" | "active" | "archived";
export type PollAttachmentKind = "pdf" | "image";
export type AgmMeetingStatus = "draft" | "active" | "ended";

export interface PollQuestion {
  id: string;
  sortOrder: number;
  question: string;
  type: string;
  answerOptions: string;
}

export interface PollAttachment {
  id: string;
  pollId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  kind: PollAttachmentKind;
  sourceUrl: string;
  createdAt: string;
}

export interface AgmMeeting {
  id: string;
  title: string;
  scheduledDate: string;
  location: string;
  notes?: string;
  status: AgmMeetingStatus;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
}

export interface Poll {
  id: string;
  title: string;
  status: PollStatus;
  createdAt: string;
  publishedAt?: string;
  expiresAt?: string;
  responseCount: number;
  noNotifications: boolean;
  privacy: string;
  residentTypes: string[];
  showToFilter: string;
  questions: PollQuestion[];
  agmMeetingId?: string;
}

export type CreatePollInput = {
  title: string;
};

export type SubmitPollResponseInput = {
  pollId: string;
  questionId: string;
  selectedOption: string;
};

export interface PollResponse {
  id: string;
  pollId: string;
  questionId: string;
  selectedOption: string;
  createdAt: string;
}

export type PollOptionResult = {
  label: string;
  count: number;
  percentage: number;
};

export type PollQuestionResult = {
  questionId: string;
  question: string;
  sortOrder: number;
  totalResponses: number;
  options: PollOptionResult[];
};

export type PollResponseVoter = {
  responseId: string;
  questionId: string;
  question: string;
  voterName: string;
  unitLabel: string;
  selectedOption: string;
  submittedAt: string;
};

export type PollResults = {
  pollId: string;
  privacy: string;
  totalResponses: number;
  questions: PollQuestionResult[];
  voters: PollResponseVoter[];
};

// Backwards compatibility while Survey UI is being renamed to Polls.
export type SurveyStatus = PollStatus;
export type SurveyQuestion = PollQuestion;
export type Survey = Poll;
export type CreateSurveyInput = CreatePollInput;

export type BoardElectionStatus = "draft" | "scheduled" | "active" | "closed" | "archived";

export interface BoardElection {
  id: string;
  title: string;
  description: string;
  status: BoardElectionStatus;
  opensAt: string;
  closesAt: string;
  createdAt: string;
  residentTypes: string[];
  anonymous: boolean;
}

export interface ElectionPosition {
  id: string;
  electionId: string;
  title: string;
  sortOrder: number;
  seatsAvailable: number;
}

export interface ElectionCandidate {
  id: string;
  positionId: string;
  name: string;
  unit: string;
  bio?: string;
  applicationId?: string;
}

export interface ElectionBallot {
  id: string;
  electionId: string;
  positionId: string;
  unit: string;
  candidateId: string;
  votedAt: string;
}

export type CreateBoardElectionInput = {
  title: string;
};

export type CreateElectionPositionInput = {
  title: string;
  sortOrder?: number;
  seatsAvailable?: number;
};

export type CreateElectionCandidateInput = {
  name: string;
  unit: string;
  bio?: string;
  applicationId?: string;
};

export type CastElectionVoteInput = {
  electionId: string;
  positionId: string;
  candidateId: string;
};

export type ElectionPositionResult = {
  positionId: string;
  positionTitle: string;
  totalBallots: number;
  candidates: { candidateId: string; name: string; unit: string; votes: number }[];
};

export type ElectionResults = {
  electionId: string;
  eligibleUnits: number;
  positions: ElectionPositionResult[];
};

export interface BuildingDefinition {
  condoName: string;
  corporation: string;
  corpNumber: string;
  address: string;
  multiAddressProperty: boolean;
  city: string;
  postalZip: string;
  country: string;
  province: string;
  propertyPhone: string;
  propertyEmail: string;
  accountingEmail: string;
  billingEmail: string;
  visitorParkingOvernightEmail?: string;
  buildingTypes: string[];
  buildingFeatures: string[];
  amenities: string[];
  commonAreas: string[];
  linkedBuildingIds: string[];
  imageUrl?: string;
}

export interface BuildingTaxSettings {
  masterTaxRate: number | null;
  serviceRequestsTaxable: boolean;
  serviceRequestsTaxRate: number | null;
}

export interface BuildingUnitGroup {
  id: string;
  floorArea: string;
  units: string[];
  occupiedUnits?: string[];
}

export interface BuildingUnitGroupDefinition {
  id: string;
  name: string;
  unitIds: string[];
}

export type UnitsUsersTab = "current" | "pending" | "unoccupied" | "archived";

export type UnitsUsersResidentType =
  | "Owner"
  | "Tenant"
  | "Absentee Owner"
  | "Occupant"
  | "Unit Manager";

export type UnitsUsersAccountStatus =
  | "Record-Only"
  | "Awaiting Activation"
  | "Pending Unit Assignment"
  | "Activated"
  | "Archived"
  | "Deleted";

export type UnitsUsersStatusTag = "QB Linked" | "CC Linked";

export interface UnitsUsersCurrentRow {
  id: string;
  unitId: string;
  unitLabel: string;
  status: UnitsUsersAccountStatus;
  statusTags: UnitsUsersStatusTag[];
  name: string;
  type: UnitsUsersResidentType;
  email: string;
  phone?: string;
  dateCreated: string;
  lastLogin?: string;
  parking?: string;
  lockers?: string;
  fobs?: string;
  vehicles?: string;
  pets?: string;
  buzzerCode?: string;
  bikeSpace?: string;
  specialNeeds?: string;
}

export interface UnitsUsersPendingRow {
  id: string;
  status: Extract<UnitsUsersAccountStatus, "Pending Unit Assignment" | "Awaiting Activation">;
  name: string;
  type: UnitsUsersResidentType;
  email: string;
}

export interface UnitsUsersUnoccupiedRow {
  id: string;
  unitId: string;
  unitLabel: string;
  owners: number;
  tenants: number;
  occupants: number;
  updatedAt: string;
}

export interface UnitsUsersArchivedRow {
  id: string;
  unitLabel?: string;
  status: Extract<UnitsUsersAccountStatus, "Archived" | "Deleted">;
  name: string;
  type: UnitsUsersResidentType;
  email: string;
  archivedAt: string;
}

export interface UnitsUsersUnitOccupant {
  userId: string;
  type: UnitsUsersResidentType;
  name: string;
  email: string;
  status: UnitsUsersAccountStatus;
  statusTags: UnitsUsersStatusTag[];
}

export interface UnitsUsersUnitDetail {
  id: string;
  unitLabel: string;
  serviceRequestsSubmitted: number;
  deliveriesPendingPickup: number;
  visitorsToUnit: number;
  incidentReportsByUsers: number;
  incidentReportsInvolvingUnit: number;
  incidentReportIdsByUsers: string[];
  incidentReportIdsInvolvingUnit: string[];
  occupants: UnitsUsersUnitOccupant[];
  insuranceCarrier?: string;
  insurancePolicyNumber?: string;
  parkingSpots: string[];
  lockers: string[];
  keyFobs: string[];
  vehicles: string[];
  guestList: string[];
  bikeSpaces: string[];
  pets: string[];
  documents: string[];
  purchaseDateMaintFees?: string;
  notes: string[];
  primaryOccupancyId?: string;
  profileDetails?: ResidentProfileDetails;
  occupancyProfiles?: ResidentProfileDetails[];
  occupancyProfileOccupancyIds?: string[];
}

export interface UnitsUsersUserDetail {
  id: string;
  unitLabel?: string;
  status: UnitsUsersAccountStatus;
  statusTags: UnitsUsersStatusTag[];
  name: string;
  firstName: string;
  lastName: string;
  type: UnitsUsersResidentType;
  email: string;
  timezone: string;
  homePhone?: string;
  mobilePhone?: string;
  businessPhone?: string;
  otherPhone?: string;
  homeAddressStreet?: string;
  homeAddressCity?: string;
  homeAddressProvince?: string;
  homeAddressPostal?: string;
  homeAddressCountry?: string;
  lastLogin?: string;
  buzzerCode?: string;
  role?: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
  allowClassifiedsPosting?: boolean;
  allowAmenityBooking?: boolean;
  allowAmenityBookingNotes?: string;
  allowVisitorParkingPermits?: boolean;
  allowVisitorParkingPermitsNotes?: string;
  specialNeeds?: boolean;
  specialNeedsNotes?: string;
  serviceRequestsSubmitted?: number;
  incidentReportsSubmitted?: number;
  parkingSpots?: string[];
  lockers?: string[];
  keyFobs?: string[];
  vehicles?: string[];
  guestList?: string[];
  emergencyContacts?: string[];
  bikeSpaces?: string[];
  pets?: string[];
  documents?: string[];
  purchaseDateMaintFees?: string;
  notes?: string[];
  profileDetails?: ResidentProfileDetails;
  portalModules?: Array<{
    moduleId: string;
    name: string;
    tileLabel: string;
    enabled: boolean;
    buildingEnabled?: boolean;
  }>;
  canAccessResidentPortal?: boolean;
  canAccessBuildingAdmin?: boolean;
  buildingAdminRoleLabel?: string;
  buildingMembershipId?: string;
  buildingAdminModules?: Array<{ moduleKey: string; label: string; enabled: boolean }>;
  quickBooksLinkedAccounts?: Array<{
    id: string;
    name: string;
    email: string;
    address: string;
    selected?: boolean;
  }>;
  accountBalance?: {
    reportDate: string;
    companyName: string;
    companyAddress: string;
    buildingName: string;
    unitAddress: string;
    transactions: Array<{
      id: string;
      date: string;
      type: string;
      dueDate: string;
      amount: string;
      remainingBalance: string;
    }>;
    aging: {
      current: string;
      days1To30: string;
      days31To60: string;
      days61To90: string;
      over90: string;
      amountDue: string;
    };
  };
}

export interface BuildingParkingGroup {
  id: string;
  floorArea: string;
  spaces: string[];
  visitorParking?: boolean;
}

export interface BuildingLockerGroup {
  id: string;
  floorArea: string;
  lockers: string[];
}

export interface BuildingReminder {
  id: string;
  title: string;
  body: string;
  recipients: string;
  schedule: string;
}

export type AddUnitRangeType = "all" | "even" | "odd";

export interface PortalSettings {
  enableDocuments: boolean;
  enableEvents: boolean;
  enableGallery: boolean;
  enableFaq: boolean;
  enableServiceRequests: boolean;
  enableSuggestions: boolean;
  enableIncidentReports: boolean;
  defaultLanguage: string;
}

export type ExternalDataTab = "stripe" | "quickbooks";

export interface BuildingStripeSettings {
  connected: boolean;
  country: string;
  accountNumber: string;
  routingNumber: string;
  currency: string;
}

export interface BuildingQuickBooksSettings {
  qboConnected: boolean;
  companyId?: string;
}

export interface BuildingExternalData {
  stripe: BuildingStripeSettings;
  quickbooks: BuildingQuickBooksSettings;
}

export type CreateStripeAccountInput = {
  country: string;
  accountNumber: string;
  routingNumber: string;
  currency: string;
};

export interface PublicPortalSettings {
  portalThemeColor: string;
  subdomain: string;
  aboutBuilding: string;
  buildingLogoUrl?: string;
  enableLobbyDisplay: boolean;
  lobbyDisplayUrl: string;
  twitterUrl: string;
  facebookUrl: string;
  instaUrl: string;
  youTubeUrl: string;
}

export type PortalImageKind = "public" | "resident";

export interface PortalImage {
  id: string;
  kind: PortalImageKind;
  url: string;
  sortOrder: number;
}

export interface PublicPortalDocument {
  id: string;
  title: string;
  filename: string;
  uploadedAt: string;
}

export interface PortalModuleConfig {
  moduleId: string;
  name: string;
  tileLabel: string;
  enabled: boolean;
  message: string;
  sortOrder?: number;
  layoutZone?: PortalTileLayoutZone;
  locked?: boolean;
}

export type PortalTileLayoutZone = "primary" | "compact";
export type PortalTileLayoutSource = "building" | "master";

export interface PortalTileSettings {
  portalTileOpacity: number;
  defaultLanguage: string;
  primaryTileLimit: number;
  useMasterLayout: boolean;
}

export interface CustomPortalTile {
  id: string;
  title: string;
  enabled: boolean;
  actionType: string;
  target?: string;
  sortOrder?: number;
  layoutZone?: PortalTileLayoutZone;
}

export interface RegistrationFieldOption {
  fieldKey: string;
  label: string;
  include: boolean;
  required: boolean;
  locked: boolean;
  note?: string;
}

export interface ProfileFieldOption {
  fieldKey: string;
  label: string;
  show: boolean;
  editable: boolean;
  locked: boolean;
  note?: string;
}

export interface ResidentKeyFob {
  id: string;
  fobNumber: string;
  description?: string;
}

export interface ResidentVehicle {
  id: string;
  make: string;
  model: string;
  year: string;
  plate: string;
  color: string;
}

export interface ResidentGuest {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface ResidentPet {
  id: string;
  name: string;
  type: string;
  breed?: string;
  weight?: string;
}

export interface ResidentPurchaseMaintFees {
  purchaseDate: string;
  monthlyFee?: string;
  notes?: string;
  quickBooksBalance?: string;
  nextPaymentAmount?: string;
  nextPaymentDate?: string;
  minimumOneTimePayment?: string;
  lastPaymentAmount?: string;
  lastPaymentDate?: string;
  paidMonths?: string[];
}

export type ParkingRequestType = "parking" | "visitor";
export type ParkingRequestStatus =
  | "waiting"
  | "approvedAwaitingPayment"
  | "paidAccepted"
  | "declined";

export type AmenityBookingType = "elevator" | "party_room";
export type BuildingAmenityResourceType = "party_room" | "elevator";
export type AmenityBookingStatus =
  | "pending"
  | "approvedAwaitingPayment"
  | "confirmed"
  | "declined"
  | "cancelled";

export interface BuildingAmenitySettings {
  partyRoomFee: string;
  elevatorInstructions: string;
  partyRoomInstructions: string;
}

export interface BuildingAmenityResource {
  id: string;
  name: string;
  locationLabel: string;
  resourceType: BuildingAmenityResourceType;
  isActive: boolean;
  sortOrder: number;
}

export interface AmenityBooking {
  id: string;
  residentId: string;
  residentName: string;
  unit: string;
  bookingType: AmenityBookingType;
  amenityResourceId?: string;
  amenityResourceName?: string;
  amenityResourceLocation?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  guestCount?: number;
  notes: string;
  status: AmenityBookingStatus;
  paymentAmount?: string;
  paymentAt?: string;
  adminNotes: string;
  unread: boolean;
  requestedAt: string;
  updatedAt: string;
}

export interface SubmitElevatorBookingInput {
  amenityResourceId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface SubmitPartyRoomBookingInput {
  amenityResourceId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  guestCount?: number;
  notes?: string;
}

export const PARKING_PAYMENT_AMOUNTS: Record<ParkingRequestType, string> = {
  parking: "$120.00",
  visitor: "$30.00",
};

export interface ParkingRequest {
  id: string;
  residentId: string;
  residentName: string;
  unit: string;
  requestType: ParkingRequestType;
  status: ParkingRequestStatus;
  requestedAt: string;
  assignedSpot?: string;
  approvedAt?: string;
  paymentAmount?: string;
  monthlyCost?: string;
  paymentTypeLabel?: string;
  paymentAt?: string;
  residentDecisionAt?: string;
  requestedForNights?: string;
  waitlistPosition?: number;
}

export interface BuildingParkingPricing {
  regularMonthlyCost: string;
  visitorMonthlyCost: string;
}

export interface ResidentProfileDetails {
  parkingSpots: string[];
  lockers: string[];
  keyFobs: ResidentKeyFob[];
  vehicles: ResidentVehicle[];
  guestList: ResidentGuest[];
  bikeSpaces: string[];
  pets: ResidentPet[];
  purchaseDateMaintFees: ResidentPurchaseMaintFees;
}

export type ResidentDetailSection = keyof ResidentProfileDetails;

export type ResidentDetailSectionData = ResidentProfileDetails[ResidentDetailSection];

export interface BoardMember {
  id: string;
  name: string;
  unit: string;
  role: string;
  termEndDate: string;
}

export interface BoardFaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface BoardMemberApplication {
  id: string;
  residentName: string;
  unit: string;
  email: string;
  phone: string;
  statement: string;
  submittedAt: string;
  status: "Submitted" | "Under Review" | "Approved" | "Declined";
  unread?: boolean;
}

export type CreateBoardMemberApplicationInput = Omit<
  BoardMemberApplication,
  "id" | "submittedAt" | "status" | "unread"
>;

export interface FireSafetySubmission {
  id: string;
  unit: string;
  uploadedAt: string;
  photoDataUrl: string;
  notes?: string;
}

export type CreateFireSafetyPhotoInput = {
  unit: string;
  photoDataUrl: string;
  notes?: string;
};

export interface PortalConfig {
  publicPortalSettings: PublicPortalSettings;
  portalImages: PortalImage[];
  publicPortalDocuments: PublicPortalDocument[];
  portalModules: PortalModuleConfig[];
  portalTileSettings: PortalTileSettings;
  customPortalTiles: CustomPortalTile[];
  tileLayoutSource: PortalTileLayoutSource;
  registrationFieldOptions: RegistrationFieldOption[];
  profileFieldOptions: ProfileFieldOption[];
}

// --- Company portal ---

export type LoginPortalRole = "resident" | "company" | "building" | "vendor";

export type CompanyRole =
  | "Company Owner"
  | "Company Administrator"
  | "Company Accountant"
  | "Property Manager"
  | "Property Administrator"
  | "Board Member"
  | "Resident (Admin)"
  | "Concierge"
  | "Gatehouse Keeper"
  | "Superintendent"
  | "Resident";

export interface CompanyUser {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  role: CompanyRole;
  managementCompany: string;
  timezone?: string;
  telHome?: string;
  telMobile?: string;
  telWork?: string;
  avatarUrl?: string;
}

export interface ManagementCompanyProfile {
  id: string;
  companyName: string;
  address: string;
  city: string;
  postalZip: string;
  country: string;
  provinceState: string;
  timezone: string;
  companyEmail: string;
  tel1: string;
  tel2: string;
  fax: string;
  logoUrl?: string;
}

export type UpdateCompanyUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  timezone: string;
  telHome?: string;
  telMobile?: string;
  telWork?: string;
};

export type UpdateManagementCompanyInput = {
  companyName: string;
  address: string;
  city: string;
  postalZip: string;
  country: string;
  provinceState: string;
  timezone: string;
  companyEmail: string;
  tel1: string;
  tel2?: string;
  fax?: string;
};

export interface CompanyBuilding {
  id: string;
  /** Short code shown in bold (e.g. ECC3, SCC148) */
  code: string;
  name: string;
  address: string;
  /** Legacy condo line, e.g. (SCC 148) 500 Essa Road */
  condoLine?: string;
  cityProvincePostal?: string;
  /** Comma-separated admin names for buildings list */
  admins?: string;
  unitsCount?: number;
  adminsCount?: number;
  usersCount?: number;
  imageUrl?: string;
  subscriptionPackage: string;
  status: "active" | "inactive";
  lastActivity?: string;
}

export interface CompanyMasterReportStats {
  communities: number;
  owners: number;
  activatedUsers: number;
}

export interface BuildingTotalRow {
  id: string;
  subscription: string;
  corp: string;
  name: string;
  address: string;
  owners: number;
  activatedUsers: number;
}

export interface CompanyEmployee {
  id: string;
  membershipId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: CompanyRole;
  assignedBuildingIds: string[];
  lastLogin?: string;
}

export interface RoleNameOverride {
  defaultRole: string;
  customName: string;
}

export type PermissionAction = "create" | "view" | "edit" | "delete" | "archive";

export interface PermissionModuleRow {
  moduleKey: string;
  label: string;
  create: boolean;
  view: boolean;
  edit: boolean;
  delete: boolean;
  archive: boolean;
}

export interface RolePermissionDefaults {
  role: CompanyRole;
  permissions: PermissionModuleRow[];
}

export type BuildingAdminStatus = "active" | "inactive";

export interface BuildingAdmin {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: string;
  status: BuildingAdminStatus;
  lastLogin: string;
}

export interface BuildingRolePermissionDefaults {
  role: string;
  permissions: PermissionModuleRow[];
}

export type CreateBuildingAdminInput = {
  role: string;
  firstName: string;
  lastName: string;
  email?: string;
  password: string;
};

export type UpdateBuildingAdminInput = {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  status?: BuildingAdminStatus;
};

export type VendorStatus = "active" | "pending_invite" | "inactive";

export interface Vendor {
  id: string;
  companyName: string;
  tradeCategory: string;
  contactName: string;
  phone: string;
  email: string;
  buildingIds?: string[];
  notes?: string;
  status: VendorStatus;
}

export interface VendorInvitation {
  id: string;
  vendorId: string;
  invitedEmail: string;
  sentAt: string;
}

export interface VendorSession {
  vendorId: string;
  displayName: string;
  companyName: string;
  email: string;
  tradeCategory: string;
}

export type UpdateVendorProfileInput = Partial<
  Pick<Vendor, "contactName" | "phone" | "notes">
>;

export type VendorNotificationType = "po_received" | "po_reminder";

export interface VendorNotification {
  id: string;
  vendorId: string;
  type: VendorNotificationType;
  message: string;
  poId: string;
  read: boolean;
  createdAt: string;
}

export type PurchaseOrderStatus = "draft" | "sent" | "accepted" | "declined";

export type PurchaseOrderSourceKind = "company-service-request" | "admin-service-request";

export interface PurchaseOrderSourceRequest {
  kind: PurchaseOrderSourceKind;
  requestId: string;
}

export interface PurchaseOrderLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  buildingId: string;
  sourceRequest?: PurchaseOrderSourceRequest;
  status: PurchaseOrderStatus;
  lineItems: PurchaseOrderLineItem[];
  total: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  sentAt?: string;
  respondedAt?: string;
  declineReason?: string;
}

export type CompanyNotificationType = "po_accepted" | "po_declined";

export interface CompanyNotification {
  id: string;
  type: CompanyNotificationType;
  message: string;
  read: boolean;
  createdAt: string;
  poId: string;
}

export type MasterReportType =
  | "amenity-reservations"
  | "board-approvals"
  | "building-store"
  | "certificates"
  | "incident-reports"
  | "chargebacks"
  | "service-requests"
  | "users-pending"
  | "portal-signups";

export type MasterReportTab = "current" | "past" | "cancelled" | "archived" | "settings";

export interface PortalSignupRequest {
  id: string;
  buildingId: string;
  buildingLabel: string;
  unitNumber: string;
  firstName: string;
  corpNumber: string;
  city: string;
  email: string;
  residentType: string;
  quickbooksMatched: boolean;
  quickbooksBalance: string | null;
  status: string;
  submittedAt: string;
}

export interface MasterReportRow {
  id: string;
  reportType: MasterReportType;
  buildingId: string;
  buildingLabel: string;
  date: string;
  title: string;
  status: string;
  severity?: string;
  unit?: string;
  owner?: string;
  pendingReply?: boolean;
  archived: boolean;
  extra?: string;
  /** Certificate list # (e.g. 1014) */
  requestNumber?: string;
  /** Processing option (e.g. Regular Delivery) */
  processing?: string;
  dueDate?: string;
  closingDate?: string;
  /** Secondary status line (e.g. Viewed by Purchaser) */
  statusExtra?: string;
  unread?: boolean;
  approvedCount?: number;
  disapprovedCount?: number;
  votesCollected?: number;
  votesRequired?: number;
  /** Display incident # (e.g. 1359251) */
  incidentNumber?: string;
  location?: string;
  resolutionTime?: string;
  pendingReplyLabel?: "Yes" | "No" | "N/A";
  residentType?: string;
}

export interface IncidentReportComment {
  dateTime: string;
  author: string;
  message: string;
  visibility?: "admin" | "public";
}

export interface IncidentReportAttachment {
  id: string;
  fileName: string;
  uploadedBy: string;
  uploadedDate: string;
  previewUrl?: string;
  kind?: "image" | "pdf" | "file";
}

export interface IncidentReportDetail {
  id: string;
  incidentNumber: string;
  buildingLabel: string;
  buildingAddress?: string;
  incidentDate: string;
  incidentTime?: string;
  /** Panel header timestamp (e.g. 2026-05-18 - 10:11 AM) */
  reportHeaderTime?: string;
  unit: string;
  location: string;
  status: string;
  severity: string;
  reportType: string;
  description: string;
  createdBy: string;
  resident?: string;
  assignedTo?: string;
  viewPermission?: string;
  submittedAt?: string;
  pendingReplyLabel: "Yes" | "No" | "N/A";
  resolutionTime?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  /** Full resolved label (e.g. 2026-05-19 at 12:05 AM) */
  resolvedAtDisplay?: string;
  attachments: IncidentReportAttachment[];
  adminComments: IncidentReportComment[];
  publicComments: IncidentReportComment[];
  archived: boolean;
  unread?: boolean;
}

export type BoardApprovalVoteKind = "approved" | "disapproved" | "pending";

export interface BoardApprovalVote {
  kind: BoardApprovalVoteKind;
  boardMember: string;
  voteDate: string;
}

export interface BoardApprovalAttachment {
  id: string;
  label: string;
  fileName: string;
}

export interface BoardApprovalComment {
  dateTime: string;
  author: string;
  message: string;
}

export interface BoardApprovalDetail {
  id: string;
  title: string;
  buildingLabel: string;
  status: string;
  closedBy?: string;
  createdBy: string;
  dateCreated: string;
  description: string;
  approvedCount: number;
  disapprovedCount: number;
  votesCollected: number;
  votesRequired: number;
  votes: BoardApprovalVote[];
  attachments: BoardApprovalAttachment[];
  comments: BoardApprovalComment[];
  archived: boolean;
  unread?: boolean;
}

export type CertificateFileKind = "pdf" | "zip" | "image";

export interface CertificateFile {
  id: string;
  label: string;
  fileName: string;
  size: string;
  uploadedDate: string;
  kind: CertificateFileKind;
}

export interface CertificateHistoryEntry {
  date: string;
  user: string;
  action: string;
}

export interface CertificateDetail {
  id: string;
  requestNumber: string;
  sentBy?: string;
  sentAt?: string;
  unit: string;
  dateCreated: string;
  deliveryType: string;
  dateDue: string;
  buildingName: string;
  buildingAddress: string;
  buildingCityLine: string;
  requestedByName: string;
  requestedByPhone: string;
  requestedByEmail: string;
  parkingSlots: [string, string];
  lockerSlots: [string, string];
  sellerRetainsSeparatelyDeeded: boolean;
  ownersName: string;
  purchasersName: string;
  closingDate: string;
  reasonForRequest: string;
  solicitorName: string;
  solicitorPhone: string;
  solicitorFax: string;
  files: CertificateFile[];
  excludedFiles: CertificateFile[];
  history: CertificateHistoryEntry[];
  archived: boolean;
  unread?: boolean;
}

export type MasterReportListParams = {
  tab?: MasterReportTab;
  buildingId?: string;
  status?: string;
  severity?: string;
  unit?: string;
  owner?: string;
  pendingReply?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type MasterReportListResult = {
  rows: MasterReportRow[];
  total: number;
};

export interface BuildingSubscription {
  id: string;
  buildingId: string;
  buildingName: string;
  address: string;
  package: string;
  active: boolean;
}

export interface CompanySubscription {
  id: string;
  planName: string;
  status: string;
  renewalDate: string;
  buildingsCount: number;
}

export interface StripePayout {
  id: string;
  payoutDate: string;
  status: "Paid" | "Pending";
  total: number;
  currency: string;
}

export type CreateVendorInput = Omit<Vendor, "id" | "status"> & { status?: VendorStatus };
export type UpdateVendorInput = Partial<Omit<Vendor, "id">>;

export type CreatePurchaseOrderInput = {
  vendorId: string;
  buildingId: string;
  sourceRequest?: PurchaseOrderSourceRequest;
  lineItems: Omit<PurchaseOrderLineItem, "id">[];
  notes?: string;
  status?: PurchaseOrderStatus;
};

export type PurchaseOrderPrefill = {
  buildingId?: string;
  lockBuilding?: boolean;
  sourceRequest?: PurchaseOrderSourceRequest;
  initialLineItems?: Omit<PurchaseOrderLineItem, "id">[];
  notes?: string;
};

export type CreateEmployeeInput = {
  firstName: string;
  lastName: string;
  email: string;
  role: CompanyRole;
  assignedBuildingIds: string[];
  password: string;
};

export type CreateBuildingInput = {
  subdomain: string;
  buildingName?: string;
  corp: string;
  corpNo?: string;
  address: string;
  city: string;
  postalZip: string;
  country: string;
  provinceState: string;
};

/** Demo building: WNCC 87 */
export const DEMO_BUILDING_ID = "2125709459";

export type ChatContactKind = "resident" | "building_admin" | "company";

export interface ChatContact {
  id: string;
  name: string;
  email: string;
  role: string;
  buildingId: string;
  buildingLabel: string;
  kind: ChatContactKind;
}

export interface ChatConversation {
  id: string;
  buildingId: string;
  participantIds: string[];
  lastMessageAt: string;
  lastMessagePreview: string;
  lastReadAtByContact: Record<string, string>;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface ChatActor {
  contactId: string;
  name: string;
  role: string;
  buildingId: string;
  canMessageAnyBuilding: boolean;
}
