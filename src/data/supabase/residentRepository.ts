import {
  isElectionVotingOpen,
  isResidentEligibleForElection,
  todayIsoDate,
  withResolvedStatus,
} from "../../admin/data/electionUtils";
import type { ArrangeTile } from "../../resident/data/portalTileLayout";
import type { ResidentRepository } from "../../resident/data/repository";
import { PARKING_PAYMENT_AMOUNTS } from "../../resident/data/types";
import { parsePollAnswerOptions } from "../../shared/pollUtils";
import type {
  ParkingRequest,
  ParkingRequestType,
  PollQuestion,
  PollResponse,
  SubmitPollResponseInput,
  ResidentDetailSection,
  ResidentDetailSectionData,
  ResidentGuest,
  ResidentKeyFob,
  ResidentPet,
  ResidentPurchaseMaintFees,
  ResidentVehicle,
  SubmitElevatorBookingInput,
  SubmitPartyRoomBookingInput,
  BuildingAmenityResourceType,
} from "../../resident/data/types";
import {
  mapAgmMeeting,
  mapAmenityBooking,
  mapBoardElection,
  mapBoardMember,
  mapBoardMemberApplication,
  mapBuildingAmenityResource,
  mapBuildingAmenitySettings,
  mapElectionBallot,
  mapElectionCandidate,
  mapElectionPosition,
  mapFireSafetySubmission,
  mapIncidentCategory,
  mapParkingRequest,
  mapPoll,
  mapPollAttachment,
  mapPollQuestion,
  mapPollResponse,
} from "./admin/mappers";
import { ensureDefaultDocumentFolders } from "./admin/documentFolders";
import { ensureDefaultServiceCategoriesForBuilding } from "./admin/operationsRepository";
import { buildingIdOrThrow, mapDbError, nowIso, sb, todayIsoDate } from "./base";
import {
  DOCUMENT_FOLDER_LIST_COLUMNS,
  DOCUMENT_FILE_LIST_COLUMNS,
  INCIDENT_CATEGORY_COLUMNS,
  NEWS_LIST_COLUMNS,
  RESIDENT_INCIDENT_LIST_COLUMNS,
  RESIDENT_SERVICE_REQUEST_LIST_COLUMNS,
  ADMIN_USER_PROFILE_COLUMNS,
} from "./queryColumns";
import { getBuildingDocumentSignedUrl, formatFileSize, getGalleryPhotoSignedUrl, inferDocumentFileType, removeBuildingDocument, uploadBuildingDocument } from "./storage";
import { supabaseChatRepository } from "./chatRepository";
import { ensureActiveBuildingForUser } from "./buildingContext";
import { ensureIncidentCategory, insertComment, insertIncidentReportAttachment, insertServiceRequestAttachment, loadIncidentReportAttachments, loadServiceRequestAttachments } from "./admin/shared";
import { fileToAttachmentPayload } from "../../shared/attachmentUtils";
import type { ProfileCompletionPolicy, ProfileFieldOption } from "../../resident/data/types";
import type { ProfileCompletionSavePayload } from "../../resident/data/repository";
import {
  clearProfileCompletedIfIncomplete,
  markProfileCompleted,
  resolveProfileCompletionStatus,
  type ProfileCompletionStatus,
} from "./profileCompletion";
import {
  loadOccupancyProfileDetails,
  saveOccupancyProfileSection,
} from "./occupancyProfileDetails";
import { resolveProfileFieldOptions } from "./profileFieldOptions";

type ProfileCompletionProfileRow = {
  first_name: string;
  last_name: string;
  email: string;
  timezone: string;
  tel_home: string | null;
  tel_mobile: string | null;
  tel_business: string | null;
  birth_month: number | null;
  birth_day: number | null;
};

const PROFILE_COMPLETION_PROFILE_COLUMNS =
  "first_name, last_name, email, timezone, tel_home, tel_mobile, tel_business, birth_month, birth_day";

async function loadProfileCompletionPolicy(buildingId: string): Promise<ProfileCompletionPolicy> {
  const { data, error } = await sb()
    .from("portal_settings")
    .select(
      "profile_completion_enabled, profile_completion_resident_types, profile_completion_soft_login_count, profile_completion_block_login_count"
    )
    .eq("building_id", buildingId)
    .maybeSingle();
  mapDbError(error);
  return {
    enabled: data?.profile_completion_enabled ?? false,
    residentTypes: (data?.profile_completion_resident_types ?? ["Owner", "Absentee Owner"]) as ProfileCompletionPolicy["residentTypes"],
    softLoginCount: data?.profile_completion_soft_login_count ?? 2,
    blockLoginCount: data?.profile_completion_block_login_count ?? 3,
  };
}

async function loadProfileFieldOptions(buildingId: string): Promise<ProfileFieldOption[]> {
  const { data, error } = await sb()
    .from("profile_field_options")
    .select("*")
    .eq("building_id", buildingId);
  mapDbError(error);
  return resolveProfileFieldOptions(data ?? []);
}

async function evaluateProfileCompletionStatus(): Promise<ProfileCompletionStatus> {
  const userId = await authUserId();
  const buildingId = await bid();

  const { data: occupancy, error: occupancyError } = await sb()
    .from("unit_occupancies")
    .select("id, profile_id, resident_type, profile_completion_login_count, profile_completed_at")
    .eq("profile_id", userId)
    .eq("building_id", buildingId)
    .is("archived_at", null)
    .maybeSingle();
  mapDbError(occupancyError);

  if (!occupancy) {
    return {
      phase: "none",
      missingFields: [],
      loginCount: 0,
      policyEnabled: false,
      appliesToUser: false,
    };
  }

  const occupancyId = occupancy.id as string;
  const [policy, requiredFields, profileResult, details] = await Promise.all([
    loadProfileCompletionPolicy(buildingId),
    loadProfileFieldOptions(buildingId),
    sb().from("profiles").select(PROFILE_COMPLETION_PROFILE_COLUMNS).eq("id", userId).single(),
    loadOccupancyProfileDetails(occupancyId, buildingId),
  ]);
  mapDbError(profileResult.error);

  const profile: ProfileCompletionProfileRow = {
    first_name: profileResult.data?.first_name ?? "",
    last_name: profileResult.data?.last_name ?? "",
    email: profileResult.data?.email ?? "",
    timezone: profileResult.data?.timezone ?? "",
    tel_home: profileResult.data?.tel_home ?? null,
    tel_mobile: profileResult.data?.tel_mobile ?? null,
    tel_business: profileResult.data?.tel_business ?? null,
    birth_month: profileResult.data?.birth_month ?? null,
    birth_day: profileResult.data?.birth_day ?? null,
  };

  const status = resolveProfileCompletionStatus({
    policy,
    residentType: occupancy.resident_type as string,
    loginCount: occupancy.profile_completion_login_count ?? 0,
    profileCompletedAt: occupancy.profile_completed_at as string | null,
    requiredFields,
    profile,
    details,
  });

  if (status.missingFields.length > 0 && occupancy.profile_completed_at) {
    await clearProfileCompletedIfIncomplete(occupancyId, buildingId, true);
  }

  return status;
}

function buildProfileUpdate(payload: ProfileCompletionSavePayload): Record<string, unknown> {
  const update: Record<string, unknown> = {};
  if (payload.firstName !== undefined) update.first_name = payload.firstName;
  if (payload.lastName !== undefined) update.last_name = payload.lastName;
  if (payload.email !== undefined) update.email = payload.email;
  if (payload.timezone !== undefined) update.timezone = payload.timezone;
  if (payload.homePhone !== undefined) update.tel_home = payload.homePhone || null;
  if (payload.cellPhone !== undefined) update.tel_mobile = payload.cellPhone || null;
  if (payload.workPhone !== undefined) update.tel_business = payload.workPhone || null;
  if (payload.birthMonth !== undefined) update.birth_month = payload.birthMonth;
  if (payload.birthDay !== undefined) update.birth_day = payload.birthDay;
  return update;
}

async function bid() {
  return buildingIdOrThrow();
}

async function authUserId(): Promise<string> {
  const {
    data: { user },
  } = await sb().auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

async function currentOccupancy() {
  const buildingId = await bid();
  const userId = await authUserId();
  const { data, error } = await sb()
    .from("unit_occupancies")
    .select("*, units(id, label, parking_spots, lockers, bike_spaces)")
    .eq("profile_id", userId)
    .eq("building_id", buildingId)
    .is("archived_at", null)
    .maybeSingle();
  mapDbError(error);
  return data;
}

async function loadPollQuestions(pollIds: string[]): Promise<Map<string, PollQuestion[]>> {
  if (pollIds.length === 0) return new Map();
  const { data, error } = await sb()
    .from("poll_questions")
    .select("*")
    .in("poll_id", pollIds)
    .order("sort_order", { ascending: true });
  mapDbError(error);
  const map = new Map<string, PollQuestion[]>();
  for (const row of data ?? []) {
    const pollId = row.poll_id as string;
    const list = map.get(pollId) ?? [];
    list.push(mapPollQuestion(row as Record<string, unknown>));
    map.set(pollId, list);
  }
  return map;
}

function withResidentWaitlistPosition(
  request: ParkingRequest,
  waitingQueue: ParkingRequest[]
): ParkingRequest {
  if (request.status !== "waiting") return request;
  const position = waitingQueue.findIndex((item) => item.id === request.id);
  return { ...request, waitlistPosition: position >= 0 ? position + 1 : undefined };
}

function parsePersonalTiles(json: unknown): ArrangeTile[] | null {
  if (!json || !Array.isArray(json)) return null;
  return json.map((tile) => {
    const row = tile as Record<string, unknown>;
    return {
      id: String(row.id),
      label: String(row.label),
      enabled: Boolean(row.enabled),
      layoutZone: row.layoutZone === "compact" ? "compact" : "primary",
      sortOrder: Number(row.sortOrder),
    };
  });
}

async function computeWaitlistPositions(requests: ParkingRequest[]): Promise<ParkingRequest[]> {
  const byType = new Map<ParkingRequestType, ParkingRequest[]>();
  for (const request of requests) {
    if (request.status !== "waiting") continue;
    const queue = byType.get(request.requestType) ?? [];
    queue.push(request);
    byType.set(request.requestType, queue);
  }
  for (const [type, queue] of byType.entries()) {
    byType.set(
      type,
      queue.sort((a, b) => a.requestedAt.localeCompare(b.requestedAt))
    );
  }
  return requests.map((request) => {
    if (request.status !== "waiting") return request;
    const queue = byType.get(request.requestType) ?? [];
    return withResidentWaitlistPosition(request, queue);
  });
}

const AMENITY_BOOKING_SELECT = "*, building_amenity_resources(name, location_label)";

async function assertActiveAmenityResource(
  buildingId: string,
  resourceId: string,
  resourceType: BuildingAmenityResourceType
) {
  if (!resourceId.trim()) {
    throw new Error("Please select an amenity.");
  }
  const { data, error } = await sb()
    .from("building_amenity_resources")
    .select("id, resource_type, is_active")
    .eq("id", resourceId)
    .eq("building_id", buildingId)
    .maybeSingle();
  mapDbError(error);
  if (!data || data.is_active === false) {
    throw new Error("Selected amenity is not available.");
  }
  if (data.resource_type !== resourceType) {
    throw new Error("Invalid amenity selection.");
  }
}

export const supabaseResidentRepository: ResidentRepository = {
  async getUser() {
    const {
      data: { user },
    } = await sb().auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const buildingId = await ensureActiveBuildingForUser(user.id);
    const { data: profile, error } = await sb()
      .from("profiles")
      .select(`${ADMIN_USER_PROFILE_COLUMNS}, birth_month, birth_day`)
      .eq("id", user.id)
      .single();
    mapDbError(error);
    const { data: occupancy } = await sb()
      .from("unit_occupancies")
      .select(
        "resident_type, unit_id, units(label), buildings:building_id(id, condo_name, address, city, province, postal_zip)"
      )
      .eq("profile_id", user.id)
      .eq("building_id", buildingId)
      .is("archived_at", null)
      .maybeSingle();
    const unit = occupancy?.units as { label: string } | undefined;
    let building = occupancy?.buildings as {
      id: string;
      condo_name: string;
      address: string;
      city: string;
      province: string;
      postal_zip: string;
    } | null;
    if (!building) {
      const { data: buildingRow, error: buildingError } = await sb()
        .from("buildings")
        .select("id, condo_name, address, city, province, postal_zip")
        .eq("id", buildingId)
        .maybeSingle();
      mapDbError(buildingError);
      building = buildingRow as typeof building;
    }
    const buildingAddress = building
      ? [building.address, building.city, building.province, building.postal_zip].filter(Boolean).join(" ")
      : undefined;
    return {
      id: user.id,
      name: profile!.display_name,
      buildingId,
      buildingName: building?.condo_name ?? "Building",
      buildingAddress,
      unit: unit?.label ?? "",
      email: profile!.email,
      phone: (profile!.tel_mobile as string | null) || (profile!.phone as string) || "",
      role: occupancy?.resident_type ?? "Owner",
      birthMonth: profile!.birth_month ?? undefined,
      birthDay: profile!.birth_day ?? undefined,
      firstName: (profile!.first_name as string | null) ?? "",
      lastName: (profile!.last_name as string | null) ?? "",
      timezone: (profile!.timezone as string | null) ?? "",
      homePhone: (profile!.tel_home as string | null) ?? "",
      cellPhone: (profile!.tel_mobile as string | null) ?? "",
      workPhone: (profile!.tel_business as string | null) ?? "",
    };
  },

  async updateUserProfile(input) {
    const {
      data: { user },
    } = await sb().auth.getUser();
    if (!user) throw new Error("Not authenticated");
    await sb()
      .from("profiles")
      .update({
        email: input.email,
        phone: input.phone,
        birth_month: input.birthMonth,
        birth_day: input.birthDay,
      })
      .eq("id", user.id);
    return this.getUser();
  },

  async getNews() {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("news_items")
      .select(NEWS_LIST_COLUMNS)
      .eq("building_id", buildingId)
      .eq("archived", false)
      .eq("status", "active");
    mapDbError(error);
    return (data ?? []).map((n) => ({
      id: n.id as string,
      title: n.title as string,
      date: String(n.news_date),
      body: n.body as string,
      imageUrl: (n.image_url as string) || undefined,
      attachmentName: (n.attachment_name as string) || undefined,
      attachmentUrl: (n.attachment_url as string) || undefined,
    }));
  },

  async getNewsById(id) {
    const { data, error } = await sb().from("news_items").select("*").eq("id", id).maybeSingle();
    mapDbError(error);
    return data
      ? {
          id: data.id as string,
          title: data.title as string,
          date: String(data.news_date),
          body: data.body as string,
          imageUrl: (data.image_url as string) || undefined,
          attachmentName: (data.attachment_name as string) || undefined,
          attachmentUrl: (data.attachment_url as string) || undefined,
        }
      : null;
  },

  async getQuickBooksAccountSnapshot() {
    const buildingId = await bid();
    const occ = await currentOccupancy();
    if (!occ) return { connected: false, invoices: [] as any[] };
    const unitId = (occ.units as { id: string } | null)?.id ?? (occ.unit_id as string | undefined);
    if (!unitId) return { connected: false, invoices: [] as any[] };

    const { data: link, error: linkError } = await sb()
      .from("quickbooks_unit_customers")
      .select("customer_id")
      .eq("building_id", buildingId)
      .eq("unit_id", unitId)
      .maybeSingle();
    mapDbError(linkError);
    const customerId = link?.customer_id as string | undefined;
    if (!customerId) return { connected: false, invoices: [] as any[] };

    const { data: invoices, error: invError } = await sb()
      .from("quickbooks_invoices")
      .select("invoice_id, doc_number, txn_date, due_date, total_amt, balance")
      .eq("building_id", buildingId)
      .eq("customer_id", customerId)
      .order("txn_date", { ascending: false });
    mapDbError(invError);

    return {
      connected: true,
      invoices: (invoices ?? []).map((r) => ({
        id: r.invoice_id as string,
        docNumber: (r.doc_number as string) ?? "",
        txnDate: r.txn_date ? String(r.txn_date) : "",
        dueDate: r.due_date ? String(r.due_date) : "",
        total: Number(r.total_amt ?? 0),
        balance: Number(r.balance ?? 0),
      })),
    };
  },

  async getDocumentFolders() {
    const buildingId = await bid();
    await ensureDefaultDocumentFolders(buildingId);
    const { data, error } = await sb()
      .from("document_folders")
      .select(DOCUMENT_FOLDER_LIST_COLUMNS)
      .eq("building_id", buildingId)
      .eq("section", "resident-portal");
    mapDbError(error);
    return (data ?? []).map((f) => ({
      id: f.id as string,
      name: f.name as string,
      section: f.section as "resident-portal",
    }));
  },

  async getDocuments(folderId: string) {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("document_files")
      .select(DOCUMENT_FILE_LIST_COLUMNS)
      .eq("folder_id", folderId)
      .eq("building_id", buildingId);
    mapDbError(error);
    return (data ?? [])
      .filter((d) => String(d.shown_to ?? "") !== "Admin Only")
      .map((d) => ({
        id: d.id as string,
        folderId: d.folder_id as string,
        fileType: d.file_type as string,
        title: d.title as string,
        date: String(d.file_date),
        filename: d.filename as string,
        size: d.size_label as string,
        shownTo: d.shown_to as string,
        downloadCount: d.download_count as number,
      }));
  },

  async getDocumentDownloadUrl(id: string): Promise<string> {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("document_files")
      .select("storage_path, shown_to")
      .eq("id", id)
      .eq("building_id", buildingId)
      .maybeSingle();
    mapDbError(error);
    if (!data?.storage_path) throw new Error("Document file is not available for download.");
    if (String(data.shown_to ?? "") === "Admin Only") {
      throw new Error("This document is not available to residents.");
    }
    return getBuildingDocumentSignedUrl(String(data.storage_path));
  },

  async createDocument(
    file: File,
    input: { folderId: string; title: string }
  ): Promise<{ id: string }> {
    const buildingId = await bid();
    const storagePath = await uploadBuildingDocument(buildingId, file);
    const { data, error } = await sb()
      .from("document_files")
      .insert({
        building_id: buildingId,
        folder_id: input.folderId,
        file_type: inferDocumentFileType(file.name, file.type),
        title: input.title.trim() || file.name,
        file_date: todayIsoDate(),
        filename: file.name,
        storage_path: storagePath,
        size_label: formatFileSize(file.size),
        shown_to: "All Residents",
        download_count: 0,
      })
      .select("id")
      .single();
    if (error) {
      await removeBuildingDocument(storagePath).catch(() => undefined);
      mapDbError(error);
    }
    return { id: data!.id as string };
  },

  async getFaqs() {
    const buildingId = await bid();
    const { data, error } = await sb().from("faq_items").select("*").eq("building_id", buildingId);
    mapDbError(error);
    return (data ?? []).map((f) => ({ id: f.id as string, question: f.question as string, answer: f.answer as string }));
  },

  async getAlbums() {
    const buildingId = await bid();
    const { data, error } = await sb().from("gallery_albums").select("*").eq("building_id", buildingId);
    mapDbError(error);
    return Promise.all(
      (data ?? []).map(async (a) => {
        const coverStoragePath = a.cover_storage_path as string | undefined;
        let coverUrl = a.cover_url as string | undefined;
        if (coverStoragePath) {
          try {
            coverUrl = await getGalleryPhotoSignedUrl(coverStoragePath);
          } catch {
            // keep stored cover_url if signing fails
          }
        }
        return {
          id: a.id as string,
          title: a.title as string,
          coverUrl,
          photoCount: a.photo_count as number,
        };
      })
    );
  },

  async getAlbumPhotos(albumId: string) {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("gallery_photos")
      .select("*")
      .eq("album_id", albumId)
      .eq("building_id", buildingId)
      .order("sort_order", { ascending: true });
    mapDbError(error);
    return Promise.all(
      (data ?? []).map(async (row) => {
        const storagePath = row.storage_path as string | undefined;
        let url = row.url as string;
        if (storagePath) {
          try {
            url = await getGalleryPhotoSignedUrl(storagePath);
          } catch {
            // keep stored url if signing fails
          }
        }
        return {
          id: row.id as string,
          albumId: row.album_id as string,
          url,
          sortOrder: row.sort_order as number,
        };
      })
    );
  },

  async getEvents() {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("calendar_events")
      .select("*")
      .eq("building_id", buildingId)
      .eq("admin_only", false);
    mapDbError(error);
    return (data ?? []).map((e) => ({
      id: e.id as string,
      title: e.title as string,
      date: String(e.event_date),
      description: e.description as string | undefined,
    }));
  },

  async getRsvps() {
    const buildingId = await bid();
    const userId = await authUserId();
    const { data, error } = await sb()
      .from("event_rsvps")
      .select("*")
      .eq("building_id", buildingId)
      .eq("profile_id", userId)
      .order("rsvp_date", { ascending: false });
    mapDbError(error);
    return (data ?? []).map((r) => ({
      id: r.id as string,
      eventTitle: r.event_title as string,
      date: String(r.rsvp_date),
      status: r.status as string,
    }));
  },

  async getEmails() {
    const buildingId = await bid();
    const userId = await authUserId();
    const { data, error } = await sb()
      .from("email_records")
      .select("*")
      .eq("building_id", buildingId)
      .eq("profile_id", userId)
      .order("sent_date", { ascending: false });
    mapDbError(error);
    return (data ?? []).map((e) => ({
      id: e.id as string,
      date: String(e.sent_date),
      subject: e.subject as string,
      status: e.status as "delivered" | "bounced" | "pending",
      body: e.body as string,
    }));
  },

  async getEmailById(id: string) {
    const buildingId = await bid();
    const userId = await authUserId();
    const { data, error } = await sb()
      .from("email_records")
      .select("*")
      .eq("id", id)
      .eq("building_id", buildingId)
      .eq("profile_id", userId)
      .maybeSingle();
    mapDbError(error);
    return data
      ? {
          id: data.id as string,
          date: String(data.sent_date),
          subject: data.subject as string,
          status: data.status as "delivered" | "bounced" | "pending",
          body: data.body as string,
        }
      : null;
  },

  async getNotificationPreferences() {
    const buildingId = await bid();
    const {
      data: { user },
    } = await sb().auth.getUser();
    const { data, error } = await sb()
      .from("notification_preferences")
      .select("*")
      .eq("building_id", buildingId)
      .eq("profile_id", user?.id ?? "");
    mapDbError(error);
    return (data ?? []).map((p) => ({
      id: p.id as string,
      label: p.label as string,
      enabled: p.enabled as boolean,
    }));
  },

  async updateNotificationPreference(id: string, enabled: boolean) {
    const userId = await authUserId();
    const { error } = await sb()
      .from("notification_preferences")
      .update({ enabled })
      .eq("id", id)
      .eq("profile_id", userId);
    mapDbError(error);
  },

  async getServiceRequests() {
    const buildingId = await bid();
    const {
      data: { user },
    } = await sb().auth.getUser();
    const { data, error } = await sb()
      .from("service_requests")
      .select(RESIDENT_SERVICE_REQUEST_LIST_COLUMNS)
      .eq("building_id", buildingId)
      .eq("created_by_profile_id", user?.id ?? "")
      .order("created_at", { ascending: false });
    mapDbError(error);
    return (data ?? []).map((r) => ({
      id: r.id as string,
      createdBy: r.created_by_name as string,
      createdAt: String(r.created_at).slice(0, 10),
      contact: r.contact as string,
      location: r.location as string,
      severity: r.severity as string,
      category: r.category as string,
      description: r.description as string,
      status: r.status as string,
      unread: Boolean(r.unread),
      pendingReply: Boolean(r.pending_reply),
    }));
  },

  async getServiceRequestById(id: string) {
    const buildingId = await bid();
    const userId = await authUserId();
    const { data, error } = await sb()
      .from("service_requests")
      .select("*")
      .eq("id", id)
      .eq("building_id", buildingId)
      .eq("created_by_profile_id", userId)
      .maybeSingle();
    mapDbError(error);
    if (!data) return null;

    const { data: commentRows, error: commentError } = await sb()
      .from("comments")
      .select("*")
      .eq("entity_type", "service_request")
      .eq("entity_id", id)
      .eq("visibility", "public")
      .order("created_at", { ascending: true });
    mapDbError(commentError);

    const publicComments = (commentRows ?? []).map((c) => ({
      id: c.id as string,
      author: c.author_name as string,
      text: c.body as string,
      createdAt: String(c.created_at),
      visibility: "public" as const,
    }));

    const attachments = await loadServiceRequestAttachments(id);

    await this.markServiceRequestRead(id);

    return {
      id: data.id as string,
      createdBy: data.created_by_name as string,
      createdAt: String(data.created_at).slice(0, 10),
      contact: data.contact as string,
      location: data.location as string,
      severity: data.severity as string,
      category: data.category as string,
      description: data.description as string,
      status: data.status as string,
      unread: false,
      pendingReply: Boolean(data.pending_reply),
      visibility: data.visibility as string,
      permissionToEnter: data.permission_to_enter as string,
      permissionNotes: data.permission_notes as string,
      submittedAt: String(data.created_at),
      resolvedBy: (data.resolved_by as string) || undefined,
      resolvedAt: data.resolved_at ? String(data.resolved_at) : undefined,
      publicComments,
      attachments,
    };
  },

  async addServiceRequestComment(id: string, text: string) {
    const buildingId = await bid();
    const userId = await authUserId();
    const { data: request, error: requestError } = await sb()
      .from("service_requests")
      .select("id")
      .eq("id", id)
      .eq("building_id", buildingId)
      .eq("created_by_profile_id", userId)
      .maybeSingle();
    mapDbError(requestError);
    if (!request?.id) throw new Error("Service request not found.");

    const { data: profile } = await sb().from("profiles").select("display_name").eq("id", userId).single();
    return insertComment(
      "service_request",
      id,
      { author: (profile?.display_name as string) || "Resident", text },
      "public"
    );
  },

  async markServiceRequestRead(id: string) {
    const buildingId = await bid();
    const userId = await authUserId();
    const { error } = await sb()
      .from("service_requests")
      .update({ unread: false })
      .eq("id", id)
      .eq("building_id", buildingId)
      .eq("created_by_profile_id", userId);
    mapDbError(error);
  },

  async getServiceCategories() {
    const buildingId = await bid();
    await ensureDefaultServiceCategoriesForBuilding(buildingId);
    const { data, error } = await sb().from("service_request_categories").select("*").eq("building_id", buildingId);
    mapDbError(error);
    return (data ?? []).map((c) => ({ id: c.id as string, name: c.name as string, status: "active" as const, usageCount: 0 }));
  },

  async getBuildingCommonAreas() {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("buildings")
      .select("common_areas")
      .eq("id", buildingId)
      .maybeSingle();
    mapDbError(error);
    return (data?.common_areas as string[]) ?? [];
  },

  async createServiceRequest(input) {
    const buildingId = await bid();
    const {
      data: { user },
    } = await sb().auth.getUser();
    const { data: profile } = await sb().from("profiles").select("display_name").eq("id", user!.id).single();
    const occupancy = await currentOccupancy();
    const unitLabel = (occupancy?.units as { label: string } | undefined)?.label ?? "—";
    const displayName = (profile?.display_name as string) ?? "";
    const resident = unitLabel !== "—" && displayName ? `${unitLabel} - ${displayName}` : displayName || unitLabel;
    const { data, error } = await sb()
      .from("service_requests")
      .insert({
        building_id: buildingId,
        created_by_profile_id: user!.id,
        created_by_name: displayName,
        contact: input.contact,
        location: input.location,
        visibility: input.visibility,
        permission_to_enter: input.permissionToEnter,
        permission_notes: input.permissionNotes,
        severity: input.severity,
        category: input.category,
        description: input.description,
        status: "Received",
        unit: unitLabel,
        resident,
        action_required: true,
        pending_reply: true,
        unread: true,
      })
      .select("*")
      .single();
    mapDbError(error);
    const requestId = data!.id as string;
    if (input.files?.length) {
      for (const file of input.files) {
        const payload = await fileToAttachmentPayload(file);
        await insertServiceRequestAttachment(requestId, payload);
      }
    }
    return {
      id: requestId,
      createdBy: data!.created_by_name as string,
      createdAt: todayIsoDate(),
      contact: data!.contact as string,
      location: data!.location as string,
      severity: data!.severity as string,
      category: data!.category as string,
      description: data!.description as string,
      status: data!.status as string,
    };
  },

  async getIncidentReports() {
    const buildingId = await bid();
    const {
      data: { user },
    } = await sb().auth.getUser();
    const { data, error } = await sb()
      .from("incident_reports")
      .select(RESIDENT_INCIDENT_LIST_COLUMNS)
      .eq("building_id", buildingId)
      .eq("created_by_profile_id", user?.id ?? "")
      .order("submitted_at", { ascending: false, nullsFirst: false });
    mapDbError(error);
    return (data ?? [])
      .filter((r) => r.status !== "Draft")
      .map((r) => ({
        id: r.id as string,
        incidentDate: String(r.incident_date),
        incidentTime: r.incident_time as string,
        severity: r.severity as string,
        reportType: r.report_type as string,
        location: r.location as string,
        description: r.description as string,
        status: r.status as string,
        archived: Boolean(r.archived),
      }));
  },

  async getIncidentCategories() {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("incident_report_categories")
      .select(INCIDENT_CATEGORY_COLUMNS)
      .eq("building_id", buildingId)
      .order("sort_order", { ascending: true });
    mapDbError(error);
    return (data ?? []).map((c) => mapIncidentCategory(c as Record<string, unknown>));
  },

  async createIncidentReport(input) {
    const buildingId = await bid();
    const userId = await authUserId();
    const { data: profile, error: profileError } = await sb()
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .single();
    mapDbError(profileError);
    const occupancy = await currentOccupancy();
    const unit = (occupancy?.units as { label: string } | undefined)?.label ?? "—";
    const displayName = (profile?.display_name as string) ?? "";
    const reportType = await ensureIncidentCategory(input.reportType);
    const { data, error } = await sb()
      .from("incident_reports")
      .insert({
        building_id: buildingId,
        incident_date: input.incidentDate,
        incident_time: input.incidentTime,
        severity: input.severity,
        report_type: reportType,
        location: input.location,
        description: input.description,
        status: "Pending",
        unit,
        resident: displayName,
        view_permission: input.visibility,
        submitted_at: nowIso(),
        pending_reply_label: "N/A",
        unread: true,
        assigned_to: "All Admins",
        created_by_profile_id: userId,
        created_by_name: displayName,
      })
      .select("*")
      .single();
    mapDbError(error);
    const reportId = data!.id as string;
    if (input.files?.length) {
      for (const file of input.files) {
        const payload = await fileToAttachmentPayload(file);
        await insertIncidentReportAttachment(reportId, { ...payload, uploadedBy: displayName });
      }
    }
    return {
      id: reportId,
      incidentDate: input.incidentDate,
      incidentTime: input.incidentTime,
      severity: input.severity,
      reportType,
      location: input.location,
      description: input.description,
      status: data!.status as string,
    };
  },

  async getIncidentReportById(id: string) {
    const buildingId = await bid();
    const userId = await authUserId();
    const { data, error } = await sb()
      .from("incident_reports")
      .select("*")
      .eq("id", id)
      .eq("building_id", buildingId)
      .eq("created_by_profile_id", userId)
      .maybeSingle();
    mapDbError(error);
    if (!data) return null;

    const { data: commentRows, error: commentError } = await sb()
      .from("comments")
      .select("*")
      .eq("entity_type", "incident_report")
      .eq("entity_id", id)
      .eq("visibility", "public")
      .order("created_at", { ascending: true });
    mapDbError(commentError);

    const publicComments = (commentRows ?? []).map((c) => ({
      id: c.id as string,
      author: c.author_name as string,
      text: c.body as string,
      createdAt: String(c.created_at),
      visibility: "public" as const,
    }));

    const attachments = await loadIncidentReportAttachments(id);

    await this.markIncidentReportRead(id);

    return {
      id: data.id as string,
      incidentDate: String(data.incident_date),
      incidentTime: data.incident_time as string,
      severity: data.severity as string,
      reportType: data.report_type as string,
      location: data.location as string,
      description: data.description as string,
      status: data.status as string,
      archived: Boolean(data.archived),
      submittedAt: data.submitted_at ? String(data.submitted_at) : String(data.created_at),
      resolvedBy: (data.resolved_by as string) || undefined,
      resolvedAt: data.resolved_at ? String(data.resolved_at) : undefined,
      pendingReplyLabel: (data.pending_reply_label as string) || undefined,
      publicComments,
      attachments,
    };
  },

  async addIncidentReportComment(id: string, text: string) {
    const buildingId = await bid();
    const userId = await authUserId();
    const { data: report, error: reportError } = await sb()
      .from("incident_reports")
      .select("id")
      .eq("id", id)
      .eq("building_id", buildingId)
      .eq("created_by_profile_id", userId)
      .maybeSingle();
    mapDbError(reportError);
    if (!report?.id) throw new Error("Incident report not found.");

    const { data: profile } = await sb().from("profiles").select("display_name").eq("id", userId).single();
    return insertComment(
      "incident_report",
      id,
      { author: (profile?.display_name as string) || "Resident", text },
      "public"
    );
  },

  async markIncidentReportRead(id: string) {
    const buildingId = await bid();
    const userId = await authUserId();
    const { error } = await sb()
      .from("incident_reports")
      .update({ unread: false })
      .eq("id", id)
      .eq("building_id", buildingId)
      .eq("created_by_profile_id", userId);
    mapDbError(error);
  },

  async getSuggestions() {
    const buildingId = await bid();
    const {
      data: { user },
    } = await sb().auth.getUser();
    const { data, error } = await sb()
      .from("suggestions")
      .select("*")
      .eq("building_id", buildingId)
      .eq("profile_id", user?.id ?? "");
    mapDbError(error);
    return (data ?? []).map((s) => ({
      id: s.id as string,
      text: s.text as string,
      createdAt: String(s.created_at).slice(0, 10),
      status: s.status as string,
    }));
  },

  async createSuggestion(input) {
    const buildingId = await bid();
    const {
      data: { user },
    } = await sb().auth.getUser();
    const { data, error } = await sb()
      .from("suggestions")
      .insert({ building_id: buildingId, profile_id: user!.id, text: input.text, status: "Submitted", unread: true })
      .select("*")
      .single();
    mapDbError(error);
    return {
      id: data!.id as string,
      text: data!.text as string,
      createdAt: todayIsoDate(),
      status: data!.status as string,
    };
  },

  async getStatusCertificates() {
    const buildingId = await bid();
    const {
      data: { user },
    } = await sb().auth.getUser();
    const { data, error } = await sb()
      .from("status_certificates")
      .select("*")
      .eq("building_id", buildingId)
      .eq("requested_by_profile_id", user?.id ?? "");
    mapDbError(error);
    return (data ?? []).map((c) => ({
      id: c.id as string,
      certificateType: c.certificate_type as string,
      unit: c.unit as string,
      requestedBy: c.requested_by_name as string,
      createdAt: String(c.created_at).slice(0, 10),
      status: c.status as string,
      notes: c.notes as string,
      rushProcessing: c.rush_processing as boolean,
    }));
  },

  async createStatusCertificate(input) {
    const buildingId = await bid();
    const {
      data: { user },
    } = await sb().auth.getUser();
    const { data: profile } = await sb().from("profiles").select("display_name").eq("id", user!.id).single();
    const { data, error } = await sb()
      .from("status_certificates")
      .insert({
        building_id: buildingId,
        certificate_type: input.certificateType,
        requested_by_profile_id: user!.id,
        requested_by_name: profile?.display_name ?? "",
        notes: input.notes,
        rush_processing: input.rushProcessing,
        status: "Submitted",
        unit: "",
      })
      .select("*")
      .single();
    mapDbError(error);
    return {
      id: data!.id as string,
      certificateType: data!.certificate_type as string,
      unit: data!.unit as string,
      requestedBy: data!.requested_by_name as string,
      createdAt: todayIsoDate(),
      status: data!.status as string,
      notes: data!.notes as string,
      rushProcessing: data!.rush_processing as boolean,
    };
  },

  async getResidentDetails() {
    const occupancy = await currentOccupancy();
    if (!occupancy) {
      return {
        parkingSpots: [],
        lockers: [],
        keyFobs: [],
        vehicles: [],
        guestList: [],
        bikeSpaces: [],
        pets: [],
        purchaseDateMaintFees: { purchaseDate: "" },
      };
    }

    const buildingId = await bid();
    return loadOccupancyProfileDetails(occupancy.id as string, buildingId);
  },

  async updateResidentDetailSection(section: ResidentDetailSection, data: ResidentDetailSectionData) {
    const buildingId = await bid();
    const occupancy = await currentOccupancy();
    if (!occupancy) throw new Error("No active occupancy found.");
    await saveOccupancyProfileSection(occupancy.id as string, buildingId, section, data);
  },

  async getBoardMembers() {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("board_members")
      .select("*")
      .eq("building_id", buildingId)
      .order("sort_order", { ascending: true });
    mapDbError(error);
    return (data ?? []).map((m) => mapBoardMember(m as Record<string, unknown>));
  },

  async getBoardFaqs() {
    const buildingId = await bid();
    const { data, error } = await sb().from("board_faq_items").select("*").eq("building_id", buildingId);
    mapDbError(error);
    return (data ?? []).map((f) => ({
      id: f.id as string,
      question: f.question as string,
      answer: f.answer as string,
    }));
  },

  async getBoardApplications() {
    const buildingId = await bid();
    const userId = await authUserId();
    const { data, error } = await sb()
      .from("board_member_applications")
      .select("*")
      .eq("building_id", buildingId)
      .eq("profile_id", userId)
      .order("submitted_at", { ascending: false });
    mapDbError(error);
    return (data ?? []).map((a) => mapBoardMemberApplication(a as Record<string, unknown>));
  },

  async submitBoardApplication(input) {
    const buildingId = await bid();
    const userId = await authUserId();
    const { data, error } = await sb()
      .from("board_member_applications")
      .insert({
        building_id: buildingId,
        profile_id: userId,
        resident_name: input.residentName,
        unit: input.unit,
        email: input.email,
        phone: input.phone,
        statement: input.statement,
      })
      .select("*")
      .single();
    mapDbError(error);
    return {
      id: data!.id as string,
      residentName: data!.resident_name as string,
      unit: data!.unit as string,
      email: data!.email as string,
      phone: data!.phone as string,
      statement: data!.statement as string,
      submittedAt: String(data!.submitted_at),
      status: data!.status as "Submitted",
    };
  },

  async getFireSafetySubmissions(unit: string) {
    const buildingId = await bid();
    const userId = await authUserId();
    const { data, error } = await sb()
      .from("fire_safety_submissions")
      .select("*")
      .eq("building_id", buildingId)
      .eq("profile_id", userId)
      .eq("unit", unit)
      .order("uploaded_at", { ascending: false });
    mapDbError(error);
    return (data ?? []).map((s) => mapFireSafetySubmission(s as Record<string, unknown>));
  },

  async getLatestFireSafetySubmission(unit: string) {
    const buildingId = await bid();
    const userId = await authUserId();
    const { data, error } = await sb()
      .from("fire_safety_submissions")
      .select("*")
      .eq("building_id", buildingId)
      .eq("profile_id", userId)
      .eq("unit", unit)
      .order("uploaded_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    mapDbError(error);
    return data ? mapFireSafetySubmission(data as Record<string, unknown>) : null;
  },

  async submitFireSafetyPhoto(input) {
    const buildingId = await bid();
    const {
      data: { user },
    } = await sb().auth.getUser();
    const { data, error } = await sb()
      .from("fire_safety_submissions")
      .insert({
        building_id: buildingId,
        profile_id: user!.id,
        unit: input.unit,
        photo_url: input.photoDataUrl,
        notes: input.notes,
      })
      .select("*")
      .single();
    mapDbError(error);
    return {
      id: data!.id as string,
      unit: data!.unit as string,
      uploadedAt: String(data!.uploaded_at),
      photoDataUrl: data!.photo_url as string,
      notes: data!.notes as string | undefined,
    };
  },

  async getElectionsForResident() {
    const buildingId = await bid();
    const user = await this.getUser();
    const { data, error } = await sb()
      .from("board_elections")
      .select("*")
      .eq("building_id", buildingId)
      .order("created_at", { ascending: false });
    mapDbError(error);
    return (data ?? [])
      .map((e) => withResolvedStatus(mapBoardElection(e as Record<string, unknown>)))
      .filter(
        (e) =>
          e.status !== "draft" &&
          e.status !== "archived" &&
          isResidentEligibleForElection(user.role, e.residentTypes)
      );
  },

  async getElectionById(id: string) {
    const { data, error } = await sb().from("board_elections").select("*").eq("id", id).maybeSingle();
    mapDbError(error);
    return data ? withResolvedStatus(mapBoardElection(data as Record<string, unknown>)) : null;
  },

  async getElectionPositions(electionId: string) {
    const { data, error } = await sb()
      .from("election_positions")
      .select("*")
      .eq("election_id", electionId)
      .order("sort_order", { ascending: true });
    mapDbError(error);
    return (data ?? []).map((p) => mapElectionPosition(p as Record<string, unknown>));
  },

  async getCandidatesForPosition(positionId: string) {
    const { data, error } = await sb()
      .from("election_candidates")
      .select("*")
      .eq("position_id", positionId);
    mapDbError(error);
    return (data ?? []).map((c) => mapElectionCandidate(c as Record<string, unknown>));
  },

  async getBallotsForUnit(electionId: string, unit: string) {
    const buildingId = await bid();
    const { data: unitRow, error: unitError } = await sb()
      .from("units")
      .select("id")
      .eq("building_id", buildingId)
      .eq("label", unit)
      .maybeSingle();
    mapDbError(unitError);
    if (!unitRow) return [];

    const { data, error } = await sb()
      .from("election_ballots")
      .select("*, units(label)")
      .eq("election_id", electionId)
      .eq("unit_id", unitRow.id);
    mapDbError(error);
    return (data ?? []).map((b) => {
      const unitData = b.units as { label: string } | null;
      return mapElectionBallot(b as Record<string, unknown>, unitData?.label ?? unit);
    });
  },

  async castElectionVote(input) {
    const user = await this.getUser();
    const election = await this.getElectionById(input.electionId);
    if (!election) throw new Error("Election not found.");
    if (!isElectionVotingOpen(election)) {
      throw new Error("Voting is not open for this election.");
    }
    if (!isResidentEligibleForElection(user.role, election.residentTypes)) {
      throw new Error("You are not eligible to vote in this election.");
    }

    const occupancy = await currentOccupancy();
    const unitId = occupancy?.unit_id as string | undefined;
    if (!unitId) throw new Error("No unit assigned.");

    const { data: existing, error: existingError } = await sb()
      .from("election_ballots")
      .select("id")
      .eq("election_id", input.electionId)
      .eq("position_id", input.positionId)
      .eq("unit_id", unitId)
      .maybeSingle();
    mapDbError(existingError);
    if (existing) throw new Error("You have already voted for this position.");

    const { data: candidate, error: candidateError } = await sb()
      .from("election_candidates")
      .select("*")
      .eq("id", input.candidateId)
      .maybeSingle();
    mapDbError(candidateError);
    if (!candidate || candidate.position_id !== input.positionId) {
      throw new Error("Invalid candidate.");
    }

    const buildingId = await bid();
    const userId = await authUserId();
    const { data, error } = await sb()
      .from("election_ballots")
      .insert({
        election_id: input.electionId,
        position_id: input.positionId,
        candidate_id: input.candidateId,
        building_id: buildingId,
        unit_id: unitId,
        profile_id: userId,
      })
      .select("*, units(label)")
      .single();
    mapDbError(error);
    const ballotRow = data as unknown as Record<string, unknown>;
    const unitData = ballotRow.units as { label: string } | null;
    return mapElectionBallot(ballotRow, unitData?.label ?? user.unit);
  },

  async getPollsForResident() {
    const buildingId = await bid();
    const user = await this.getUser();
    const { data, error } = await sb()
      .from("polls")
      .select("*")
      .eq("building_id", buildingId)
      .eq("status", "active");
    mapDbError(error);
    const ids = (data ?? []).map((p) => p.id as string);
    const questions = await loadPollQuestions(ids);
    return (data ?? [])
      .map((p) => mapPoll(p as Record<string, unknown>, questions.get(p.id as string) ?? []))
      .filter((poll) => {
        if (poll.residentTypes.length > 0 && !isResidentEligibleForElection(user.role, poll.residentTypes)) {
          return false;
        }
        if (poll.expiresAt && poll.expiresAt < todayIsoDate()) {
          return false;
        }
        return true;
      });
  },

  async getPollById(id: string) {
    const user = await this.getUser();
    const { data, error } = await sb().from("polls").select("*").eq("id", id).maybeSingle();
    mapDbError(error);
    if (!data) return null;
    const questions = await loadPollQuestions([id]);
    const poll = mapPoll(data as Record<string, unknown>, questions.get(id) ?? []);
    const canView =
      poll.status === "active" &&
      (poll.residentTypes.length === 0 || isResidentEligibleForElection(user.role, poll.residentTypes)) &&
      (!poll.expiresAt || poll.expiresAt >= todayIsoDate());
    return canView ? poll : null;
  },

  async getPollAttachments(pollId: string) {
    const { data, error } = await sb()
      .from("poll_attachments")
      .select("*")
      .eq("poll_id", pollId)
      .order("created_at", { ascending: false });
    mapDbError(error);
    return (data ?? []).map((a) => mapPollAttachment(a as Record<string, unknown>));
  },

  async getPollResponsesForPoll(pollId: string) {
    const buildingId = await bid();
    const userId = await authUserId();
    const { data, error } = await sb()
      .from("poll_responses")
      .select("*")
      .eq("poll_id", pollId)
      .eq("building_id", buildingId)
      .eq("profile_id", userId);
    mapDbError(error);
    return (data ?? []).map((row) => mapPollResponse(row as Record<string, unknown>));
  },

  async submitPollResponse(input: SubmitPollResponseInput) {
    const poll = await this.getPollById(input.pollId);
    if (!poll) throw new Error("Poll not found or not available.");

    const question = poll.questions.find((q) => q.id === input.questionId);
    if (!question) throw new Error("Invalid question.");

    const options = parsePollAnswerOptions(question);
    if (!options.includes(input.selectedOption)) {
      throw new Error("Invalid answer option.");
    }

    const { data: existing, error: existingError } = await sb()
      .from("poll_responses")
      .select("id")
      .eq("question_id", input.questionId)
      .eq("profile_id", await authUserId())
      .maybeSingle();
    mapDbError(existingError);
    if (existing) throw new Error("You already answered this question.");

    const occupancy = await currentOccupancy();
    const unitId = occupancy?.unit_id as string | undefined;
    const buildingId = await bid();
    const userId = await authUserId();

    const { data, error } = await sb()
      .from("poll_responses")
      .insert({
        poll_id: input.pollId,
        question_id: input.questionId,
        building_id: buildingId,
        profile_id: userId,
        unit_id: unitId ?? null,
        answer: { selected: input.selectedOption },
      })
      .select("*")
      .single();
    if (error) {
      if (error.code === "23505") {
        throw new Error("You already answered this question.");
      }
      mapDbError(error);
    }

    const { data: pollRow, error: pollError } = await sb()
      .from("polls")
      .select("response_count")
      .eq("id", input.pollId)
      .maybeSingle();
    mapDbError(pollError);
    const nextCount = ((pollRow?.response_count as number | undefined) ?? 0) + 1;
    await sb()
      .from("polls")
      .update({ response_count: nextCount, updated_at: nowIso() })
      .eq("id", input.pollId);

    return mapPollResponse(data as Record<string, unknown>);
  },

  async getAgmMeetingById(id: string) {
    const { data, error } = await sb().from("agm_meetings").select("*").eq("id", id).maybeSingle();
    mapDbError(error);
    return data ? mapAgmMeeting(data as Record<string, unknown>) : null;
  },

  async getParkingRequestsForCurrentResident() {
    const buildingId = await bid();
    const userId = await authUserId();
    const { data, error } = await sb()
      .from("parking_requests")
      .select("*")
      .eq("building_id", buildingId)
      .eq("profile_id", userId)
      .order("requested_at", { ascending: true });
    mapDbError(error);
    const requests = (data ?? []).map((r) => mapParkingRequest(r as Record<string, unknown>));
    return computeWaitlistPositions(requests);
  },

  async submitParkingRequest(requestType: ParkingRequestType, details?: { requestedForNights?: string }) {
    const buildingId = await bid();
    const user = await this.getUser();
    const userId = await authUserId();
    const detailsData = await this.getResidentDetails();
    if (requestType === "visitor" && detailsData.parkingSpots.length === 0) {
      throw new Error("Visitor parking requests require an assigned parking spot.");
    }

    const existing = await this.getParkingRequestsForCurrentResident();
    const existingWaiting = existing.find(
      (request) =>
        request.requestType === requestType &&
        (request.status === "waiting" || request.status === "approvedAwaitingPayment")
    );
    if (existingWaiting) {
      throw new Error("You already have a pending request for this parking type.");
    }

    const { data: pricing } = await sb()
      .from("building_parking_pricing")
      .select("*")
      .eq("building_id", buildingId)
      .maybeSingle();
    const monthlyCost =
      requestType === "parking"
        ? (pricing?.regular_monthly_cost as string) ?? PARKING_PAYMENT_AMOUNTS.parking
        : (pricing?.visitor_monthly_cost as string) ?? PARKING_PAYMENT_AMOUNTS.visitor;

    const { data, error } = await sb()
      .from("parking_requests")
      .insert({
        building_id: buildingId,
        profile_id: userId,
        resident_name: user.name,
        unit: user.unit,
        request_type: requestType,
        status: "waiting",
        requested_for_nights: details?.requestedForNights?.trim() || null,
        monthly_cost: monthlyCost,
      })
      .select("*")
      .single();
    mapDbError(error);
    const request = mapParkingRequest(data as Record<string, unknown>);
    const [withPosition] = await computeWaitlistPositions([request]);
    return withPosition;
  },

  async acceptParkingRequestPayment(requestId: string) {
    const userId = await authUserId();
    const { data: request, error: reqErr } = await sb()
      .from("parking_requests")
      .select("*")
      .eq("id", requestId)
      .eq("profile_id", userId)
      .maybeSingle();
    mapDbError(reqErr);
    if (!request) throw new Error("Parking request not found.");
    if (request.status !== "approvedAwaitingPayment" || !request.assigned_spot) {
      throw new Error("This parking request is not awaiting payment.");
    }

    const now = nowIso();
    const paymentAmount =
      (request.payment_amount as string | undefined) ??
      PARKING_PAYMENT_AMOUNTS[request.request_type as ParkingRequestType];
    const { data, error } = await sb()
      .from("parking_requests")
      .update({
        status: "paidAccepted",
        resident_decision_at: now,
        payment_at: now,
        payment_amount: paymentAmount,
      })
      .eq("id", requestId)
      .select("*")
      .maybeSingle();
    mapDbError(error);
    if (!data) throw new Error("Unable to update parking request.");

    if (request.request_type === "parking" && request.assigned_spot) {
      const details = await this.getResidentDetails();
      if (!details.parkingSpots.includes(request.assigned_spot as string)) {
        const occupancy = await currentOccupancy();
        const unit = occupancy?.units as { id: string; parking_spots?: string[] } | null;
        if (unit?.id) {
          await sb()
            .from("units")
            .update({
              parking_spots: [...details.parkingSpots, request.assigned_spot as string],
            })
            .eq("id", unit.id);
        }
      }
    }

    return mapParkingRequest(data as unknown as Record<string, unknown>);
  },

  async declineParkingRequestOffer(requestId: string) {
    const userId = await authUserId();
    const { data: request, error: reqErr } = await sb()
      .from("parking_requests")
      .select("*")
      .eq("id", requestId)
      .eq("profile_id", userId)
      .maybeSingle();
    mapDbError(reqErr);
    if (!request) throw new Error("Parking request not found.");
    if (request.status !== "approvedAwaitingPayment") {
      throw new Error("This parking request cannot be declined right now.");
    }

    const now = nowIso();
    const { data, error } = await sb()
      .from("parking_requests")
      .update({
        status: "waiting",
        assigned_spot: null,
        approved_at: null,
        payment_amount: null,
        payment_at: null,
        payment_type_label: null,
        resident_decision_at: now,
        requested_at: now,
      })
      .eq("id", requestId)
      .select("*")
      .maybeSingle();
    mapDbError(error);
    if (!data) throw new Error("Unable to update parking request.");
    const mapped = mapParkingRequest(data as Record<string, unknown>);
    const [withPosition] = await computeWaitlistPositions([mapped]);
    return withPosition;
  },

  async getAmenityBookings() {
    const buildingId = await bid();
    const userId = await authUserId();
    const { data, error } = await sb()
      .from("amenity_bookings")
      .select(AMENITY_BOOKING_SELECT)
      .eq("building_id", buildingId)
      .eq("profile_id", userId)
      .order("booking_date", { ascending: false })
      .order("requested_at", { ascending: false });
    mapDbError(error);
    return (data ?? []).map((row) => mapAmenityBooking(row as Record<string, unknown>));
  },

  async getBuildingAmenityResources(resourceType?: BuildingAmenityResourceType) {
    const buildingId = await bid();
    let query = sb()
      .from("building_amenity_resources")
      .select("*")
      .eq("building_id", buildingId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (resourceType) {
      query = query.eq("resource_type", resourceType);
    }
    const { data, error } = await query;
    mapDbError(error);
    return (data ?? []).map((row) => mapBuildingAmenityResource(row as Record<string, unknown>));
  },

  async getBuildingAmenitySettings() {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("building_amenity_settings")
      .select("*")
      .eq("building_id", buildingId)
      .maybeSingle();
    mapDbError(error);
    if (!data) {
      return {
        partyRoomFee: "",
        elevatorInstructions: "",
        partyRoomInstructions: "",
      };
    }
    return mapBuildingAmenitySettings(data as Record<string, unknown>);
  },

  async submitElevatorBooking(input: SubmitElevatorBookingInput) {
    const buildingId = await bid();
    const user = await this.getUser();
    const userId = await authUserId();
    if (!input.bookingDate.trim() || !input.startTime.trim() || !input.endTime.trim()) {
      throw new Error("Date and time range are required.");
    }
    await assertActiveAmenityResource(buildingId, input.amenityResourceId, "elevator");
    const { data, error } = await sb()
      .from("amenity_bookings")
      .insert({
        building_id: buildingId,
        profile_id: userId,
        resident_name: user.name,
        unit: user.unit,
        booking_type: "elevator",
        amenity_resource_id: input.amenityResourceId,
        booking_date: input.bookingDate.trim(),
        start_time: input.startTime.trim(),
        end_time: input.endTime.trim(),
        notes: input.notes?.trim() ?? "",
        status: "pending",
      })
      .select(AMENITY_BOOKING_SELECT)
      .single();
    mapDbError(error);
    return mapAmenityBooking(data as Record<string, unknown>);
  },

  async submitPartyRoomBooking(input: SubmitPartyRoomBookingInput) {
    const buildingId = await bid();
    const user = await this.getUser();
    const userId = await authUserId();
    if (!input.bookingDate.trim() || !input.startTime.trim() || !input.endTime.trim()) {
      throw new Error("Date and time range are required.");
    }
    await assertActiveAmenityResource(buildingId, input.amenityResourceId, "party_room");
    const { data, error } = await sb()
      .from("amenity_bookings")
      .insert({
        building_id: buildingId,
        profile_id: userId,
        resident_name: user.name,
        unit: user.unit,
        booking_type: "party_room",
        amenity_resource_id: input.amenityResourceId,
        booking_date: input.bookingDate.trim(),
        start_time: input.startTime.trim(),
        end_time: input.endTime.trim(),
        guest_count: input.guestCount ?? null,
        notes: input.notes?.trim() ?? "",
        status: "pending",
      })
      .select(AMENITY_BOOKING_SELECT)
      .single();
    mapDbError(error);
    return mapAmenityBooking(data as Record<string, unknown>);
  },

  async acceptPartyRoomPayment(bookingId: string) {
    const userId = await authUserId();
    const { data: booking, error: fetchError } = await sb()
      .from("amenity_bookings")
      .select("*")
      .eq("id", bookingId)
      .eq("profile_id", userId)
      .maybeSingle();
    mapDbError(fetchError);
    if (!booking) throw new Error("Booking not found.");
    if (booking.booking_type !== "party_room") {
      throw new Error("Only party room bookings require payment.");
    }
    if (booking.status !== "approvedAwaitingPayment") {
      throw new Error("This booking is not awaiting payment.");
    }
    const now = nowIso();
    const { data, error } = await sb()
      .from("amenity_bookings")
      .update({
        status: "confirmed",
        payment_at: now,
        unread: false,
        updated_at: now,
      })
      .eq("id", bookingId)
      .select("*")
      .maybeSingle();
    mapDbError(error);
    if (!data) throw new Error("Unable to update booking.");
    return mapAmenityBooking(data as Record<string, unknown>);
  },

  async cancelAmenityBooking(bookingId: string) {
    const userId = await authUserId();
    const { data: booking, error: fetchError } = await sb()
      .from("amenity_bookings")
      .select("*")
      .eq("id", bookingId)
      .eq("profile_id", userId)
      .maybeSingle();
    mapDbError(fetchError);
    if (!booking) throw new Error("Booking not found.");
    if (booking.status !== "pending") {
      throw new Error("Only pending bookings can be cancelled.");
    }
    const { data, error } = await sb()
      .from("amenity_bookings")
      .update({ status: "cancelled", updated_at: nowIso() })
      .eq("id", bookingId)
      .select("*")
      .maybeSingle();
    mapDbError(error);
    if (!data) throw new Error("Unable to cancel booking.");
    return mapAmenityBooking(data as Record<string, unknown>);
  },

  async markAmenityBookingRead(bookingId: string) {
    const userId = await authUserId();
    const { error } = await sb()
      .from("amenity_bookings")
      .update({ unread: false, updated_at: nowIso() })
      .eq("id", bookingId)
      .eq("profile_id", userId);
    mapDbError(error);
  },

  async getVisitorParkingOvernightEmail() {
    const buildingId = await bid();
    const { data } = await sb().from("buildings").select("visitor_parking_overnight_email").eq("id", buildingId).single();
    return (data?.visitor_parking_overnight_email as string) ?? "";
  },

  async getPersonalTileLayout() {
    const buildingId = await bid();
    const userId = await authUserId();
    const { data, error } = await sb()
      .from("resident_portal_tile_layouts")
      .select("tiles")
      .eq("profile_id", userId)
      .eq("building_id", buildingId)
      .maybeSingle();
    mapDbError(error);
    const tiles = parsePersonalTiles(data?.tiles);
    return tiles ? tiles.map((tile) => ({ ...tile })) : null;
  },

  async savePersonalTileLayout(tiles: ArrangeTile[]) {
    const buildingId = await bid();
    const userId = await authUserId();
    const payload = tiles.map((tile) => ({ ...tile }));
    const { error } = await sb()
      .from("resident_portal_tile_layouts")
      .upsert({
        profile_id: userId,
        building_id: buildingId,
        tiles: payload,
        updated_at: nowIso(),
      });
    mapDbError(error);
  },

  async resetPersonalTileLayout() {
    const buildingId = await bid();
    const userId = await authUserId();
    const { error } = await sb()
      .from("resident_portal_tile_layouts")
      .delete()
      .eq("profile_id", userId)
      .eq("building_id", buildingId);
    mapDbError(error);
  },

  async getPortalModuleBadgeCounts() {
    const buildingId = await bid();
    const userId = await authUserId();

    const [serviceResult, incidentResult, certResult, amenityUnreadResult, amenityPaymentResult] =
      await Promise.all([
      sb()
        .from("service_requests")
        .select("id", { count: "exact", head: true })
        .eq("building_id", buildingId)
        .eq("created_by_profile_id", userId)
        .or("unread.eq.true,status.eq.Pending"),
      sb()
        .from("incident_reports")
        .select("id", { count: "exact", head: true })
        .eq("building_id", buildingId)
        .eq("created_by_profile_id", userId)
        .neq("status", "Draft")
        .or("unread.eq.true,status.eq.Pending"),
      sb()
        .from("status_certificates")
        .select("id", { count: "exact", head: true })
        .eq("building_id", buildingId)
        .eq("requested_by_profile_id", userId)
        .eq("unread", true),
      sb()
        .from("amenity_bookings")
        .select("id", { count: "exact", head: true })
        .eq("building_id", buildingId)
        .eq("profile_id", userId)
        .eq("unread", true),
      sb()
        .from("amenity_bookings")
        .select("id", { count: "exact", head: true })
        .eq("building_id", buildingId)
        .eq("profile_id", userId)
        .eq("status", "approvedAwaitingPayment"),
    ]);

    mapDbError(serviceResult.error);
    mapDbError(incidentResult.error);
    mapDbError(certResult.error);
    mapDbError(amenityUnreadResult.error);
    mapDbError(amenityPaymentResult.error);

    const chatUnread = await supabaseChatRepository.getUnreadCount({
      contactId: userId,
      name: "",
      role: "",
      buildingId,
      canMessageAnyBuilding: false,
    });

    return {
      serviceRequest: serviceResult.count ?? 0,
      incidentReport: incidentResult.count ?? 0,
      statusCerts: certResult.count ?? 0,
      chat: chatUnread,
      amenityBookings: (amenityUnreadResult.count ?? 0) + (amenityPaymentResult.count ?? 0),
    };
  },

  async getProfileCompletionStatus() {
    return evaluateProfileCompletionStatus();
  },

  async saveProfileCompletion(payload: ProfileCompletionSavePayload) {
    const userId = await authUserId();
    const buildingId = await bid();
    const occupancy = await currentOccupancy();
    if (!occupancy) throw new Error("No active occupancy found.");

    const occupancyId = occupancy.id as string;
    const profileUpdate = buildProfileUpdate(payload);
    if (Object.keys(profileUpdate).length > 0) {
      const { error } = await sb().from("profiles").update(profileUpdate).eq("id", userId);
      mapDbError(error);
    }

    const sectionEntries: [ResidentDetailSection, ResidentDetailSectionData | undefined][] = [
      ["vehicles", payload.vehicles],
      ["pets", payload.pets],
      ["guestList", payload.guestList],
      ["parkingSpots", payload.parkingSpots],
      ["lockers", payload.lockers],
      ["keyFobs", payload.keyFobs],
      ["bikeSpaces", payload.bikeSpaces],
      ["purchaseDateMaintFees", payload.purchaseDateMaintFees],
    ];

    for (const [section, data] of sectionEntries) {
      if (data !== undefined) {
        await saveOccupancyProfileSection(occupancyId, buildingId, section, data);
      }
    }

    const status = await evaluateProfileCompletionStatus();
    if (status.missingFields.length > 0) {
      const labels = status.missingFields.map((f) => f.label).join(", ");
      throw new Error(`Profile still incomplete. Missing: ${labels}`);
    }
    if (status.appliesToUser) {
      await markProfileCompleted(occupancyId, buildingId);
    }
    return status;
  },
};
