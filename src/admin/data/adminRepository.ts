import { PARKING_PAYMENT_AMOUNTS } from "../../resident/data/types";
import type {
  AddUnitRangeType,
  AdminIncidentReport,
  AdminNewsItem,
  AdminNewsletter,
  AdminServiceRequest,
  AdminSuggestion,
  BoardApproval,
  CreateBoardApprovalInput,
  CreateAdminIncidentReportInput,
  BuildingDefinition,
  BuildingLockerGroup,
  BuildingParkingGroup,
  BuildingParkingPricing,
  BuildingReminder,
  BuildingTaxSettings,
  BuildingUnitGroup,
  BuildingUnitGroupDefinition,
  AdminEventType,
  CalendarEvent,
  CreateCalendarEventInput,
  Comment,
  CreateAdminServiceRequestInput,
  CreateAdminSuggestionInput,
  CreatePollInput,
  CreateDocumentInput,
  DocumentFile,
  DocumentStorageStats,
  FaqItem,
  GalleryAlbum,
  IncidentContactEmail,
  IncidentReportCategory,
  CustomPortalTile,
  PortalImage,
  PortalImageKind,
  PortalModuleConfig,
  PortalSettings,
  PortalTileSettings,
  ProfileFieldOption,
  PublicPortalDocument,
  PublicPortalSettings,
  RegistrationFieldOption,
  ServiceRequestCategory,
  Poll,
  PollQuestion,
  PollAttachment,
  AgmMeeting,
  UpdateAdminUserInput,
  BuildingExternalData,
  CreateStripeAccountInput,
  BuildingAdmin,
  CreateBuildingAdminInput,
  UpdateBuildingAdminInput,
  PermissionModuleRow,
  BoardMember,
  BoardMemberApplication,
  FireSafetySubmission,
  CertificateDetail,
  MasterReportRow,
  BoardElection,
  CreateBoardElectionInput,
  CreateElectionPositionInput,
  CreateElectionCandidateInput,
  ElectionPosition,
  ElectionCandidate,
  ElectionResults,
  ParkingRequest,
  UnitsUsersArchivedRow,
  UnitsUsersCurrentRow,
  UnitsUsersPendingRow,
  UnitsUsersUnitDetail,
  UnitsUsersUnoccupiedRow,
  UnitsUsersUserDetail,
} from "../../resident/data/types";
import { certificateDetailFromRow } from "../../company/data/mock/certificateDetails";
import { BUILDING_ADMIN_ROLES, createDefaultBuildingPermissionsForRole } from "./mock/buildingPermissions";
import {
  seedUnitsUsersArchived,
  seedUnitsUsersCurrent,
  seedUnitsUsersPending,
  seedUnitsUsersUnoccupied,
  seedUnitsUsersUnitDetails,
  seedUnitsUsersUserDetails,
} from "./mock/unitsUsers";
import { defaultNewsItemFields } from "./mock/adminNews";
import { seedAdminEmails } from "./mock/adminUser";
import { syncPortalSettingsFromModules } from "../../resident/data/portalConfig";
import { store } from "../../resident/data/sharedStore";
import { normalizePortalLayout } from "../../resident/data/portalTileLayout";
import {
  getEligibleUnitCount,
  withResolvedStatus,
} from "./electionUtils";

const delay = <T>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), 50));

const cloneUnitsUsersCurrent = () => seedUnitsUsersCurrent.map((item) => ({ ...item }));
const cloneUnitsUsersPending = () => seedUnitsUsersPending.map((item) => ({ ...item }));
const cloneUnitsUsersUnoccupied = () => seedUnitsUsersUnoccupied.map((item) => ({ ...item }));
const cloneUnitsUsersArchived = () => seedUnitsUsersArchived.map((item) => ({ ...item }));
const cloneUnitsUsersUnitDetail = (detail: UnitsUsersUnitDetail) => ({
  ...detail,
  occupants: detail.occupants.map((occupant) => ({ ...occupant })),
});
const cloneUnitsUsersUserDetail = (detail: UnitsUsersUserDetail) => ({ ...detail });

function expandRange(start: string, end: string, addType: AddUnitRangeType, prefix = ""): string[] {
  const startNum = parseInt(start, 10);
  const endNum = parseInt(end, 10);
  if (Number.isNaN(startNum) || Number.isNaN(endNum)) return [`${prefix}${start}`];
  const lo = Math.min(startNum, endNum);
  const hi = Math.max(startNum, endNum);
  const result: string[] = [];
  for (let i = lo; i <= hi; i++) {
    if (addType === "even" && i % 2 !== 0) continue;
    if (addType === "odd" && i % 2 === 0) continue;
    result.push(`${prefix}${i}`);
  }
  return result;
}

function upsertUnitGroup(floorArea: string, newUnits: string[]) {
  const existing = store.buildingUnits.find((g) => g.floorArea === floorArea);
  if (existing) {
    const merged = [...new Set([...existing.units, ...newUnits])];
    store.buildingUnits = store.buildingUnits.map((g) =>
      g.id === existing.id ? { ...g, units: merged } : g
    );
  } else {
    store.buildingUnits = [
      ...store.buildingUnits,
      { id: String(Date.now()), floorArea, units: newUnits },
    ];
  }
}

function parseUnitFromResident(resident: string): string {
  const match = resident.match(/(Unit\s*\d+)/i);
  if (match?.[1]) return match[1].replace(/\s+/g, " ").trim();
  return "—";
}

function normalizeCategoryName(name: string): string {
  return name.replace(/\s+/g, " ").trim();
}

function isSameCategoryName(a: string, b: string): boolean {
  return normalizeCategoryName(a).toLowerCase() === normalizeCategoryName(b).toLowerCase();
}

function ensureServiceCategory(name: string): string {
  const normalized = normalizeCategoryName(name);
  if (!normalized) throw new Error("Service request category is required.");
  const existing = store.serviceCategories.find((category) => isSameCategoryName(category.name, normalized));
  if (existing) {
    existing.usageCount += 1;
    return existing.name;
  }
  const item: ServiceRequestCategory = {
    id: String(Date.now()),
    name: normalized,
    status: "active",
    usageCount: 1,
  };
  store.serviceCategories = [item, ...store.serviceCategories];
  return item.name;
}

function ensureIncidentCategory(name: string): string {
  const normalized = normalizeCategoryName(name);
  if (!normalized) throw new Error("Incident report type is required.");
  const existing = store.incidentCategories.find((category) =>
    isSameCategoryName(category.name, normalized)
  );
  if (existing) {
    existing.usageCount += 1;
    return existing.name;
  }
  const item: IncidentReportCategory = {
    id: String(Date.now()),
    status: "active",
    name: normalized,
    usageCount: 1,
  };
  store.incidentCategories = [item, ...store.incidentCategories];
  return item.name;
}

export const adminRepository = {
  resolveServiceCategoryName: async (selectedName: string, customName?: string) => {
    const raw = selectedName === "Other" ? customName ?? "" : selectedName;
    return delay(ensureServiceCategory(raw));
  },

  resolveIncidentCategoryName: async (selectedName: string, customName?: string) => {
    const raw = selectedName === "Other" ? customName ?? "" : selectedName;
    return delay(ensureIncidentCategory(raw));
  },

  getNews: (tab: "current" | "archived" = "current") =>
    delay(
      store.adminNews.filter((n) =>
        tab === "current" ? n.status !== "archived" : n.status === "archived"
      )
    ),

  getNewsById: (id: string) => delay(store.adminNews.find((n) => n.id === id) ?? null),

  archiveNews: async (id: string) => {
    store.adminNews = store.adminNews.map((n) =>
      n.id === id ? { ...n, status: "archived" as const } : n
    );
  },

  unarchiveNews: async (id: string) => {
    store.adminNews = store.adminNews.map((n) =>
      n.id === id ? { ...n, status: "active" as const } : n
    );
  },

  createNews: async (title: string) => {
    const item: AdminNewsItem = {
      id: String(Date.now()),
      title,
      date: new Date().toISOString().slice(0, 10),
      body: "",
      status: "draft",
      emailDelivered: 0,
      emailTotal: 0,
      postTime: "09:00 AM",
      editHistory: [
        {
          status: "draft",
          date: new Date().toLocaleString(),
          user: "Claudio Owner",
          action: "Draft Created",
        },
      ],
      ...defaultNewsItemFields,
    };
    store.adminNews = [item, ...store.adminNews];
    return delay(item);
  },

  updateNews: async (id: string, updates: Partial<AdminNewsItem>) => {
    store.adminNews = store.adminNews.map((n) => (n.id === id ? { ...n, ...updates } : n));
    return delay(store.adminNews.find((n) => n.id === id) ?? null);
  },

  getNewsletters: () => delay([...store.adminNewsletters]),

  getNewsletterById: (id: string) =>
    delay(store.adminNewsletters.find((n) => n.id === id) ?? null),

  createNewsletter: async (title: string) => {
    const item: AdminNewsletter = {
      id: String(Date.now()),
      title,
      date: new Date().toISOString().slice(0, 10),
      body: "",
      status: "draft",
      emailDelivered: 0,
      emailTotal: 0,
      noNotifications: true,
      postTime: "",
      editHistory: [
        {
          status: "draft",
          date: new Date().toLocaleString(),
          user: "Claudio Owner",
          action: "Draft Created",
        },
      ],
    };
    store.adminNewsletters = [item, ...store.adminNewsletters];
    return delay(item);
  },

  updateNewsletter: async (id: string, updates: Partial<AdminNewsletter>) => {
    store.adminNewsletters = store.adminNewsletters.map((n) =>
      n.id === id ? { ...n, ...updates } : n
    );
    return delay(store.adminNewsletters.find((n) => n.id === id) ?? null);
  },

  deleteNewsletter: async (id: string) => {
    store.adminNewsletters = store.adminNewsletters.filter((n) => n.id !== id);
  },

  getPolls: () => delay([...store.polls]),

  getPollById: (id: string) => delay(store.polls.find((poll) => poll.id === id) ?? null),

  createPoll: async (input: CreatePollInput) => {
    const item: Poll = {
      id: String(Date.now()),
      title: input.title,
      status: "draft",
      createdAt: new Date().toISOString().slice(0, 10),
      responseCount: 0,
      noNotifications: true,
      privacy: "not-anonymous",
      residentTypes: [
        "Board Members",
        "Absentee Owner",
        "Owners",
        "Tenants",
        "Occupants",
        "Unit Managers",
      ],
      showToFilter: "No filter",
      questions: [],
    };
    store.polls = [item, ...store.polls];
    return delay(item);
  },

  updatePoll: async (id: string, updates: Partial<Poll>) => {
    store.polls = store.polls.map((poll) => (poll.id === id ? { ...poll, ...updates } : poll));
    return delay(store.polls.find((poll) => poll.id === id) ?? null);
  },

  addPollQuestion: async (pollId: string, question: Omit<PollQuestion, "id">) => {
    const q: PollQuestion = { ...question, id: String(Date.now()) };
    store.polls = store.polls.map((poll) =>
      poll.id === pollId ? { ...poll, questions: [...poll.questions, q] } : poll
    );
    return delay(q);
  },

  getPollAttachments: (pollId: string) =>
    delay(
      store.pollAttachments
        .filter((attachment) => attachment.pollId === pollId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    ),

  addPollAttachment: async (
    pollId: string,
    input: Omit<PollAttachment, "id" | "pollId" | "createdAt">
  ) => {
    const item: PollAttachment = {
      id: `poll-attachment-${Date.now()}`,
      pollId,
      createdAt: new Date().toISOString(),
      ...input,
    };
    store.pollAttachments = [item, ...store.pollAttachments];
    return delay(item);
  },

  removePollAttachment: async (attachmentId: string) => {
    store.pollAttachments = store.pollAttachments.filter((attachment) => attachment.id !== attachmentId);
    return delay(true);
  },

  getAgmMeetings: () =>
    delay([...store.agmMeetings].sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate))),

  getAgmMeetingById: (id: string) =>
    delay(store.agmMeetings.find((meeting) => meeting.id === id) ?? null),

  createAgmMeeting: async (
    input: Omit<AgmMeeting, "id" | "createdAt" | "status" | "startedAt" | "endedAt">
  ) => {
    const item: AgmMeeting = {
      id: `agm-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
      status: "draft",
      ...input,
    };
    store.agmMeetings = [item, ...store.agmMeetings];
    return delay(item);
  },

  updateAgmMeeting: async (id: string, updates: Partial<AgmMeeting>) => {
    store.agmMeetings = store.agmMeetings.map((meeting) =>
      meeting.id === id ? { ...meeting, ...updates } : meeting
    );
    return delay(store.agmMeetings.find((meeting) => meeting.id === id) ?? null);
  },

  startAgmMeeting: async (id: string) => {
    const startedAt = new Date().toISOString();
    store.agmMeetings = store.agmMeetings.map((meeting) =>
      meeting.id === id
        ? { ...meeting, status: "active", startedAt, endedAt: undefined }
        : meeting
    );
    return delay(store.agmMeetings.find((meeting) => meeting.id === id) ?? null);
  },

  endAgmMeeting: async (id: string) => {
    const endedAt = new Date().toISOString();
    store.agmMeetings = store.agmMeetings.map((meeting) =>
      meeting.id === id ? { ...meeting, status: "ended", endedAt } : meeting
    );
    return delay(store.agmMeetings.find((meeting) => meeting.id === id) ?? null);
  },

  // Backward-compatible wrappers while Survey code paths are renamed.
  getSurveys: () => delay([...store.polls]),
  getSurveyById: (id: string) => delay(store.polls.find((poll) => poll.id === id) ?? null),
  createSurvey: async (input: CreatePollInput) => adminRepository.createPoll(input),
  updateSurvey: async (id: string, updates: Partial<Poll>) =>
    adminRepository.updatePoll(id, updates),
  addSurveyQuestion: async (pollId: string, question: Omit<PollQuestion, "id">) =>
    adminRepository.addPollQuestion(pollId, question),

  getServiceRequests: (
    archived = false,
    filters?: { unit?: string; owner?: string }
  ) =>
    delay(
      store.serviceRequests.filter((r) => {
        if (r.archived !== archived) return false;
        if (filters?.unit && filters.unit !== "all" && r.unit !== filters.unit) return false;
        if (filters?.owner && filters.owner !== "all" && r.resident !== filters.owner) return false;
        return true;
      })
    ),

  getServiceRequestById: (id: string) =>
    delay(store.serviceRequests.find((r) => r.id === id) ?? null),

  createServiceRequest: async (input: CreateAdminServiceRequestInput) => {
    const resolvedCategory = ensureServiceCategory(input.category);
    const unit = input.unit ?? parseUnitFromResident(input.resident);
    const item: AdminServiceRequest = {
      id: String(1100000 + store.serviceRequests.length + 1),
      createdBy: input.resident,
      createdAt: new Date().toISOString().slice(0, 10),
      contact: input.contact,
      location: input.location,
      severity: input.severity,
      category: resolvedCategory,
      description: input.description,
      status: "Received",
      assignedTo: input.assignedTo,
      resident: input.resident,
      unit,
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
    store.serviceRequests = [item, ...store.serviceRequests];
    return delay(item);
  },

  updateServiceRequest: async (id: string, updates: Partial<AdminServiceRequest>) => {
    store.serviceRequests = store.serviceRequests.map((r) =>
      r.id === id ? { ...r, ...updates } : r
    );
    return delay(store.serviceRequests.find((r) => r.id === id) ?? null);
  },

  addServiceRequestComment: async (
    id: string,
    comment: Omit<Comment, "id">,
    visibility: "admin" | "public"
  ) => {
    const c: Comment = { ...comment, id: String(Date.now()), visibility };
    store.serviceRequests = store.serviceRequests.map((r) => {
      if (r.id !== id) return r;
      if (visibility === "admin") {
        return { ...r, adminComments: [...r.adminComments, c] };
      }
      return { ...r, publicComments: [...r.publicComments, c] };
    });
    return delay(c);
  },

  getServiceCategories: () => delay([...store.serviceCategories]),

  createServiceCategory: async (name: string, status: "active" | "inactive" = "active") => {
    const normalized = normalizeCategoryName(name);
    if (!normalized) throw new Error("Service category name is required.");
    const existing = store.serviceCategories.find((category) =>
      isSameCategoryName(category.name, normalized)
    );
    if (existing) {
      if (existing.status !== status) {
        existing.status = status;
      }
      return delay(existing);
    }
    const item: ServiceRequestCategory = {
      id: String(Date.now()),
      name: normalized,
      status,
      usageCount: 0,
    };
    store.serviceCategories = [item, ...store.serviceCategories];
    return delay(item);
  },

  updateServiceCategory: async (id: string, updates: Partial<ServiceRequestCategory>) => {
    store.serviceCategories = store.serviceCategories.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    return delay(store.serviceCategories.find((c) => c.id === id) ?? null);
  },

  getServiceRequestTerms: () => delay(store.serviceRequestTerms),

  updateServiceRequestTerms: async (terms: string) => {
    store.serviceRequestTerms = terms;
    return delay(terms);
  },

  getSuggestions: () => delay([...store.suggestions]),

  getSuggestionById: (id: string) => delay(store.suggestions.find((s) => s.id === id) ?? null),

  createSuggestion: async (input: CreateAdminSuggestionInput) => {
    const item: AdminSuggestion = {
      id: String(Date.now()),
      text: input.text,
      createdAt: new Date().toISOString().slice(0, 10),
      status: "Open",
      visibility: input.visibility,
      createdBy: input.createdBy,
      unit: input.unit,
      unread: true,
      adminComments: [],
      publicComments: [],
      attachments: [],
    };
    store.suggestions = [item, ...store.suggestions];
    return delay(item);
  },

  updateSuggestion: async (id: string, updates: Partial<AdminSuggestion>) => {
    store.suggestions = store.suggestions.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );
    return delay(store.suggestions.find((s) => s.id === id) ?? null);
  },

  addSuggestionComment: async (
    id: string,
    comment: Omit<Comment, "id">,
    visibility: "admin" | "public"
  ) => {
    const c: Comment = { ...comment, id: String(Date.now()), visibility };
    store.suggestions = store.suggestions.map((s) => {
      if (s.id !== id) return s;
      if (visibility === "admin") {
        return { ...s, adminComments: [...s.adminComments, c] };
      }
      return { ...s, publicComments: [...s.publicComments, c] };
    });
    return delay(c);
  },

  getUnreadSuggestionCount: () => delay(store.suggestions.filter((s) => s.unread).length),

  getConsultationSubmissions: () =>
    delay([...store.consultationSubmissions].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))),

  getUnreadConsultationLeadCount: () =>
    delay(store.consultationSubmissions.filter((lead) => lead.unread).length),

  markConsultationSubmissionRead: async (id: string) => {
    store.consultationSubmissions = store.consultationSubmissions.map((lead) =>
      lead.id === id ? { ...lead, unread: false } : lead
    );
    return delay(store.consultationSubmissions.find((lead) => lead.id === id) ?? null);
  },

  markAllConsultationSubmissionsRead: async () => {
    store.consultationSubmissions = store.consultationSubmissions.map((lead) => ({
      ...lead,
      unread: false,
    }));
    return delay(undefined);
  },

  getBuildingDefinition: () => delay({ ...store.buildingDefinition }),

  updateBuildingDefinition: async (updates: Partial<BuildingDefinition>) => {
    store.buildingDefinition = { ...store.buildingDefinition, ...updates };
    return delay(store.buildingDefinition);
  },

  getBuildingTaxSettings: () => delay({ ...store.buildingTaxSettings }),

  updateBuildingTaxSettings: async (updates: Partial<BuildingTaxSettings>) => {
    store.buildingTaxSettings = { ...store.buildingTaxSettings, ...updates };
    return delay(store.buildingTaxSettings);
  },

  getBuildingUnits: () => delay([...store.buildingUnits]),

  getUnitsUsersCurrent: () => delay(cloneUnitsUsersCurrent()),

  getUnitsUsersPending: () => delay(cloneUnitsUsersPending()),

  getUnitsUsersUnoccupied: () => delay(cloneUnitsUsersUnoccupied()),

  getUnitsUsersArchived: () => delay(cloneUnitsUsersArchived()),

  getUnitsUsersUnitDetail: (unitId: string) =>
    delay(
      (() => {
        const detail = seedUnitsUsersUnitDetails.find((item) => item.id === unitId);
        return detail ? cloneUnitsUsersUnitDetail(detail) : null;
      })()
    ),

  getUnitsUsersUserDetail: (userId: string) =>
    delay(
      (() => {
        const detail = seedUnitsUsersUserDetails.find((item) => item.id === userId);
        return detail ? cloneUnitsUsersUserDetail(detail) : null;
      })()
    ),

  addBuildingUnits: async (input: {
    floorArea: string;
    start: string;
    end: string;
    addType: AddUnitRangeType;
  }) => {
    const units = expandRange(input.start, input.end, input.addType);
    upsertUnitGroup(input.floorArea, units);
    return delay(store.buildingUnits);
  },

  deleteBuildingUnit: async (groupId: string, unit: string) => {
    store.buildingUnits = store.buildingUnits
      .map((g) =>
        g.id === groupId ? { ...g, units: g.units.filter((u) => u !== unit) } : g
      )
      .filter((g) => g.units.length > 0);
  },

  getBuildingUnitGroups: () => delay([...store.buildingUnitGroups]),

  createBuildingUnitGroup: async (name: string, unitIds: string[]) => {
    const item: BuildingUnitGroupDefinition = {
      id: String(Date.now()),
      name,
      unitIds,
    };
    store.buildingUnitGroups = [...store.buildingUnitGroups, item];
    return delay(item);
  },

  getBuildingParking: () => delay([...store.buildingParking]),

  getBuildingParkingPricing: () => delay({ ...store.buildingParkingPricing }),

  updateBuildingParkingPricing: async (updates: Partial<BuildingParkingPricing>) => {
    store.buildingParkingPricing = { ...store.buildingParkingPricing, ...updates };
    return delay({ ...store.buildingParkingPricing });
  },

  getResidentCondoFeeAmount: () =>
    delay(store.residentDetails.purchaseDateMaintFees.monthlyFee ?? "$0.00"),

  updateResidentCondoFeeAmount: async (monthlyFee: string) => {
    store.residentDetails = {
      ...store.residentDetails,
      purchaseDateMaintFees: {
        ...store.residentDetails.purchaseDateMaintFees,
        monthlyFee,
        nextPaymentAmount: monthlyFee,
      },
    };
    return delay(store.residentDetails.purchaseDateMaintFees.monthlyFee ?? monthlyFee);
  },

  addBuildingParking: async (input: {
    floorArea: string;
    start: string;
    end: string;
    addType: AddUnitRangeType;
    prefix?: string;
    visitorParking?: boolean;
  }) => {
    const spaces = expandRange(input.start, input.end, input.addType, input.prefix ?? "");
    const existing = store.buildingParking.find((g) => g.floorArea === input.floorArea);
    if (existing) {
      store.buildingParking = store.buildingParking.map((g) =>
        g.id === existing.id
          ? { ...g, spaces: [...new Set([...g.spaces, ...spaces])], visitorParking: !!input.visitorParking }
          : g
      );
    } else {
      store.buildingParking = [
        ...store.buildingParking,
        {
          id: String(Date.now()),
          floorArea: input.floorArea,
          visitorParking: !!input.visitorParking,
          spaces,
        },
      ];
    }
    return delay(store.buildingParking);
  },

  getParkingRequests: () =>
    delay(
      [...store.parkingRequests].sort((a, b) => {
        if (a.status === "waiting" && b.status !== "waiting") return -1;
        if (a.status !== "waiting" && b.status === "waiting") return 1;
        if (a.status === b.status) return a.requestedAt.localeCompare(b.requestedAt);
        return a.status.localeCompare(b.status);
      })
    ),

  assignParkingRequest: async (requestId: string, assignedSpot: string) => {
    const request = store.parkingRequests.find((item) => item.id === requestId);
    if (!request) throw new Error("Parking request not found.");
    if (request.status !== "waiting") throw new Error("Only waiting requests can be approved.");
    if (!assignedSpot.trim()) throw new Error("Assigned spot is required.");

    const allBuildingSpots = new Set(store.buildingParking.flatMap((group) => group.spaces));
    if (!allBuildingSpots.has(assignedSpot)) {
      throw new Error("Assigned spot must exist in building parking spaces.");
    }

    const reservedRegularSpots = new Set(
      store.parkingRequests
        .filter(
          (item) =>
            item.requestType === "parking" &&
            (item.status === "approvedAwaitingPayment" || item.status === "paidAccepted") &&
            item.assignedSpot
        )
        .map((item) => item.assignedSpot as string)
    );
    for (const spot of store.residentDetails.parkingSpots) reservedRegularSpots.add(spot);
    if (request.requestType === "parking" && reservedRegularSpots.has(assignedSpot)) {
      throw new Error("That parking spot is already reserved or assigned.");
    }

    const now = new Date().toISOString();
    const paymentTypeLabel = request.requestType === "parking" ? "Regular Parking" : "Visitor Parking";
    const monthlyCost =
      request.requestType === "parking"
        ? store.buildingParkingPricing.regularMonthlyCost
        : store.buildingParkingPricing.visitorMonthlyCost;
    store.parkingRequests = store.parkingRequests.map((item) =>
      item.id === requestId
        ? {
            ...item,
            status: "approvedAwaitingPayment" as ParkingRequest["status"],
            assignedSpot,
            approvedAt: now,
            paymentAmount: monthlyCost || PARKING_PAYMENT_AMOUNTS[request.requestType],
            monthlyCost,
            paymentTypeLabel,
          }
        : item
    );

    return delay(store.parkingRequests.find((item) => item.id === requestId) ?? null);
  },

  getBuildingLockers: () => delay([...store.buildingLockers]),

  addBuildingLockers: async (input: {
    floorArea: string;
    start: string;
    end: string;
    addType: AddUnitRangeType;
    prefix?: string;
  }) => {
    const lockers = expandRange(input.start, input.end, input.addType, input.prefix ?? "");
    const existing = store.buildingLockers.find((g) => g.floorArea === input.floorArea);
    if (existing) {
      store.buildingLockers = store.buildingLockers.map((g) =>
        g.id === existing.id ? { ...g, lockers: [...new Set([...g.lockers, ...lockers])] } : g
      );
    } else {
      store.buildingLockers = [
        ...store.buildingLockers,
        { id: String(Date.now()), floorArea: input.floorArea, lockers },
      ];
    }
    return delay(store.buildingLockers);
  },

  getBuildingReminders: () => delay([...store.buildingReminders]),

  createBuildingReminder: async (input: Omit<BuildingReminder, "id">) => {
    const item: BuildingReminder = { ...input, id: String(Date.now()) };
    store.buildingReminders = [...store.buildingReminders, item];
    return delay(item);
  },

  getPortalSettings: () => {
    syncPortalSettingsFromModules();
    return delay({ ...store.portalSettings });
  },

  updatePortalSettings: async (updates: Partial<PortalSettings>) => {
    store.portalSettings = { ...store.portalSettings, ...updates };
    return delay(store.portalSettings);
  },

  getPublicPortalSettings: () => delay({ ...store.publicPortalSettings }),

  updatePublicPortalSettings: async (updates: Partial<PublicPortalSettings>) => {
    store.publicPortalSettings = { ...store.publicPortalSettings, ...updates };
    return delay(store.publicPortalSettings);
  },

  getPortalImages: (kind?: PortalImageKind) =>
    delay(
      kind
        ? store.portalImages.filter((i) => i.kind === kind).sort((a, b) => a.sortOrder - b.sortOrder)
        : [...store.portalImages].sort((a, b) => a.sortOrder - b.sortOrder)
    ),

  createPortalImage: async (input: Omit<PortalImage, "id">) => {
    const item: PortalImage = { ...input, id: String(Date.now()) };
    store.portalImages = [...store.portalImages, item];
    return delay(item);
  },

  updatePortalImage: async (id: string, updates: Partial<PortalImage>) => {
    store.portalImages = store.portalImages.map((i) => (i.id === id ? { ...i, ...updates } : i));
    return delay(store.portalImages.find((i) => i.id === id) ?? null);
  },

  deletePortalImage: async (id: string) => {
    store.portalImages = store.portalImages.filter((i) => i.id !== id);
  },

  getPublicPortalDocuments: () => delay([...store.publicPortalDocuments]),

  createPublicPortalDocument: async (input: Omit<PublicPortalDocument, "id">) => {
    const item: PublicPortalDocument = { ...input, id: String(Date.now()) };
    store.publicPortalDocuments = [item, ...store.publicPortalDocuments];
    return delay(item);
  },

  deletePublicPortalDocument: async (id: string) => {
    store.publicPortalDocuments = store.publicPortalDocuments.filter((d) => d.id !== id);
  },

  getPortalModules: () => delay(store.portalModules.map((m) => ({ ...m }))),

  updatePortalModules: async (modules: PortalModuleConfig[]) => {
    const normalized = normalizePortalLayout(
      modules.map((m) => ({ ...m })),
      store.customPortalTiles,
      store.portalTileSettings.primaryTileLimit
    );
    store.portalModules = normalized.modules;
    store.customPortalTiles = normalized.customTiles;
    syncPortalSettingsFromModules();
    return delay(store.portalModules);
  },

  getPortalTileSettings: () => delay({ ...store.portalTileSettings }),

  updatePortalTileSettings: async (updates: Partial<PortalTileSettings>) => {
    store.portalTileSettings = { ...store.portalTileSettings, ...updates };
    const normalized = normalizePortalLayout(
      store.portalModules,
      store.customPortalTiles,
      store.portalTileSettings.primaryTileLimit
    );
    store.portalModules = normalized.modules;
    store.customPortalTiles = normalized.customTiles;
    syncPortalSettingsFromModules();
    return delay(store.portalTileSettings);
  },

  getCustomPortalTiles: () => delay([...store.customPortalTiles]),

  updateCustomPortalTiles: async (tiles: CustomPortalTile[]) => {
    const normalized = normalizePortalLayout(
      store.portalModules,
      tiles.map((t) => ({ ...t })),
      store.portalTileSettings.primaryTileLimit
    );
    store.portalModules = normalized.modules;
    store.customPortalTiles = normalized.customTiles;
    return delay(store.customPortalTiles);
  },

  getCompanyMasterPortalModules: () => delay(store.companyMasterPortalModules.map((m) => ({ ...m }))),

  updateCompanyMasterPortalModules: async (modules: PortalModuleConfig[]) => {
    const normalized = normalizePortalLayout(
      modules.map((m) => ({ ...m })),
      store.companyMasterCustomPortalTiles,
      store.companyMasterPrimaryTileLimit
    );
    store.companyMasterPortalModules = normalized.modules;
    store.companyMasterCustomPortalTiles = normalized.customTiles;
    return delay(store.companyMasterPortalModules);
  },

  getCompanyMasterCustomPortalTiles: () =>
    delay(store.companyMasterCustomPortalTiles.map((t) => ({ ...t }))),

  updateCompanyMasterCustomPortalTiles: async (tiles: CustomPortalTile[]) => {
    const normalized = normalizePortalLayout(
      store.companyMasterPortalModules,
      tiles.map((t) => ({ ...t })),
      store.companyMasterPrimaryTileLimit
    );
    store.companyMasterPortalModules = normalized.modules;
    store.companyMasterCustomPortalTiles = normalized.customTiles;
    return delay(store.companyMasterCustomPortalTiles);
  },

  getCompanyMasterPrimaryTileLimit: () => delay(store.companyMasterPrimaryTileLimit),

  updateCompanyMasterPrimaryTileLimit: async (primaryTileLimit: number) => {
    store.companyMasterPrimaryTileLimit = Math.max(1, Math.floor(primaryTileLimit));
    const normalized = normalizePortalLayout(
      store.companyMasterPortalModules,
      store.companyMasterCustomPortalTiles,
      store.companyMasterPrimaryTileLimit
    );
    store.companyMasterPortalModules = normalized.modules;
    store.companyMasterCustomPortalTiles = normalized.customTiles;
    return delay(store.companyMasterPrimaryTileLimit);
  },

  resetBuildingPortalLayoutToMaster: async () => {
    store.portalModules = store.companyMasterPortalModules.map((m) => ({ ...m }));
    store.customPortalTiles = store.companyMasterCustomPortalTiles.map((t) => ({ ...t }));
    store.portalTileSettings = {
      ...store.portalTileSettings,
      primaryTileLimit: store.companyMasterPrimaryTileLimit,
      useMasterLayout: true,
    };
    return delay(true);
  },

  getRegistrationFieldOptions: () =>
    delay(store.registrationFieldOptions.map((f) => ({ ...f }))),

  updateRegistrationFieldOptions: async (fields: RegistrationFieldOption[]) => {
    store.registrationFieldOptions = fields.map((f) => ({ ...f }));
    return delay(store.registrationFieldOptions);
  },

  getProfileFieldOptions: () => delay(store.profileFieldOptions.map((f) => ({ ...f }))),

  updateProfileFieldOptions: async (fields: ProfileFieldOption[]) => {
    store.profileFieldOptions = fields.map((f) => ({ ...f }));
    return delay(store.profileFieldOptions);
  },

  getBoardApprovals: (archived = false) =>
    delay(store.boardApprovals.filter((a) => a.archived === archived)),

  getPendingBoardApprovalCount: () =>
    delay(
      store.boardApprovals.filter((a) => !a.archived && a.status === "Pending").length
    ),

  createBoardApproval: async (input: CreateBoardApprovalInput) => {
    const item: BoardApproval = {
      id: String(Date.now()),
      title: input.title,
      description: input.description,
      created: new Date().toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      }),
      archived: false,
      status: "Pending",
      approvedVotes: 0,
      disapprovedVotes: 0,
      votes: "0 of 3 voted",
      vendor: input.vendor ?? "",
      type: input.type ?? "",
      amount: input.amount ?? "",
      items: input.items ?? "",
      unread: true,
    };
    store.boardApprovals = [item, ...store.boardApprovals];
    return delay(item);
  },

  archiveBoardApproval: async (id: string) => {
    store.boardApprovals = store.boardApprovals.map((a) =>
      a.id === id
        ? {
            ...a,
            archived: true,
            closed:
              a.closed ??
              new Date().toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
              }),
            unread: false,
          }
        : a
    );
    return delay(store.boardApprovals.find((a) => a.id === id) ?? null);
  },

  markBoardApprovalRead: async (id: string) => {
    store.boardApprovals = store.boardApprovals.map((a) =>
      a.id === id ? { ...a, unread: false } : a
    );
    return delay(store.boardApprovals.find((a) => a.id === id) ?? null);
  },

  getDocumentFolders: () => delay([...store.documentFolders]),

  getDocumentStorageStats: (): Promise<DocumentStorageStats> => {
    const usedMb = 58;
    return delay({ usedMb, totalMb: 1000 });
  },

  getDocuments: (folderId: string) =>
    delay(store.documents.filter((d) => d.folderId === folderId)),

  createDocument: async (doc: CreateDocumentInput) => {
    const item: DocumentFile = { ...doc, id: String(Date.now()) };
    store.documents = [item, ...store.documents];
    return delay(item);
  },

  deleteDocument: async (id: string) => {
    store.documents = store.documents.filter((d) => d.id !== id);
  },

  getEvents: (options?: { type?: AdminEventType; adminOnly?: boolean }) => {
    let list = [...store.events];
    if (options?.type) {
      list = list.filter((e) => (e.eventType ?? "once") === options.type);
    }
    if (options?.adminOnly === true) {
      list = list.filter((e) => e.adminOnly);
    } else if (options?.adminOnly === false) {
      list = list.filter((e) => !e.adminOnly);
    }
    return delay(list);
  },

  createEvent: async (event: CreateCalendarEventInput) => {
    const item: CalendarEvent = { ...event, id: String(Date.now()) };
    store.events = [item, ...store.events];
    return delay(item);
  },

  updateEvent: async (id: string, updates: Partial<CalendarEvent>) => {
    store.events = store.events.map((e) => (e.id === id ? { ...e, ...updates } : e));
    return delay(store.events.find((e) => e.id === id) ?? null);
  },

  deleteEvent: async (id: string) => {
    store.events = store.events.filter((e) => e.id !== id);
  },

  getFaqs: () => delay([...store.faqs]),

  createFaq: async (faq: Omit<FaqItem, "id">) => {
    const item: FaqItem = { ...faq, id: String(Date.now()) };
    store.faqs = [item, ...store.faqs];
    return delay(item);
  },

  updateFaq: async (id: string, updates: Partial<FaqItem>) => {
    store.faqs = store.faqs.map((f) => (f.id === id ? { ...f, ...updates } : f));
    return delay(store.faqs.find((f) => f.id === id) ?? null);
  },

  deleteFaq: async (id: string) => {
    store.faqs = store.faqs.filter((f) => f.id !== id);
  },

  getGalleryAlbums: () => delay([...store.galleryAlbums]),

  createAlbum: async (title: string) => {
    const item: GalleryAlbum = { id: String(Date.now()), title, photoCount: 0 };
    store.galleryAlbums = [item, ...store.galleryAlbums];
    return delay(item);
  },

  updateAlbum: async (id: string, updates: Partial<GalleryAlbum>) => {
    store.galleryAlbums = store.galleryAlbums.map((a) =>
      a.id === id ? { ...a, ...updates } : a
    );
    return delay(store.galleryAlbums.find((a) => a.id === id) ?? null);
  },

  deleteAlbum: async (id: string) => {
    store.galleryAlbums = store.galleryAlbums.filter((a) => a.id !== id);
  },

  getIncidentReports: (
    archived = false,
    filters?: { unit?: string; owner?: string }
  ) =>
    delay(
      store.incidentReports.filter((r) => {
        if (r.archived !== archived) return false;
        if (filters?.unit && filters.unit !== "all" && r.unit !== filters.unit) return false;
        if (filters?.owner && filters.owner !== "all" && r.resident !== filters.owner) return false;
        return true;
      })
    ),

  getIncidentReportById: (id: string) =>
    delay(store.incidentReports.find((r) => r.id === id) ?? null),

  createIncidentReport: async (input: CreateAdminIncidentReportInput) => {
    const resolvedType = ensureIncidentCategory(input.reportType);
    const id = String(1300000 + store.incidentReports.length + 1);
    const createdBy = input.createdBy ?? "Admin";
    const item: AdminIncidentReport = {
      id,
      incidentDate: input.incidentDate,
      incidentTime: input.incidentTime,
      severity: input.severity,
      reportType: resolvedType,
      location: input.location,
      description: input.description,
      status: input.status ?? "Pending",
      archived: false,
      createdBy,
      submittedAt: new Date().toLocaleString(),
      unit: input.unit ?? "—",
      resident: createdBy,
      visibility: "All Admins",
      assignedToAdmin: input.assignedToAdmin ?? "All Admins",
      adminSeverity: input.severity,
      adminType: resolvedType,
      pendingReply: input.pendingReply ?? "N/A",
      resolutionTime: "—",
      unread: false,
      adminComments: [],
      publicComments: [],
      attachments: [],
    };
    store.incidentReports = [item, ...store.incidentReports];
    return delay(item);
  },

  addIncidentReportComment: async (
    id: string,
    comment: Omit<Comment, "id">,
    visibility: "admin" | "public"
  ) => {
    const c: Comment = { ...comment, id: String(Date.now()), visibility };
    store.incidentReports = store.incidentReports.map((r) => {
      if (r.id !== id) return r;
      if (visibility === "admin") {
        return { ...r, adminComments: [...r.adminComments, c] };
      }
      return { ...r, publicComments: [...r.publicComments, c] };
    });
    return delay(c);
  },

  updateIncidentReport: async (id: string, updates: Partial<AdminIncidentReport>) => {
    store.incidentReports = store.incidentReports.map((r) =>
      r.id === id ? { ...r, ...updates } : r
    );
    return delay(store.incidentReports.find((r) => r.id === id) ?? null);
  },

  archiveIncidentReport: async (id: string) => {
    store.incidentReports = store.incidentReports.map((r) =>
      r.id === id ? { ...r, archived: true } : r
    );
  },

  markIncidentReportRead: async (id: string) => {
    store.incidentReports = store.incidentReports.map((r) =>
      r.id === id ? { ...r, unread: false } : r
    );
  },

  getIncidentCategories: () => delay([...store.incidentCategories]),

  createIncidentCategory: async (name: string, status: "active" | "inactive" = "active") => {
    const normalized = normalizeCategoryName(name);
    if (!normalized) throw new Error("Incident category name is required.");
    const existing = store.incidentCategories.find((category) =>
      isSameCategoryName(category.name, normalized)
    );
    if (existing) {
      if (existing.status !== status) {
        existing.status = status;
      }
      return delay(existing);
    }
    const item: IncidentReportCategory = {
      id: String(Date.now()),
      status,
      name: normalized,
      usageCount: 0,
    };
    store.incidentCategories = [item, ...store.incidentCategories];
    return delay(item);
  },

  updateIncidentCategory: async (id: string, updates: Partial<IncidentReportCategory>) => {
    store.incidentCategories = store.incidentCategories.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    return delay(store.incidentCategories.find((c) => c.id === id) ?? null);
  },

  getIncidentContactEmails: () => delay([...store.incidentContactEmails]),

  createIncidentContactEmail: async (email: string) => {
    const item: IncidentContactEmail = {
      id: String(Date.now()),
      email,
      status: "active",
    };
    store.incidentContactEmails = [...store.incidentContactEmails, item];
    return delay(item);
  },

  updateIncidentContactEmail: async (id: string, updates: Partial<IncidentContactEmail>) => {
    store.incidentContactEmails = store.incidentContactEmails.map((e) =>
      e.id === id ? { ...e, ...updates } : e
    );
    return delay(store.incidentContactEmails.find((e) => e.id === id) ?? null);
  },

  deleteIncidentContactEmail: async (id: string) => {
    store.incidentContactEmails = store.incidentContactEmails.filter((e) => e.id !== id);
  },

  getAdminUser: () => delay({ ...store.adminUser }),

  updateAdminUser: async (updates: UpdateAdminUserInput) => {
    const firstName = updates.firstName ?? store.adminUser.firstName;
    const lastName = updates.lastName ?? store.adminUser.lastName;
    store.adminUser = {
      ...store.adminUser,
      ...updates,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`.trim(),
      phone: updates.telMobile ?? store.adminUser.telMobile ?? store.adminUser.phone,
    };
    return delay(store.adminUser);
  },

  getAdminEmails: () => delay([...seedAdminEmails]),

  getAdminEmailById: (id: string) => delay(seedAdminEmails.find((e) => e.id === id) ?? null),

  getAdminNotificationPreferences: () => delay([...store.adminNotificationPrefs]),

  updateAdminNotificationPreference: async (id: string, enabled: boolean) => {
    store.adminNotificationPrefs = store.adminNotificationPrefs.map((p) =>
      p.id === id ? { ...p, enabled } : p
    );
  },

  getBuildingExternalData: () => delay({ ...store.buildingExternalData }),

  createStripeAccount: async (input: CreateStripeAccountInput) => {
    store.buildingExternalData = {
      ...store.buildingExternalData,
      stripe: {
        connected: true,
        country: input.country,
        accountNumber: input.accountNumber,
        routingNumber: input.routingNumber,
        currency: input.currency,
      },
    };
    return delay({ ...store.buildingExternalData });
  },

  disconnectQuickBooksOnline: async () => {
    store.buildingExternalData = {
      ...store.buildingExternalData,
      quickbooks: { qboConnected: false, companyId: undefined },
    };
    return delay({ ...store.buildingExternalData });
  },

  importQuickBooksUsers: async () => {
    await delay(null);
    return delay({ imported: 12, skipped: 3 });
  },

  getBuildingAdmins: () => delay([...store.buildingAdmins]),

  getBuildingAdmin: (id: string) => delay(store.buildingAdmins.find((a) => a.id === id)),

  createBuildingAdmin: async (input: CreateBuildingAdminInput) => {
    const roleLabel =
      BUILDING_ADMIN_ROLES.find((r) => r.value === input.role)?.label ?? input.role;
    const admin: BuildingAdmin = {
      id: `ba-${Date.now()}`,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      name: `${input.firstName.trim()} ${input.lastName.trim()}`,
      email: input.email?.trim() ?? "",
      role: roleLabel,
      status: "active",
      lastLogin: "",
    };
    store.buildingAdmins = [...store.buildingAdmins, admin];
    return delay(admin);
  },

  updateBuildingAdmin: async (id: string, input: UpdateBuildingAdminInput) => {
    const idx = store.buildingAdmins.findIndex((a) => a.id === id);
    if (idx < 0) return delay(undefined);
    const current = store.buildingAdmins[idx];
    const roleLabel = input.role
      ? BUILDING_ADMIN_ROLES.find((r) => r.value === input.role)?.label ?? input.role
      : current.role;
    const firstName = input.firstName?.trim() ?? current.firstName;
    const lastName = input.lastName?.trim() ?? current.lastName;
    const updated: BuildingAdmin = {
      ...current,
      ...input,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      email: input.email?.trim() ?? current.email,
      role: roleLabel,
    };
    store.buildingAdmins = store.buildingAdmins.map((a) => (a.id === id ? updated : a));
    return delay(updated);
  },

  emailBuildingAdminLoginDetails: async (id: string) => {
    const admin = store.buildingAdmins.find((a) => a.id === id);
    return delay(!!admin);
  },

  getBuildingRolePermissions: (role: string) => {
    const found = store.buildingRolePermissions.find((r) => r.role === role);
    if (found) return delay(found.permissions.map((p) => ({ ...p })));
    return delay(createDefaultBuildingPermissionsForRole(role));
  },

  saveBuildingRolePermissions: async (role: string, permissions: PermissionModuleRow[]) => {
    const idx = store.buildingRolePermissions.findIndex((r) => r.role === role);
    const next = permissions.map((p) => ({ ...p }));
    if (idx >= 0) {
      store.buildingRolePermissions[idx].permissions = next;
    } else {
      store.buildingRolePermissions.push({ role, permissions: next });
    }
    return delay(next);
  },

  getBoardMembers: () => delay([...store.boardMembers]),

  getBoardMemberApplications: () =>
    delay([...store.boardMemberApplications].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))),

  getBoardMemberApplicationById: (id: string) =>
    delay(store.boardMemberApplications.find((a) => a.id === id) ?? null),

  getUnreadBoardApplicationCount: () =>
    delay(store.boardMemberApplications.filter((a) => a.unread).length),

  updateBoardMemberApplicationStatus: async (
    id: string,
    status: BoardMemberApplication["status"]
  ) => {
    store.boardMemberApplications = store.boardMemberApplications.map((a) =>
      a.id === id ? { ...a, status, unread: false } : a
    );
    return delay(store.boardMemberApplications.find((a) => a.id === id) ?? null);
  },

  markBoardApplicationRead: async (id: string) => {
    store.boardMemberApplications = store.boardMemberApplications.map((a) =>
      a.id === id ? { ...a, unread: false } : a
    );
    return delay(store.boardMemberApplications.find((a) => a.id === id) ?? null);
  },

  getAllFireSafetySubmissions: () =>
    delay(
      [...store.fireSafetySubmissions].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    ),

  getFireSafetySubmissionById: (id: string) =>
    delay(store.fireSafetySubmissions.find((s) => s.id === id) ?? null),

  getBuildingStatusCertificates: (archived: boolean) =>
    delay(store.buildingCertificateRequests.filter((r) => r.archived === archived)),

  getBuildingStatusCertificateDetail: async (id: string): Promise<CertificateDetail | undefined> => {
    await delay(undefined);
    const row = store.buildingCertificateRequests.find((r) => r.id === id);
    if (!row) return undefined;
    return certificateDetailFromRow(row);
  },

  markBuildingStatusCertificateRead: async (id: string) => {
    store.buildingCertificateRequests = store.buildingCertificateRequests.map((r) =>
      r.id === id ? { ...r, unread: false } : r
    );
    return delay(undefined);
  },

  getBoardElections: () =>
    delay(store.boardElections.map((e) => withResolvedStatus(e))),

  getBoardElectionById: (id: string) => {
    const election = store.boardElections.find((e) => e.id === id);
    return delay(election ? withResolvedStatus(election) : null);
  },

  createBoardElection: async (input: CreateBoardElectionInput) => {
    const item: BoardElection = {
      id: `election-${Date.now()}`,
      title: input.title,
      description: "",
      status: "draft",
      opensAt: new Date().toISOString().slice(0, 10),
      closesAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      createdAt: new Date().toISOString().slice(0, 10),
      residentTypes: ["Owners", "Tenants", "Occupants", "Board Members"],
      anonymous: true,
    };
    store.boardElections = [item, ...store.boardElections];
    return delay(item);
  },

  updateBoardElection: async (id: string, updates: Partial<BoardElection>) => {
    store.boardElections = store.boardElections.map((e) =>
      e.id === id ? { ...e, ...updates } : e
    );
    const election = store.boardElections.find((e) => e.id === id);
    return delay(election ? withResolvedStatus(election) : null);
  },

  archiveBoardElection: async (id: string) => {
    store.boardElections = store.boardElections.map((e) =>
      e.id === id ? { ...e, status: "archived" } : e
    );
    const election = store.boardElections.find((e) => e.id === id);
    return delay(election ?? null);
  },

  getElectionPositions: (electionId: string) =>
    delay(
      store.electionPositions
        .filter((p) => p.electionId === electionId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    ),

  addElectionPosition: async (electionId: string, input: CreateElectionPositionInput) => {
    const existing = store.electionPositions.filter((p) => p.electionId === electionId);
    const item: ElectionPosition = {
      id: `pos-${Date.now()}`,
      electionId,
      title: input.title,
      sortOrder: input.sortOrder ?? existing.length + 1,
      seatsAvailable: input.seatsAvailable ?? 1,
    };
    store.electionPositions = [...store.electionPositions, item];
    return delay(item);
  },

  updateElectionPosition: async (id: string, updates: Partial<ElectionPosition>) => {
    store.electionPositions = store.electionPositions.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    );
    return delay(store.electionPositions.find((p) => p.id === id) ?? null);
  },

  removeElectionPosition: async (id: string) => {
    const position = store.electionPositions.find((p) => p.id === id);
    if (!position) return delay(false);
    store.electionPositions = store.electionPositions.filter((p) => p.id !== id);
    store.electionCandidates = store.electionCandidates.filter((c) => c.positionId !== id);
    store.electionBallots = store.electionBallots.filter((b) => b.positionId !== id);
    return delay(true);
  },

  getElectionCandidates: (positionId: string) =>
    delay(store.electionCandidates.filter((c) => c.positionId === positionId)),

  addElectionCandidate: async (positionId: string, input: CreateElectionCandidateInput) => {
    const item: ElectionCandidate = {
      id: `cand-${Date.now()}`,
      positionId,
      name: input.name,
      unit: input.unit,
      bio: input.bio,
      applicationId: input.applicationId,
    };
    store.electionCandidates = [...store.electionCandidates, item];
    return delay(item);
  },

  updateElectionCandidate: async (id: string, updates: Partial<ElectionCandidate>) => {
    store.electionCandidates = store.electionCandidates.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    return delay(store.electionCandidates.find((c) => c.id === id) ?? null);
  },

  removeElectionCandidate: async (id: string) => {
    store.electionCandidates = store.electionCandidates.filter((c) => c.id !== id);
    store.electionBallots = store.electionBallots.filter((b) => b.candidateId !== id);
    return delay(true);
  },

  getElectionBallots: (electionId: string) =>
    delay(store.electionBallots.filter((b) => b.electionId === electionId)),

  getEligibleUnitCount: () => delay(getEligibleUnitCount()),

  getElectionResults: async (electionId: string): Promise<ElectionResults> => {
    const positions = store.electionPositions
      .filter((p) => p.electionId === electionId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const ballots = store.electionBallots.filter((b) => b.electionId === electionId);

    const positionResults = positions.map((pos) => {
      const candidates = store.electionCandidates.filter((c) => c.positionId === pos.id);
      const positionBallots = ballots.filter((b) => b.positionId === pos.id);
      return {
        positionId: pos.id,
        positionTitle: pos.title,
        totalBallots: positionBallots.length,
        candidates: candidates.map((c) => ({
          candidateId: c.id,
          name: c.name,
          unit: c.unit,
          votes: positionBallots.filter((b) => b.candidateId === c.id).length,
        })),
      };
    });

    return delay({
      electionId,
      eligibleUnits: getEligibleUnitCount(),
      positions: positionResults,
    });
  },
};
