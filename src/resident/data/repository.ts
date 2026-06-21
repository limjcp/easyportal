import type {
  CalendarEvent,
  Comment,
  CreateIncidentReportInput,
  CreateServiceRequestInput,
  CreateSuggestionInput,
  DocumentFile,
  DocumentFolder,
  EmailRecord,
  FaqItem,
  GalleryAlbum,
  IncidentReport,
  IncidentReportCategory,
  ResidentIncidentReportDetail,
  ResidentServiceRequestDetail,
  NewsItem,
  NotificationPreference,
  ResidentUser,
  RsvpItem,
  ServiceRequest,
  ServiceRequestCategory,
  StatusCertificate,
  CreateStatusCertificateInput,
  BoardMember,
  BoardFaqItem,
  BoardMemberApplication,
  CreateBoardMemberApplicationInput,
  FireSafetySubmission,
  CreateFireSafetyPhotoInput,
  ResidentDetailSection,
  ResidentDetailSectionData,
  ResidentProfileDetails,
  Suggestion,
  BoardElection,
  ElectionPosition,
  ElectionCandidate,
  ElectionBallot,
  CastElectionVoteInput,
  ParkingRequest,
  ParkingRequestType,
  Poll,
  PollAttachment,
  PollResponse,
  SubmitPollResponseInput,
  AgmMeeting,
  AmenityBooking,
  BuildingAmenitySettings,
  BuildingAmenityResource,
  BuildingAmenityResourceType,
  SubmitElevatorBookingInput,
  SubmitPartyRoomBookingInput,
} from "./types";
import type { ArrangeTile } from "./portalTileLayout";

export interface ResidentRepository {
  getUser(): Promise<ResidentUser>;
  updateUserProfile(input: Partial<Pick<ResidentUser, "email" | "phone" | "birthMonth" | "birthDay">>): Promise<ResidentUser>;
  getNews(): Promise<NewsItem[]>;
  getNewsById(id: string): Promise<NewsItem | null>;
  getDocumentFolders(): Promise<DocumentFolder[]>;
  getDocuments(folderId: string): Promise<DocumentFile[]>;
  getDocumentDownloadUrl(id: string): Promise<string>;
  createDocument(file: File, input: { folderId: string; title: string }): Promise<{ id: string }>;
  getFaqs(): Promise<FaqItem[]>;
  getAlbums(): Promise<GalleryAlbum[]>;
  getEvents(): Promise<CalendarEvent[]>;
  getRsvps(): Promise<RsvpItem[]>;
  getEmails(): Promise<EmailRecord[]>;
  getEmailById(id: string): Promise<EmailRecord | null>;
  getNotificationPreferences(): Promise<NotificationPreference[]>;
  updateNotificationPreference(id: string, enabled: boolean): Promise<void>;
  getServiceRequests(): Promise<ServiceRequest[]>;
  getServiceRequestById(id: string): Promise<ResidentServiceRequestDetail | null>;
  addServiceRequestComment(id: string, text: string): Promise<Comment>;
  markServiceRequestRead(id: string): Promise<void>;
  getServiceCategories(): Promise<ServiceRequestCategory[]>;
  createServiceRequest(input: CreateServiceRequestInput): Promise<ServiceRequest>;
  getPortalModuleBadgeCounts(): Promise<Record<string, number>>;
  getIncidentReports(): Promise<IncidentReport[]>;
  getIncidentReportById(id: string): Promise<ResidentIncidentReportDetail | null>;
  addIncidentReportComment(id: string, text: string): Promise<Comment>;
  getIncidentCategories(): Promise<IncidentReportCategory[]>;
  createIncidentReport(input: CreateIncidentReportInput): Promise<IncidentReport>;
  getSuggestions(): Promise<Suggestion[]>;
  createSuggestion(input: CreateSuggestionInput): Promise<Suggestion>;
  getStatusCertificates(): Promise<StatusCertificate[]>;
  createStatusCertificate(input: CreateStatusCertificateInput): Promise<StatusCertificate>;
  getResidentDetails(): Promise<ResidentProfileDetails>;
  updateResidentDetailSection(
    section: ResidentDetailSection,
    data: ResidentDetailSectionData
  ): Promise<void>;
  getBoardMembers(): Promise<BoardMember[]>;
  getBoardFaqs(): Promise<BoardFaqItem[]>;
  getBoardApplications(): Promise<BoardMemberApplication[]>;
  submitBoardApplication(input: CreateBoardMemberApplicationInput): Promise<BoardMemberApplication>;
  getFireSafetySubmissions(unit: string): Promise<FireSafetySubmission[]>;
  getLatestFireSafetySubmission(unit: string): Promise<FireSafetySubmission | null>;
  submitFireSafetyPhoto(input: CreateFireSafetyPhotoInput): Promise<FireSafetySubmission>;
  getElectionsForResident(): Promise<BoardElection[]>;
  getElectionById(id: string): Promise<BoardElection | null>;
  getElectionPositions(electionId: string): Promise<ElectionPosition[]>;
  getCandidatesForPosition(positionId: string): Promise<ElectionCandidate[]>;
  getBallotsForUnit(electionId: string, unit: string): Promise<ElectionBallot[]>;
  castElectionVote(input: CastElectionVoteInput): Promise<ElectionBallot>;
  getPollsForResident(): Promise<Poll[]>;
  getPollById(id: string): Promise<Poll | null>;
  getPollAttachments(pollId: string): Promise<PollAttachment[]>;
  getPollResponsesForPoll(pollId: string): Promise<PollResponse[]>;
  submitPollResponse(input: SubmitPollResponseInput): Promise<PollResponse>;
  getAgmMeetingById(id: string): Promise<AgmMeeting | null>;
  getParkingRequestsForCurrentResident(): Promise<ParkingRequest[]>;
  submitParkingRequest(
    requestType: ParkingRequestType,
    details?: { requestedForNights?: string }
  ): Promise<ParkingRequest>;
  acceptParkingRequestPayment(requestId: string): Promise<ParkingRequest>;
  declineParkingRequestOffer(requestId: string): Promise<ParkingRequest>;
  getVisitorParkingOvernightEmail(): Promise<string>;
  getQuickBooksAccountSnapshot(): Promise<{
    connected: boolean;
    invoices: {
      id: string;
      docNumber: string;
      txnDate: string;
      dueDate: string;
      total: number;
      balance: number;
    }[];
  }>;
  getAmenityBookings(): Promise<AmenityBooking[]>;
  getBuildingAmenitySettings(): Promise<BuildingAmenitySettings>;
  getBuildingAmenityResources(resourceType?: BuildingAmenityResourceType): Promise<BuildingAmenityResource[]>;
  submitElevatorBooking(input: SubmitElevatorBookingInput): Promise<AmenityBooking>;
  submitPartyRoomBooking(input: SubmitPartyRoomBookingInput): Promise<AmenityBooking>;
  acceptPartyRoomPayment(bookingId: string): Promise<AmenityBooking>;
  cancelAmenityBooking(bookingId: string): Promise<AmenityBooking>;
  markAmenityBookingRead(bookingId: string): Promise<void>;
  getPersonalTileLayout(): Promise<ArrangeTile[] | null>;
  savePersonalTileLayout(tiles: ArrangeTile[]): Promise<void>;
  resetPersonalTileLayout(): Promise<void>;
}
