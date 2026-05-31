import type {
  CalendarEvent,
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
  NewsItem,
  Newsletter,
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
  AgmMeeting,
} from "./types";
import type { ArrangeTile } from "./portalTileLayout";

export interface ResidentRepository {
  getUser(): Promise<ResidentUser>;
  updateUserProfile(input: Partial<Pick<ResidentUser, "email" | "phone" | "birthMonth" | "birthDay">>): Promise<ResidentUser>;
  getNews(): Promise<NewsItem[]>;
  getNewsById(id: string): Promise<NewsItem | null>;
  getNewsletters(): Promise<Newsletter[]>;
  getNewsletterById(id: string): Promise<Newsletter | null>;
  getDocumentFolders(): Promise<DocumentFolder[]>;
  getDocuments(folderId: string): Promise<DocumentFile[]>;
  getFaqs(): Promise<FaqItem[]>;
  getAlbums(): Promise<GalleryAlbum[]>;
  getEvents(): Promise<CalendarEvent[]>;
  getRsvps(): Promise<RsvpItem[]>;
  getEmails(): Promise<EmailRecord[]>;
  getEmailById(id: string): Promise<EmailRecord | null>;
  getNotificationPreferences(): Promise<NotificationPreference[]>;
  updateNotificationPreference(id: string, enabled: boolean): Promise<void>;
  getServiceRequests(): Promise<ServiceRequest[]>;
  getServiceCategories(): Promise<ServiceRequestCategory[]>;
  createServiceRequest(input: CreateServiceRequestInput): Promise<ServiceRequest>;
  getIncidentReports(): Promise<IncidentReport[]>;
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
  getAgmMeetingById(id: string): Promise<AgmMeeting | null>;
  getParkingRequestsForCurrentResident(): Promise<ParkingRequest[]>;
  submitParkingRequest(
    requestType: ParkingRequestType,
    details?: { requestedForNights?: string }
  ): Promise<ParkingRequest>;
  acceptParkingRequestPayment(requestId: string): Promise<ParkingRequest>;
  declineParkingRequestOffer(requestId: string): Promise<ParkingRequest>;
  getVisitorParkingOvernightEmail(): Promise<string>;
  getPersonalTileLayout(): Promise<ArrangeTile[] | null>;
  savePersonalTileLayout(tiles: ArrangeTile[]): Promise<void>;
  resetPersonalTileLayout(): Promise<void>;
}
