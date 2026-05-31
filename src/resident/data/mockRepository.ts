import { seedEmails } from "./mock/user";
import type { ResidentRepository } from "./repository";
import { store } from "./sharedStore";
import { PARKING_PAYMENT_AMOUNTS } from "./types";
import type {
  CreateIncidentReportInput,
  CreateServiceRequestInput,
  IncidentReport,
  NewsItem,
  Newsletter,
  ServiceRequest,
  StatusCertificate,
  CreateStatusCertificateInput,
  BoardMemberApplication,
  CreateBoardMemberApplicationInput,
  CreateFireSafetyPhotoInput,
  FireSafetySubmission,
  ResidentDetailSection,
  ResidentDetailSectionData,
  ResidentProfileDetails,
  Suggestion,
  ElectionBallot,
  CastElectionVoteInput,
  ParkingRequest,
  ParkingRequestType,
  Poll,
  PollAttachment,
  AgmMeeting,
} from "./types";
import type { ArrangeTile } from "./portalTileLayout";
import {
  isElectionVotingOpen,
  isResidentEligibleForElection,
  withResolvedStatus,
} from "../../admin/data/electionUtils";
import { adminRepository } from "../../admin/data/adminRepository";

const delay = <T>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), 50));

function withResidentWaitlistPosition(request: ParkingRequest): ParkingRequest {
  if (request.status !== "waiting") return request;
  const queue = store.parkingRequests
    .filter((item) => item.status === "waiting" && item.requestType === request.requestType)
    .sort((a, b) => a.requestedAt.localeCompare(b.requestedAt));
  const position = queue.findIndex((item) => item.id === request.id);
  return { ...request, waitlistPosition: position >= 0 ? position + 1 : undefined };
}

function toNewsItem(item: (typeof store.adminNews)[0]): NewsItem {
  const { id, title, date, body } = item;
  return { id, title, date, body };
}

function toNewsletter(item: (typeof store.adminNewsletters)[0]): Newsletter {
  const { id, title, date, body, attachmentName } = item;
  return { id, title, date, body, attachmentName };
}

function toServiceRequest(item: (typeof store.serviceRequests)[0]): ServiceRequest {
  const { id, createdBy, createdAt, contact, location, severity, category, description, status } =
    item;
  return { id, createdBy, createdAt, contact, location, severity, category, description, status };
}

function toSuggestion(item: (typeof store.suggestions)[0]): Suggestion {
  const { id, text, createdAt, status } = item;
  return { id, text, createdAt, status };
}

function toIncidentReport(item: (typeof store.incidentReports)[0]): IncidentReport {
  const {
    id,
    incidentDate,
    incidentTime,
    severity,
    reportType,
    location,
    description,
    status,
  } = item;
  return { id, incidentDate, incidentTime, severity, reportType, location, description, status };
}

export const mockRepository: ResidentRepository = {
  getUser: () => delay({ ...store.residentUser }),
  updateUserProfile: async (input) => {
    store.residentUser = {
      ...store.residentUser,
      ...input,
    };
    return delay({ ...store.residentUser });
  },
  getNews: () =>
    delay(store.adminNews.filter((n) => n.status === "active").map(toNewsItem)),
  getNewsById: (id) => {
    const item = store.adminNews.find((n) => n.id === id);
    return delay(item ? toNewsItem(item) : null);
  },
  getNewsletters: () =>
    delay(store.adminNewsletters.filter((n) => n.status === "active").map(toNewsletter)),
  getNewsletterById: (id) => {
    const item = store.adminNewsletters.find((n) => n.id === id);
    return delay(item ? toNewsletter(item) : null);
  },
  getDocumentFolders: () =>
    delay(
      store.documentFolders.filter(
        (f) => f.section !== "admin-only" && f.id !== "0" && f.id !== "1"
      )
    ),
  getDocuments: (folderId) => delay(store.documents.filter((d) => d.folderId === folderId)),
  getFaqs: () => delay([...store.faqs]),
  getAlbums: () => delay([...store.galleryAlbums]),
  getEvents: () =>
    delay(
      store.events.filter((e) => e.status !== "Draft" && !e.adminOnly)
    ),
  getRsvps: () => delay([...store.rsvps]),
  getEmails: () => delay([...seedEmails]),
  getEmailById: (id) => delay(seedEmails.find((e) => e.id === id) ?? null),
  getNotificationPreferences: () => delay([...store.notificationPrefs]),
  updateNotificationPreference: async (id, enabled) => {
    store.notificationPrefs = store.notificationPrefs.map((p) =>
      p.id === id ? { ...p, enabled } : p
    );
  },
  getServiceRequests: () =>
    delay(store.serviceRequests.filter((r) => !r.archived).map(toServiceRequest)),
  getServiceCategories: () => delay(store.serviceCategories.filter((category) => category.status === "active")),
  createServiceRequest: async (input: CreateServiceRequestInput) => {
    const resolvedCategory = await adminRepository.resolveServiceCategoryName(input.category);
    const item = {
      id: String(Date.now()),
      createdBy: "Claudio Owner - Board 5",
      createdAt: new Date().toLocaleString(),
      contact: input.contact,
      location: input.location,
      severity: input.severity,
      category: resolvedCategory,
      description: input.description,
      status: "Submitted",
      assignedTo: "All Admins",
      resident: "Claudio Owner - Board 5",
      visibility: input.visibility,
      permissionToEnter: input.permissionToEnter,
      permissionNotes: input.permissionNotes,
      adminSeverity: input.severity,
      adminCategory: resolvedCategory,
      actionRequired: true,
      archived: false,
      pendingReply: true,
      adminComments: [],
      publicComments: [],
      attachments: [],
    };
    store.serviceRequests.unshift(item);
    return delay(toServiceRequest(item));
  },
  getIncidentReports: () =>
    delay(
      store.incidentReports
        .filter((r) => !r.archived && r.status !== "Draft")
        .map(toIncidentReport)
    ),
  getIncidentCategories: () => delay(store.incidentCategories.filter((category) => category.status === "active")),
  createIncidentReport: async (input: CreateIncidentReportInput) => {
    const resolvedType = await adminRepository.resolveIncidentCategoryName(input.reportType);
    const item = {
      id: String(Date.now()),
      incidentDate: input.incidentDate,
      incidentTime: input.incidentTime,
      severity: input.severity,
      reportType: resolvedType,
      location: input.location,
      description: input.description,
      status: "Pending",
      archived: false,
      createdBy: "Claudio Owner - Unit 102",
      submittedAt: new Date().toLocaleString(),
      unit: "Unit 102",
      resident: "Claudio Owner",
      visibility: input.visibility,
      assignedToAdmin: "All Admins",
      adminSeverity: input.severity,
      adminType: resolvedType,
      pendingReply: "N/A",
      adminComments: [],
      publicComments: [],
      attachments: [],
    };
    store.incidentReports.unshift(item);
    return delay(toIncidentReport(item));
  },
  getSuggestions: () => delay(store.suggestions.map(toSuggestion)),
  createSuggestion: async (input) => {
    const item = {
      id: String(Date.now()),
      text: input.text,
      createdAt: new Date().toLocaleString(),
      status: "Submitted",
      visibility: "Private (Admin & Author)",
      createdBy: "Claudio Owner - Unit 102",
      unit: "102",
      unread: true,
      adminComments: [],
      publicComments: [],
      attachments: [],
    };
    store.suggestions.unshift(item);
    return delay(toSuggestion(item));
  },
  getStatusCertificates: () => delay([...store.statusCertificates]),
  createStatusCertificate: async (input: CreateStatusCertificateInput) => {
    const item: StatusCertificate = {
      id: String(Date.now()),
      certificateType: input.certificateType,
      unit: "102",
      requestedBy: "Claudio Owner - Unit 102",
      createdAt: new Date().toLocaleString(),
      status: "Submitted",
      notes: input.notes,
      rushProcessing: input.rushProcessing,
    };
    store.statusCertificates.unshift(item);
    return delay(item);
  },
  getResidentDetails: () =>
    delay(structuredClone(store.residentDetails) as ResidentProfileDetails),
  updateResidentDetailSection: async (
    section: ResidentDetailSection,
    data: ResidentDetailSectionData
  ) => {
    store.residentDetails = {
      ...store.residentDetails,
      [section]: structuredClone(data),
    };
  },
  getBoardMembers: () => delay([...store.boardMembers]),
  getBoardFaqs: () => delay([...store.boardFaqs]),
  getBoardApplications: () => delay([...store.boardMemberApplications]),
  submitBoardApplication: async (input: CreateBoardMemberApplicationInput) => {
    const item: BoardMemberApplication = {
      id: String(Date.now()),
      ...input,
      submittedAt: new Date().toLocaleString(),
      status: "Submitted",
      unread: true,
    };
    store.boardMemberApplications.unshift(item);
    return delay(item);
  },
  getFireSafetySubmissions: (unit: string) =>
    delay(
      store.fireSafetySubmissions
        .filter((s) => s.unit === unit)
        .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    ),
  getLatestFireSafetySubmission: (unit: string) => {
    const latest = store.fireSafetySubmissions
      .filter((s) => s.unit === unit)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0];
    return delay(latest ?? null);
  },
  submitFireSafetyPhoto: async (input: CreateFireSafetyPhotoInput) => {
    const item: FireSafetySubmission = {
      id: String(Date.now()),
      unit: input.unit,
      uploadedAt: new Date().toISOString().slice(0, 10),
      photoDataUrl: input.photoDataUrl,
      notes: input.notes,
    };
    store.fireSafetySubmissions.unshift(item);
    return delay(item);
  },

  getElectionsForResident: async () => {
    const user = store.residentUser;
    return delay(
      store.boardElections
        .map((e) => withResolvedStatus(e))
        .filter(
          (e) =>
            e.status !== "draft" &&
            e.status !== "archived" &&
            isResidentEligibleForElection(user.role, e.residentTypes)
        )
    );
  },

  getElectionById: async (id: string) => {
    const election = store.boardElections.find((e) => e.id === id);
    return delay(election ? withResolvedStatus(election) : null);
  },

  getElectionPositions: (electionId: string) =>
    delay(
      store.electionPositions
        .filter((p) => p.electionId === electionId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    ),

  getCandidatesForPosition: (positionId: string) =>
    delay(store.electionCandidates.filter((c) => c.positionId === positionId)),

  getBallotsForUnit: (electionId: string, unit: string) =>
    delay(store.electionBallots.filter((b) => b.electionId === electionId && b.unit === unit)),

  castElectionVote: async (input: CastElectionVoteInput) => {
    const user = store.residentUser;
    const election = store.boardElections.find((e) => e.id === input.electionId);
    if (!election) throw new Error("Election not found.");
    const resolved = withResolvedStatus(election);
    if (!isElectionVotingOpen(resolved)) {
      throw new Error("Voting is not open for this election.");
    }
    if (!isResidentEligibleForElection(user.role, election.residentTypes)) {
      throw new Error("You are not eligible to vote in this election.");
    }
    const existing = store.electionBallots.find(
      (b) =>
        b.electionId === input.electionId &&
        b.positionId === input.positionId &&
        b.unit === user.unit
    );
    if (existing) throw new Error("You have already voted for this position.");
    const candidate = store.electionCandidates.find((c) => c.id === input.candidateId);
    if (!candidate || candidate.positionId !== input.positionId) {
      throw new Error("Invalid candidate.");
    }
    const ballot: ElectionBallot = {
      id: `ballot-${Date.now()}`,
      electionId: input.electionId,
      positionId: input.positionId,
      unit: user.unit,
      candidateId: input.candidateId,
      votedAt: new Date().toISOString(),
    };
    store.electionBallots.push(ballot);
    return delay(ballot);
  },
  getPollsForResident: async (): Promise<Poll[]> => {
    const user = store.residentUser;
    return delay(
      store.polls.filter(
        (poll) =>
          poll.status === "active" &&
          (poll.residentTypes.length === 0 || poll.residentTypes.includes(user.role))
      )
    );
  },
  getPollById: async (id: string): Promise<Poll | null> => {
    const user = store.residentUser;
    const poll = store.polls.find((item) => item.id === id) ?? null;
    if (!poll) return delay(null);
    const canView =
      poll.status === "active" &&
      (poll.residentTypes.length === 0 || poll.residentTypes.includes(user.role));
    return delay(canView ? poll : null);
  },
  getPollAttachments: async (pollId: string): Promise<PollAttachment[]> =>
    delay(
      store.pollAttachments
        .filter((attachment) => attachment.pollId === pollId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    ),
  getAgmMeetingById: async (id: string): Promise<AgmMeeting | null> =>
    delay(store.agmMeetings.find((meeting) => meeting.id === id) ?? null),
  getParkingRequestsForCurrentResident: async () => {
    const user = store.residentUser;
    return delay(
      store.parkingRequests
        .filter((request) => request.residentId === user.id)
        .sort((a, b) => a.requestedAt.localeCompare(b.requestedAt))
        .map((request) => withResidentWaitlistPosition(request))
    );
  },
  submitParkingRequest: async (
    requestType: ParkingRequestType,
    details?: { requestedForNights?: string }
  ) => {
    const user = store.residentUser;
    if (requestType === "visitor" && store.residentDetails.parkingSpots.length === 0) {
      throw new Error("Visitor parking requests require an assigned parking spot.");
    }
    const existingWaiting = store.parkingRequests.find(
      (request) =>
        request.residentId === user.id &&
        request.requestType === requestType &&
        (request.status === "waiting" || request.status === "approvedAwaitingPayment")
    );
    if (existingWaiting) {
      throw new Error("You already have a pending request for this parking type.");
    }
    const request: ParkingRequest = {
      id: `parking-request-${Date.now()}`,
      residentId: user.id,
      residentName: user.name,
      unit: user.unit,
      requestType,
      status: "waiting",
      requestedAt: new Date().toISOString(),
      requestedForNights: details?.requestedForNights?.trim() || undefined,
      monthlyCost:
        requestType === "parking"
          ? store.buildingParkingPricing.regularMonthlyCost
          : store.buildingParkingPricing.visitorMonthlyCost,
    };
    store.parkingRequests = [...store.parkingRequests, request];
    return delay(request);
  },
  acceptParkingRequestPayment: async (requestId: string) => {
    const user = store.residentUser;
    const request = store.parkingRequests.find(
      (item) => item.id === requestId && item.residentId === user.id
    );
    if (!request) throw new Error("Parking request not found.");
    if (request.status !== "approvedAwaitingPayment" || !request.assignedSpot) {
      throw new Error("This parking request is not awaiting payment.");
    }

    const now = new Date().toISOString();
    store.parkingRequests = store.parkingRequests.map((item) =>
      item.id === requestId
        ? {
            ...item,
            status: "paidAccepted",
            residentDecisionAt: now,
            paymentAt: now,
            paymentAmount: item.paymentAmount ?? PARKING_PAYMENT_AMOUNTS[item.requestType],
          }
        : item
    );

    if (
      request.requestType === "parking" &&
      !store.residentDetails.parkingSpots.includes(request.assignedSpot)
    ) {
      store.residentDetails = {
        ...store.residentDetails,
        parkingSpots: [...store.residentDetails.parkingSpots, request.assignedSpot],
      };
    }

    const updated = store.parkingRequests.find((item) => item.id === requestId);
    if (!updated) throw new Error("Unable to update parking request.");
    return delay(updated);
  },
  declineParkingRequestOffer: async (requestId: string) => {
    const user = store.residentUser;
    const request = store.parkingRequests.find(
      (item) => item.id === requestId && item.residentId === user.id
    );
    if (!request) throw new Error("Parking request not found.");
    if (request.status !== "approvedAwaitingPayment") {
      throw new Error("This parking request cannot be declined right now.");
    }
    const now = new Date().toISOString();
    store.parkingRequests = store.parkingRequests.map((item) =>
      item.id === requestId
        ? {
            ...item,
            status: "waiting",
            assignedSpot: undefined,
            approvedAt: undefined,
            paymentAmount: undefined,
            paymentAt: undefined,
            paymentTypeLabel: undefined,
            residentDecisionAt: now,
            requestedAt: now,
          }
        : item
    );
    const updated = store.parkingRequests.find((item) => item.id === requestId);
    if (!updated) throw new Error("Unable to update parking request.");
    return delay(updated);
  },
  getVisitorParkingOvernightEmail: async () =>
    delay(
      store.buildingDefinition.visitorParkingOvernightEmail ||
        store.buildingDefinition.propertyEmail ||
        "support@mvpcondos.com"
    ),
  getPersonalTileLayout: () =>
    delay(
      store.residentPersonalTileLayout
        ? store.residentPersonalTileLayout.map((tile) => ({ ...tile }))
        : null
    ),
  savePersonalTileLayout: async (tiles: ArrangeTile[]) => {
    store.residentPersonalTileLayout = tiles.map((tile) => ({ ...tile }));
  },
  resetPersonalTileLayout: async () => {
    store.residentPersonalTileLayout = null;
  },
};

export const residentRepo = mockRepository;
