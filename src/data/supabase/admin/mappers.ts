import type {
  AdminIncidentReport,
  AdminNewsItem,
  AdminServiceRequest,
  AdminSuggestion,
  AgmMeeting,
  AmenityBooking,
  BoardApproval,
  BoardElection,
  BoardMember,
  BoardMemberApplication,
  BuildingDefinition,
  BuildingAmenitySettings,
  BuildingLockerGroup,
  BuildingParkingGroup,
  BuildingReminder,
  BuildingTaxSettings,
  BuildingUnitGroup,
  BuildingUnitGroupDefinition,
  CalendarEvent,
  Comment,
  DocumentFile,
  ElectionBallot,
  ElectionCandidate,
  ElectionPosition,
  FaqItem,
  FireSafetySubmission,
  GalleryAlbum,
  IncidentContactEmail,
  IncidentReportAttachment,
  IncidentReportCategory,
  MasterReportRow,
  ParkingRequest,
  Poll,
  PollAttachment,
  PollQuestion,
  PollResponse,
  ServiceRequestCategory,
} from "../../../resident/data/types";
import { todayIsoDate } from "../base";
import { formatUsDate } from "./shared";

export function mapAdminNews(row: Record<string, unknown>): AdminNewsItem {
  return {
    id: row.id as string,
    title: row.title as string,
    date: String(row.news_date ?? todayIsoDate()),
    body: row.body as string,
    status: row.status as AdminNewsItem["status"],
    expires: row.expires ? String(row.expires) : undefined,
    emailDelivered: row.email_delivered as number,
    emailTotal: row.email_total as number,
    emailStats: row.email_stats as AdminNewsItem["emailStats"],
    noticeHistoryId: row.notice_history_id as string | undefined,
    postTime: row.post_time as string | undefined,
    noNotifications: row.no_notifications as boolean,
    residentTypes: (row.resident_types as string[]) ?? [],
    adminCcTypes: (row.admin_cc_types as string[]) ?? [],
    showToFilter: row.show_to_filter as string,
    editHistory: (row.edit_history as AdminNewsItem["editHistory"]) ?? [],
    lastUpdatedBy: row.last_updated_by as string | undefined,
    lastUpdatedAt: row.last_updated_at ? String(row.last_updated_at) : undefined,
    archived: row.archived as boolean,
    unread: row.unread as boolean,
    imageUrl: (row.image_url as string) || undefined,
    attachmentName: (row.attachment_name as string) || undefined,
    attachmentUrl: (row.attachment_url as string) || undefined,
  };
}

export function mapPoll(row: Record<string, unknown>, questions: PollQuestion[] = []): Poll {
  return {
    id: row.id as string,
    title: row.title as string,
    status: row.status as Poll["status"],
    createdAt: String(row.created_at).slice(0, 10),
    publishedAt: row.updated_at ? String(row.updated_at).slice(0, 10) : undefined,
    expiresAt: row.expires_at ? String(row.expires_at) : undefined,
    responseCount: row.response_count as number,
    noNotifications: row.no_notifications as boolean,
    privacy: row.privacy as string,
    residentTypes: (row.resident_types as string[]) ?? [],
    showToFilter: row.show_to_filter as string,
    agmMeetingId: row.agm_meeting_id ? (row.agm_meeting_id as string) : undefined,
    questions,
  };
}

export function mapPollQuestion(row: Record<string, unknown>): PollQuestion {
  const options = (row.options as string[] | undefined) ?? [];
  return {
    id: row.id as string,
    sortOrder: row.sort_order as number,
    question: row.question_text as string,
    type: row.question_type as string,
    answerOptions: Array.isArray(options) ? options.join("\n") : String(options),
  };
}

export function mapPollResponse(row: Record<string, unknown>): PollResponse {
  const answer = row.answer as { selected?: string } | null;
  return {
    id: row.id as string,
    pollId: row.poll_id as string,
    questionId: row.question_id as string,
    selectedOption: answer?.selected ?? "",
    createdAt: String(row.created_at),
  };
}

export function mapPollAttachment(row: Record<string, unknown>): PollAttachment {
  return {
    id: row.id as string,
    pollId: row.poll_id as string,
    name: row.label as string,
    mimeType: row.kind === "image" ? "image/*" : "application/pdf",
    sizeBytes: 0,
    kind: row.kind as PollAttachment["kind"],
    sourceUrl: row.storage_path ? String(row.storage_path) : row.file_name as string,
    createdAt: String(row.created_at),
  };
}

export function mapAgmMeeting(row: Record<string, unknown>): AgmMeeting {
  return {
    id: row.id as string,
    title: row.title as string,
    scheduledDate: String(row.scheduled_date),
    location: row.location as string,
    notes: row.description as string | undefined,
    status: row.status as AgmMeeting["status"],
    startedAt: row.started_at ? String(row.started_at) : undefined,
    endedAt: row.ended_at ? String(row.ended_at) : undefined,
    createdAt: String(row.created_at).slice(0, 10),
  };
}

export function mapDocumentFile(row: Record<string, unknown>): DocumentFile {
  return {
    id: row.id as string,
    folderId: row.folder_id as string,
    fileType: row.file_type as string,
    title: row.title as string,
    date: String(row.file_date),
    filename: row.filename as string,
    size: row.size_label as string,
    shownTo: row.shown_to as string,
    downloadCount: row.download_count as number,
  };
}

export function mapCalendarEvent(row: Record<string, unknown>): CalendarEvent {
  return {
    id: row.id as string,
    title: row.title as string,
    date: String(row.event_date),
    description: row.description as string | undefined,
    eventType: row.event_type as CalendarEvent["eventType"],
    status: row.status as CalendarEvent["status"],
    created: row.created_at ? String(row.created_at).slice(0, 10) : undefined,
    location: row.location as string | undefined,
    showTo: row.show_to as string | undefined,
    adminOnly: row.admin_only as boolean,
    occurrence: row.occurrence as string | undefined,
    day: row.day_label as string | undefined,
  };
}

export function mapFaq(row: Record<string, unknown>): FaqItem {
  return {
    id: row.id as string,
    question: row.question as string,
    answer: row.answer as string,
  };
}

export function mapGalleryAlbum(row: Record<string, unknown>): GalleryAlbum {
  return {
    id: row.id as string,
    title: row.title as string,
    coverUrl: row.cover_url as string | undefined,
    photoCount: row.photo_count as number,
  };
}

export function mapServiceRequestAttachment(row: Record<string, unknown>): IncidentReportAttachment {
  const previewUrl = (row.storage_path as string) || undefined;
  return {
    id: row.id as string,
    fileName: row.filename as string,
    uploadedBy: "",
    uploadedDate: String(row.uploaded_at).slice(0, 10),
    previewUrl,
    kind: row.kind as IncidentReportAttachment["kind"],
  };
}

export function mapServiceRequest(
  row: Record<string, unknown>,
  comments?: { adminComments: Comment[]; publicComments: Comment[] },
  attachments?: IncidentReportAttachment[]
): AdminServiceRequest {
  return {
    id: row.id as string,
    createdBy: row.created_by_name as string,
    createdAt: String(row.created_at).slice(0, 10),
    contact: row.contact as string,
    location: row.location as string,
    severity: row.severity as string,
    category: row.category as string,
    description: row.description as string,
    status: row.status as string,
    assignedTo: row.assigned_to as string,
    resident: row.resident as string,
    unit: row.unit as string,
    visibility: row.visibility as string,
    permissionToEnter: row.permission_to_enter as string,
    permissionNotes: row.permission_notes as string,
    adminSeverity: (row.admin_severity as string) ?? (row.severity as string),
    adminCategory: (row.admin_category as string) ?? (row.category as string),
    actionRequired: row.action_required as boolean,
    archived: row.archived as boolean,
    pendingReply: row.pending_reply as boolean,
    resolvedBy: row.resolved_by as string | undefined,
    resolvedAt: row.resolved_at ? String(row.resolved_at) : undefined,
    adminComments: comments?.adminComments ?? [],
    publicComments: comments?.publicComments ?? [],
    attachments: attachments ?? [],
  };
}

export function mapServiceCategory(row: Record<string, unknown>, usageCount = 0): ServiceRequestCategory {
  return {
    id: row.id as string,
    name: row.name as string,
    status: "active",
    usageCount,
  };
}

export function mapSuggestion(
  row: Record<string, unknown>,
  comments?: { adminComments: Comment[]; publicComments: Comment[] }
): AdminSuggestion {
  return {
    id: row.id as string,
    text: row.text as string,
    createdAt: String(row.created_at).slice(0, 10),
    status: row.status as string,
    visibility: "All",
    createdBy: "",
    unit: "",
    unread: row.unread as boolean,
    adminComments: comments?.adminComments ?? [],
    publicComments: comments?.publicComments ?? [],
    attachments: [],
  };
}

export function mapIncidentReportAttachment(row: Record<string, unknown>): IncidentReportAttachment {
  const previewUrl = (row.preview_url as string) || (row.storage_path as string) || undefined;
  return {
    id: row.id as string,
    fileName: row.file_name as string,
    uploadedBy: row.uploaded_by as string,
    uploadedDate: String(row.uploaded_at).slice(0, 10),
    previewUrl,
    kind: row.kind as IncidentReportAttachment["kind"],
  };
}

export function mapIncidentReport(
  row: Record<string, unknown>,
  comments?: { adminComments: Comment[]; publicComments: Comment[] },
  attachments?: IncidentReportAttachment[]
): AdminIncidentReport {
  return {
    id: row.id as string,
    incidentDate: String(row.incident_date),
    incidentTime: row.incident_time as string,
    severity: row.severity as string,
    reportType: row.report_type as string,
    location: row.location as string,
    description: row.description as string,
    status: row.status as string,
    archived: row.archived as boolean,
    createdBy: row.created_by_name as string,
    submittedAt: row.submitted_at ? String(row.submitted_at) : String(row.created_at),
    unit: row.unit as string,
    resident: (row.resident as string) ?? "",
    visibility: (row.view_permission as string) ?? "All Admins",
    assignedToAdmin: (row.assigned_to as string) ?? "All Admins",
    adminSeverity: row.severity as string,
    adminType: row.report_type as string,
    pendingReply: row.pending_reply_label as string,
    resolutionTime: row.resolution_time as string | undefined,
    unread: row.unread as boolean,
    resolvedBy: row.resolved_by as string | undefined,
    resolvedAt: row.resolved_at ? String(row.resolved_at) : undefined,
    adminComments: comments?.adminComments ?? [],
    publicComments: comments?.publicComments ?? [],
    attachments: attachments ?? [],
  };
}

export function mapIncidentCategory(row: Record<string, unknown>, usageCount = 0): IncidentReportCategory {
  return {
    id: row.id as string,
    status: "active",
    name: row.name as string,
    usageCount,
  };
}

export function mapIncidentContactEmail(row: Record<string, unknown>): IncidentContactEmail {
  return {
    id: row.id as string,
    email: row.email as string,
    status: row.label === "inactive" ? "inactive" : "active",
  };
}

export function mapParkingRequest(row: Record<string, unknown>): ParkingRequest {
  return {
    id: row.id as string,
    residentId: (row.profile_id as string) ?? "",
    residentName: row.resident_name as string,
    unit: row.unit as string,
    requestType: row.request_type as ParkingRequest["requestType"],
    status: row.status as ParkingRequest["status"],
    requestedAt: String(row.requested_at),
    assignedSpot: row.assigned_spot as string | undefined,
    approvedAt: row.approved_at ? String(row.approved_at) : undefined,
    paymentAmount: row.payment_amount as string | undefined,
    monthlyCost: row.monthly_cost as string | undefined,
    paymentTypeLabel: row.payment_type_label as string | undefined,
    paymentAt: row.payment_at ? String(row.payment_at) : undefined,
    residentDecisionAt: row.resident_decision_at ? String(row.resident_decision_at) : undefined,
    requestedForNights: row.requested_for_nights as string | undefined,
    waitlistPosition: row.waitlist_position as number | undefined,
  };
}

export function mapAmenityBooking(row: Record<string, unknown>): AmenityBooking {
  return {
    id: row.id as string,
    residentId: (row.profile_id as string) ?? "",
    residentName: row.resident_name as string,
    unit: row.unit as string,
    bookingType: row.booking_type as AmenityBooking["bookingType"],
    bookingDate: String(row.booking_date),
    startTime: row.start_time as string,
    endTime: row.end_time as string,
    guestCount: row.guest_count != null ? Number(row.guest_count) : undefined,
    notes: (row.notes as string) ?? "",
    status: row.status as AmenityBooking["status"],
    paymentAmount: row.payment_amount as string | undefined,
    paymentAt: row.payment_at ? String(row.payment_at) : undefined,
    adminNotes: (row.admin_notes as string) ?? "",
    unread: Boolean(row.unread),
    requestedAt: String(row.requested_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapBuildingAmenitySettings(row: Record<string, unknown>): BuildingAmenitySettings {
  return {
    partyRoomFee: (row.party_room_fee as string) ?? "",
    elevatorInstructions: (row.elevator_instructions as string) ?? "",
    partyRoomInstructions: (row.party_room_instructions as string) ?? "",
  };
}

export function mapFireSafetySubmission(row: Record<string, unknown>): FireSafetySubmission {
  return {
    id: row.id as string,
    unit: row.unit as string,
    uploadedAt: String(row.uploaded_at),
    photoDataUrl: (row.photo_url as string) ?? "",
    notes: row.notes as string | undefined,
  };
}

export function mapCertificateRow(row: Record<string, unknown>, buildingLabel = ""): MasterReportRow {
  return {
    id: row.id as string,
    reportType: "certificates",
    buildingId: row.building_id as string,
    buildingLabel,
    date: String(row.created_at).slice(0, 10),
    title: row.requested_by_name as string,
    status: row.status as string,
    unit: row.unit as string | undefined,
    owner: row.requested_by_name as string | undefined,
    archived: row.archived as boolean,
    unread: row.unread as boolean,
    requestNumber: row.request_number as string | undefined,
    processing: row.delivery_type as string | undefined,
    dueDate: row.date_due ? String(row.date_due) : undefined,
    closingDate: row.closing_date ? String(row.closing_date) : undefined,
  };
}

export function mapBoardApproval(row: Record<string, unknown>): BoardApproval {
  const votesRequired = (row.votes_required as number) ?? 0;
  const votesCollected = (row.votes_collected as number) ?? 0;
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    created: formatUsDate(String(row.created_at)),
    closed: row.closed_at ? formatUsDate(String(row.closed_at)) : undefined,
    archived: row.archived as boolean,
    status: row.status as BoardApproval["status"],
    approvedVotes: row.approved_votes as number,
    disapprovedVotes: row.disapproved_votes as number,
    votes: `${votesCollected} of ${votesRequired || 3} voted`,
    vendor: row.vendor as string,
    type: row.approval_type as string,
    amount: row.amount as string,
    items: row.items as string,
    unread: row.unread as boolean,
  };
}

export function mapBoardMember(row: Record<string, unknown>): BoardMember {
  return {
    id: row.id as string,
    name: row.name as string,
    unit: row.unit as string,
    role: row.role as string,
    termEndDate: row.term_end_date ? String(row.term_end_date) : "",
  };
}

export function mapBoardMemberApplication(row: Record<string, unknown>): BoardMemberApplication {
  return {
    id: row.id as string,
    residentName: row.resident_name as string,
    unit: row.unit as string,
    email: row.email as string,
    phone: row.phone as string,
    statement: row.statement as string,
    submittedAt: String(row.submitted_at),
    status: row.status as BoardMemberApplication["status"],
    unread: row.unread as boolean,
  };
}

export function mapBoardElection(row: Record<string, unknown>): BoardElection {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    status: row.status as BoardElection["status"],
    opensAt: row.opens_at ? String(row.opens_at).slice(0, 10) : todayIsoDate(),
    closesAt: row.closes_at ? String(row.closes_at).slice(0, 10) : todayIsoDate(),
    createdAt: String(row.created_at).slice(0, 10),
    residentTypes: (row.resident_types as string[]) ?? [],
    anonymous: row.anonymous as boolean,
  };
}

export function mapElectionPosition(row: Record<string, unknown>): ElectionPosition {
  return {
    id: row.id as string,
    electionId: row.election_id as string,
    title: row.title as string,
    sortOrder: row.sort_order as number,
    seatsAvailable: row.seats_available as number,
  };
}

export function mapElectionCandidate(row: Record<string, unknown>): ElectionCandidate {
  return {
    id: row.id as string,
    positionId: row.position_id as string,
    name: row.name as string,
    unit: row.unit as string,
    bio: row.bio as string | undefined,
  };
}

export function mapElectionBallot(row: Record<string, unknown>, unitLabel = ""): ElectionBallot {
  return {
    id: row.id as string,
    electionId: row.election_id as string,
    positionId: row.position_id as string,
    unit: unitLabel,
    candidateId: row.candidate_id as string,
    votedAt: String(row.cast_at),
  };
}

export function mapBuildingDefinition(row: Record<string, unknown>, linkedIds: string[] = []): BuildingDefinition {
  return {
    condoName: row.condo_name as string,
    corporation: row.corporation as string,
    corpNumber: row.corp_number as string,
    address: row.address as string,
    multiAddressProperty: row.multi_address_property as boolean,
    city: row.city as string,
    postalZip: row.postal_zip as string,
    country: row.country as string,
    province: row.province as string,
    propertyPhone: row.property_phone as string,
    propertyEmail: row.property_email as string,
    accountingEmail: row.accounting_email as string,
    billingEmail: row.billing_email as string,
    visitorParkingOvernightEmail: row.visitor_parking_overnight_email as string | undefined,
    buildingTypes: (row.building_types as string[]) ?? [],
    buildingFeatures: (row.building_features as string[]) ?? [],
    amenities: (row.amenities as string[]) ?? [],
    commonAreas: (row.common_areas as string[]) ?? [],
    linkedBuildingIds: linkedIds,
    imageUrl: (row.image_url as string) || undefined,
  };
}

export function mapBuildingTaxSettings(row: Record<string, unknown> | null): BuildingTaxSettings {
  return {
    masterTaxRate: row?.master_tax_rate != null ? Number(row.master_tax_rate) : null,
    serviceRequestsTaxable: row?.service_requests_taxable as boolean ?? false,
    serviceRequestsTaxRate: row?.service_requests_tax_rate != null ? Number(row.service_requests_tax_rate) : null,
  };
}

export function mapBuildingParkingGroup(row: Record<string, unknown>): BuildingParkingGroup {
  return {
    id: row.id as string,
    floorArea: row.name as string,
    spaces: (row.spots as string[]) ?? [],
    visitorParking: false,
  };
}

export function mapBuildingLockerGroup(row: Record<string, unknown>): BuildingLockerGroup {
  return {
    id: row.id as string,
    floorArea: row.name as string,
    lockers: (row.lockers as string[]) ?? [],
  };
}

export function mapBuildingReminder(row: Record<string, unknown>): BuildingReminder {
  return {
    id: row.id as string,
    title: row.title as string,
    body: row.notes as string,
    recipients: "All",
    schedule: String(row.reminder_date),
  };
}

export function mapBuildingUnitGroup(
  units: { id: string; label: string; floor: string; isOccupied?: boolean }[]
): BuildingUnitGroup[] {
  const byFloor = new Map<string, { labels: string[]; occupied: string[] }>();
  for (const u of units) {
    const floor = u.floor || "Default";
    const group = byFloor.get(floor) ?? { labels: [], occupied: [] };
    group.labels.push(u.label);
    if (u.isOccupied) group.occupied.push(u.label);
    byFloor.set(floor, group);
  }
  return Array.from(byFloor.entries()).map(([floorArea, group], idx) => ({
    id: `floor-${idx}`,
    floorArea,
    units: group.labels,
    occupiedUnits: group.occupied,
  }));
}

export function mapBuildingUnitGroupDefinition(
  row: Record<string, unknown>,
  unitIds: string[]
): BuildingUnitGroupDefinition {
  return {
    id: row.id as string,
    name: row.name as string,
    unitIds,
  };
}
