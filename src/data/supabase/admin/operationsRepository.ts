import type {
  AdminIncidentReport,
  AdminServiceRequest,
  AdminSuggestion,
  CertificateDetail,
  CertificateFile,
  CertificateHistoryEntry,
  Comment,
  CreateAdminIncidentReportInput,
  CreateAdminServiceRequestInput,
  CreateAdminSuggestionInput,
  IncidentContactEmail,
  IncidentReportCategory,
  ServiceRequestCategory,
} from "../../../resident/data/types";
import { PARKING_PAYMENT_AMOUNTS } from "../../../resident/data/types";
import { certificateDetailFromRow } from "../../../company/data/mock/certificateDetails";
import { mapDbError, nowIso, sb, todayIsoDate } from "../base";
import {
  mapCertificateRow,
  mapAmenityBooking,
  mapBuildingAmenitySettings,
  mapFireSafetySubmission,
  mapIncidentCategory,
  mapIncidentContactEmail,
  mapIncidentReport,
  mapParkingRequest,
  mapServiceCategory,
  mapServiceRequest,
  mapSuggestion,
} from "./mappers";
import {
  bid,
  ensureIncidentCategory,
  insertComment,
  insertIncidentReportAttachment,
  insertServiceRequestAttachment,
  isSameCategoryName,
  loadEntityComments,
  loadIncidentReportAttachments,
  loadServiceRequestAttachments,
  normalizeCategoryName,
  parseUnitFromResident,
  removeIncidentReportAttachment,
  removeServiceRequestAttachment,
} from "./shared";
import { fileToAttachmentPayload } from "../../../shared/attachmentUtils";

async function ensureServiceCategory(name: string): Promise<string> {
  const buildingId = await bid();
  const normalized = normalizeCategoryName(name);
  if (!normalized) throw new Error("Service request category is required.");
  const { data: existing } = await sb()
    .from("service_request_categories")
    .select("*")
    .eq("building_id", buildingId);
  const match = (existing ?? []).find((c) => isSameCategoryName(c.name as string, normalized));
  if (match) return match.name as string;
  const { data, error } = await sb()
    .from("service_request_categories")
    .insert({ building_id: buildingId, name: normalized })
    .select("*")
    .single();
  mapDbError(error);
  return data!.name as string;
}

async function mapServiceRequestWithComments(row: Record<string, unknown>) {
  const [comments, attachments] = await Promise.all([
    loadEntityComments("service_request", row.id as string),
    loadServiceRequestAttachments(row.id as string),
  ]);
  return mapServiceRequest(row, comments, attachments);
}

async function mapIncidentWithComments(row: Record<string, unknown>) {
  const [comments, attachments] = await Promise.all([
    loadEntityComments("incident_report", row.id as string),
    loadIncidentReportAttachments(row.id as string),
  ]);
  return mapIncidentReport(row, comments, attachments);
}

async function mapSuggestionWithComments(row: Record<string, unknown>) {
  const comments = await loadEntityComments("suggestion", row.id as string);
  return mapSuggestion(row, comments);
}

async function updateAmenityBookingStatus(id: string, patch: Record<string, unknown>) {
  const buildingId = await bid();
  const { data: existing, error: fetchError } = await sb()
    .from("amenity_bookings")
    .select("*")
    .eq("id", id)
    .eq("building_id", buildingId)
    .maybeSingle();
  mapDbError(fetchError);
  if (!existing) throw new Error("Booking not found.");

  const nextStatus = patch.status as string | undefined;
  if (nextStatus === "confirmed" || nextStatus === "approvedAwaitingPayment") {
    if (existing.status !== "pending") {
      throw new Error("Only pending bookings can be approved.");
    }
  }
  if (nextStatus === "approvedAwaitingPayment" && existing.booking_type !== "party_room") {
    throw new Error("Only party room bookings require payment approval.");
  }
  if (nextStatus === "confirmed" && existing.booking_type === "party_room") {
    throw new Error("Party room bookings must be approved with a payment amount first.");
  }

  const { data, error } = await sb()
    .from("amenity_bookings")
    .update({ ...patch, updated_at: nowIso() })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  mapDbError(error);
  return data ? mapAmenityBooking(data as Record<string, unknown>) : null;
}

export const operationsRepository = {
  async resolveServiceCategoryName(selectedName: string, customName?: string) {
    const raw = selectedName === "Other" ? customName ?? "" : selectedName;
    return ensureServiceCategory(raw);
  },

  async resolveIncidentCategoryName(selectedName: string, customName?: string) {
    const raw = selectedName === "Other" ? customName ?? "" : selectedName;
    return ensureIncidentCategory(raw);
  },

  async getServiceRequests(
    archived = false,
    filters?: { unit?: string; owner?: string }
  ) {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("service_requests")
      .select("*")
      .eq("building_id", buildingId)
      .eq("archived", archived);
    mapDbError(error);
    let rows = data ?? [];
    if (filters?.unit && filters.unit !== "all") {
      rows = rows.filter((r) => r.unit === filters.unit);
    }
    if (filters?.owner && filters.owner !== "all") {
      rows = rows.filter((r) => r.resident === filters.owner);
    }
    return Promise.all(rows.map((r) => mapServiceRequestWithComments(r as Record<string, unknown>)));
  },

  async getServiceRequestById(id: string) {
    const { data, error } = await sb().from("service_requests").select("*").eq("id", id).maybeSingle();
    mapDbError(error);
    return data ? mapServiceRequestWithComments(data as Record<string, unknown>) : null;
  },

  async createServiceRequest(input: CreateAdminServiceRequestInput) {
    const buildingId = await bid();
    const resolvedCategory = await ensureServiceCategory(input.category);
    const unit = input.unit ?? parseUnitFromResident(input.resident);
    const { data, error } = await sb()
      .from("service_requests")
      .insert({
        building_id: buildingId,
        created_by_name: input.resident,
        contact: input.contact,
        location: input.location,
        severity: input.severity,
        category: resolvedCategory,
        description: input.description,
        status: "Received",
        assigned_to: input.assignedTo,
        resident: input.resident,
        unit,
        visibility: input.visibility,
        permission_to_enter: input.permissionToEnter,
        permission_notes: input.permissionNotes,
        admin_severity: input.severity,
        admin_category: resolvedCategory,
        action_required: true,
        pending_reply: true,
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
    return mapServiceRequestWithComments(data as Record<string, unknown>);
  },

  async addServiceRequestAttachment(requestId: string, file: File) {
    const payload = await fileToAttachmentPayload(file);
    return insertServiceRequestAttachment(requestId, payload);
  },

  async removeServiceRequestAttachment(attachmentId: string) {
    return removeServiceRequestAttachment(attachmentId);
  },

  async updateServiceRequest(id: string, updates: Partial<AdminServiceRequest>) {
    const payload: Record<string, unknown> = { updated_at: nowIso() };
    if (updates.status !== undefined) {
      payload.status = updates.status;
      if (updates.status === "Pending") payload.unread = true;
    }
    if (updates.assignedTo !== undefined) payload.assigned_to = updates.assignedTo;
    if (updates.adminSeverity !== undefined) payload.admin_severity = updates.adminSeverity;
    if (updates.adminCategory !== undefined) payload.admin_category = updates.adminCategory;
    if (updates.actionRequired !== undefined) payload.action_required = updates.actionRequired;
    if (updates.archived !== undefined) payload.archived = updates.archived;
    if (updates.pendingReply !== undefined) {
      payload.pending_reply = updates.pendingReply;
      if (updates.pendingReply) payload.unread = true;
    }
    if (updates.resolvedBy !== undefined) payload.resolved_by = updates.resolvedBy;
    if (updates.resolvedAt !== undefined) payload.resolved_at = updates.resolvedAt;
    const { data, error } = await sb().from("service_requests").update(payload).eq("id", id).select("*").maybeSingle();
    mapDbError(error);
    return data ? mapServiceRequestWithComments(data as Record<string, unknown>) : null;
  },

  async addServiceRequestComment(
    id: string,
    comment: Omit<Comment, "id">,
    visibility: "admin" | "public"
  ) {
    const result = await insertComment("service_request", id, comment, visibility);
    if (visibility === "public") {
      const { error } = await sb()
        .from("service_requests")
        .update({ unread: true, updated_at: nowIso() })
        .eq("id", id);
      mapDbError(error);
    }
    return result;
  },

  async getServiceCategories() {
    const buildingId = await bid();
    const { data: categories, error } = await sb()
      .from("service_request_categories")
      .select("*")
      .eq("building_id", buildingId)
      .order("sort_order", { ascending: true });
    mapDbError(error);
    const { data: requests } = await sb()
      .from("service_requests")
      .select("category")
      .eq("building_id", buildingId);
    const usage = new Map<string, number>();
    for (const r of requests ?? []) {
      const cat = r.category as string;
      usage.set(cat, (usage.get(cat) ?? 0) + 1);
    }
    return (categories ?? []).map((c) =>
      mapServiceCategory(c as Record<string, unknown>, usage.get(c.name as string) ?? 0)
    );
  },

  async createServiceCategory(name: string, status: "active" | "inactive" = "active") {
    const buildingId = await bid();
    const normalized = normalizeCategoryName(name);
    if (!normalized) throw new Error("Service category name is required.");
    const { data: existing } = await sb()
      .from("service_request_categories")
      .select("*")
      .eq("building_id", buildingId);
    const match = (existing ?? []).find((c) => isSameCategoryName(c.name as string, normalized));
    if (match) return mapServiceCategory(match as Record<string, unknown>, 0);
    const { data, error } = await sb()
      .from("service_request_categories")
      .insert({ building_id: buildingId, name: normalized })
      .select("*")
      .single();
    mapDbError(error);
    return mapServiceCategory(data as Record<string, unknown>, 0);
  },

  async updateServiceCategory(id: string, updates: Partial<ServiceRequestCategory>) {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    const { data, error } = await sb()
      .from("service_request_categories")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    mapDbError(error);
    return data ? mapServiceCategory(data as Record<string, unknown>, updates.usageCount ?? 0) : null;
  },

  async getServiceRequestTerms() {
    const buildingId = await bid();
    const { data } = await sb()
      .from("certificate_settings")
      .select("settings")
      .eq("building_id", buildingId)
      .maybeSingle();
    const settings = (data?.settings as Record<string, unknown>) ?? {};
    return (settings.serviceRequestTerms as string) ?? "";
  },

  async updateServiceRequestTerms(terms: string) {
    const buildingId = await bid();
    const { data: existing } = await sb()
      .from("certificate_settings")
      .select("settings")
      .eq("building_id", buildingId)
      .maybeSingle();
    const settings = { ...((existing?.settings as Record<string, unknown>) ?? {}), serviceRequestTerms: terms };
    await sb().from("certificate_settings").upsert({ building_id: buildingId, settings });
    return terms;
  },

  async getSuggestions() {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("suggestions")
      .select("*")
      .eq("building_id", buildingId)
      .order("created_at", { ascending: false });
    mapDbError(error);
    return Promise.all((data ?? []).map((s) => mapSuggestionWithComments(s as Record<string, unknown>)));
  },

  async getSuggestionById(id: string) {
    const { data, error } = await sb().from("suggestions").select("*").eq("id", id).maybeSingle();
    mapDbError(error);
    return data ? mapSuggestionWithComments(data as Record<string, unknown>) : null;
  },

  async createSuggestion(input: CreateAdminSuggestionInput) {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("suggestions")
      .insert({
        building_id: buildingId,
        text: input.text,
        status: "Open",
        unread: true,
      })
      .select("*")
      .single();
    mapDbError(error);
    const mapped = mapSuggestion(data as Record<string, unknown>);
    return { ...mapped, visibility: input.visibility, createdBy: input.createdBy, unit: input.unit };
  },

  async updateSuggestion(id: string, updates: Partial<AdminSuggestion>) {
    const payload: Record<string, unknown> = { updated_at: nowIso() };
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.text !== undefined) payload.text = updates.text;
    if (updates.unread !== undefined) payload.unread = updates.unread;
    const { data, error } = await sb().from("suggestions").update(payload).eq("id", id).select("*").maybeSingle();
    mapDbError(error);
    return data ? mapSuggestionWithComments(data as Record<string, unknown>) : null;
  },

  async addSuggestionComment(
    id: string,
    comment: Omit<Comment, "id">,
    visibility: "admin" | "public"
  ) {
    return insertComment("suggestion", id, comment, visibility);
  },

  async getUnreadSuggestionCount() {
    const buildingId = await bid();
    const { count, error } = await sb()
      .from("suggestions")
      .select("*", { count: "exact", head: true })
      .eq("building_id", buildingId)
      .eq("unread", true);
    mapDbError(error);
    return count ?? 0;
  },

  async getConsultationSubmissions() {
    const { data, error } = await sb()
      .from("consultation_submissions")
      .select("*")
      .order("submitted_at", { ascending: false });
    mapDbError(error);
    return (data ?? []).map((r) => ({
      id: r.id as string,
      submittedAt: r.submitted_at as string,
      name: r.name as string,
      corporationNumber: r.corporation_number as string,
      municipalAddress: r.municipal_address as string,
      email: r.email as string,
      phone: r.phone as string,
      survey: r.survey as never,
      status: r.status as "new" | "contacted",
      unread: r.unread as boolean,
    }));
  },

  async getUnreadConsultationLeadCount() {
    const { count, error } = await sb()
      .from("consultation_submissions")
      .select("*", { count: "exact", head: true })
      .eq("unread", true);
    mapDbError(error);
    return count ?? 0;
  },

  async markConsultationSubmissionRead(id: string) {
    await sb().from("consultation_submissions").update({ unread: false }).eq("id", id);
  },

  async markAllConsultationSubmissionsRead() {
    await sb()
      .from("consultation_submissions")
      .update({ unread: false })
      .neq("id", "00000000-0000-0000-0000-000000000000");
  },

  async getIncidentReports(
    archived = false,
    filters?: { unit?: string; owner?: string }
  ) {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("incident_reports")
      .select("*")
      .eq("building_id", buildingId)
      .eq("archived", archived);
    mapDbError(error);
    let rows = data ?? [];
    if (filters?.unit && filters.unit !== "all") {
      rows = rows.filter((r) => r.unit === filters.unit);
    }
    if (filters?.owner && filters.owner !== "all") {
      rows = rows.filter((r) => r.resident === filters.owner);
    }
    return Promise.all(rows.map((r) => mapIncidentWithComments(r as Record<string, unknown>)));
  },

  async getIncidentReportById(id: string) {
    const { data, error } = await sb().from("incident_reports").select("*").eq("id", id).maybeSingle();
    mapDbError(error);
    return data ? mapIncidentWithComments(data as Record<string, unknown>) : null;
  },

  async createIncidentReport(input: CreateAdminIncidentReportInput) {
    const buildingId = await bid();
    const resolvedType = await ensureIncidentCategory(input.reportType);
    const createdBy = "Admin";
    const { data, error } = await sb()
      .from("incident_reports")
      .insert({
        building_id: buildingId,
        incident_date: input.incidentDate,
        incident_time: input.incidentTime,
        severity: input.severity,
        report_type: resolvedType,
        location: input.location,
        description: input.description,
        status: input.status ?? "Pending",
        unit: input.unit ?? "—",
        resident: createdBy,
        assigned_to: input.assignedToAdmin ?? "All Admins",
        created_by_name: createdBy,
        submitted_at: nowIso(),
        pending_reply_label: "N/A",
        resolution_time: "—",
      })
      .select("*")
      .single();
    mapDbError(error);
    return mapIncidentReport(data as Record<string, unknown>);
  },

  async addIncidentReportComment(
    id: string,
    comment: Omit<Comment, "id">,
    visibility: "admin" | "public"
  ) {
    const result = await insertComment("incident_report", id, comment, visibility);
    if (visibility === "public") {
      const { error } = await sb()
        .from("incident_reports")
        .update({ unread: true, updated_at: nowIso() })
        .eq("id", id);
      mapDbError(error);
    }
    return result;
  },

  async addIncidentReportAttachment(reportId: string, file: File) {
    const payload = await fileToAttachmentPayload(file);
    const {
      data: { user },
    } = await sb().auth.getUser();
    let uploadedBy = "Admin";
    if (user?.id) {
      const { data: profile } = await sb()
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      uploadedBy = (profile?.display_name as string) || "Admin";
    }
    return insertIncidentReportAttachment(reportId, { ...payload, uploadedBy });
  },

  async removeIncidentReportAttachment(attachmentId: string) {
    return removeIncidentReportAttachment(attachmentId);
  },

  async updateIncidentReport(id: string, updates: Partial<AdminIncidentReport>) {
    const payload: Record<string, unknown> = { updated_at: nowIso() };
    if (updates.status !== undefined) {
      payload.status = updates.status;
      if (updates.status === "Pending") payload.unread = true;
    }
    if (updates.adminSeverity !== undefined) payload.severity = updates.adminSeverity;
    if (updates.adminType !== undefined) payload.report_type = updates.adminType;
    if (updates.archived !== undefined) payload.archived = updates.archived;
    if (updates.pendingReply !== undefined) payload.pending_reply_label = updates.pendingReply;
    if (updates.resolutionTime !== undefined) payload.resolution_time = updates.resolutionTime;
    if (updates.unread !== undefined) payload.unread = updates.unread;
    const { data, error } = await sb().from("incident_reports").update(payload).eq("id", id).select("*").maybeSingle();
    mapDbError(error);
    return data ? mapIncidentWithComments(data as Record<string, unknown>) : null;
  },

  async archiveIncidentReport(id: string) {
    await sb().from("incident_reports").update({ archived: true }).eq("id", id);
  },

  async markIncidentReportRead(id: string) {
    await sb().from("incident_reports").update({ unread: false }).eq("id", id);
  },

  async getIncidentCategories() {
    const buildingId = await bid();
    const { data: categories, error } = await sb()
      .from("incident_report_categories")
      .select("*")
      .eq("building_id", buildingId);
    mapDbError(error);
    const { data: reports } = await sb()
      .from("incident_reports")
      .select("report_type")
      .eq("building_id", buildingId);
    const usage = new Map<string, number>();
    for (const r of reports ?? []) {
      const t = r.report_type as string;
      usage.set(t, (usage.get(t) ?? 0) + 1);
    }
    return (categories ?? []).map((c) =>
      mapIncidentCategory(c as Record<string, unknown>, usage.get(c.name as string) ?? 0)
    );
  },

  async createIncidentCategory(name: string, status: "active" | "inactive" = "active") {
    const buildingId = await bid();
    const normalized = normalizeCategoryName(name);
    if (!normalized) throw new Error("Incident category name is required.");
    const { data: existing } = await sb()
      .from("incident_report_categories")
      .select("*")
      .eq("building_id", buildingId);
    const match = (existing ?? []).find((c) => isSameCategoryName(c.name as string, normalized));
    if (match) return mapIncidentCategory(match as Record<string, unknown>, 0);
    const { data, error } = await sb()
      .from("incident_report_categories")
      .insert({ building_id: buildingId, name: normalized })
      .select("*")
      .single();
    mapDbError(error);
    return mapIncidentCategory(data as Record<string, unknown>, 0);
  },

  async updateIncidentCategory(id: string, updates: Partial<IncidentReportCategory>) {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    const { data, error } = await sb()
      .from("incident_report_categories")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    mapDbError(error);
    return data ? mapIncidentCategory(data as Record<string, unknown>, updates.usageCount ?? 0) : null;
  },

  async getIncidentContactEmails() {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("incident_contact_emails")
      .select("*")
      .eq("building_id", buildingId);
    mapDbError(error);
    return (data ?? []).map((e) => mapIncidentContactEmail(e as Record<string, unknown>));
  },

  async createIncidentContactEmail(email: string) {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("incident_contact_emails")
      .insert({ building_id: buildingId, email, label: "active" })
      .select("*")
      .single();
    mapDbError(error);
    return mapIncidentContactEmail(data as Record<string, unknown>);
  },

  async updateIncidentContactEmail(id: string, updates: Partial<IncidentContactEmail>) {
    const payload: Record<string, unknown> = {};
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.status !== undefined) payload.label = updates.status;
    const { data, error } = await sb()
      .from("incident_contact_emails")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    mapDbError(error);
    return data ? mapIncidentContactEmail(data as Record<string, unknown>) : null;
  },

  async deleteIncidentContactEmail(id: string) {
    await sb().from("incident_contact_emails").delete().eq("id", id);
  },

  async getParkingRequests() {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("parking_requests")
      .select("*")
      .eq("building_id", buildingId);
    mapDbError(error);
    return (data ?? [])
      .map((r) => mapParkingRequest(r as Record<string, unknown>))
      .sort((a, b) => {
        if (a.status === "waiting" && b.status !== "waiting") return -1;
        if (a.status !== "waiting" && b.status === "waiting") return 1;
        if (a.status === b.status) return a.requestedAt.localeCompare(b.requestedAt);
        return a.status.localeCompare(b.status);
      });
  },

  async assignParkingRequest(requestId: string, assignedSpot: string) {
    const buildingId = await bid();
    const { data: request, error: reqErr } = await sb()
      .from("parking_requests")
      .select("*")
      .eq("id", requestId)
      .maybeSingle();
    mapDbError(reqErr);
    if (!request) throw new Error("Parking request not found.");
    if (request.status !== "waiting") throw new Error("Only waiting requests can be approved.");
    if (!assignedSpot.trim()) throw new Error("Assigned spot is required.");

    const { data: parkingGroups } = await sb()
      .from("building_parking_groups")
      .select("spots")
      .eq("building_id", buildingId);
    const allSpots = new Set((parkingGroups ?? []).flatMap((g) => (g.spots as string[]) ?? []));
    if (!allSpots.has(assignedSpot)) {
      throw new Error("Assigned spot must exist in building parking spaces.");
    }

    const { data: pricing } = await sb()
      .from("building_parking_pricing")
      .select("*")
      .eq("building_id", buildingId)
      .maybeSingle();
    const paymentTypeLabel =
      request.request_type === "parking" ? "Regular Parking" : "Visitor Parking";
    const monthlyCost =
      request.request_type === "parking"
        ? (pricing?.regular_monthly_cost as string) ?? PARKING_PAYMENT_AMOUNTS.parking
        : (pricing?.visitor_monthly_cost as string) ?? PARKING_PAYMENT_AMOUNTS.visitor;

    const { data, error } = await sb()
      .from("parking_requests")
      .update({
        status: "approvedAwaitingPayment",
        assigned_spot: assignedSpot,
        approved_at: nowIso(),
        payment_amount: monthlyCost,
        monthly_cost: monthlyCost,
        payment_type_label: paymentTypeLabel,
      })
      .eq("id", requestId)
      .select("*")
      .maybeSingle();
    mapDbError(error);
    return data ? mapParkingRequest(data as Record<string, unknown>) : null;
  },

  async getAllFireSafetySubmissions() {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("fire_safety_submissions")
      .select("*")
      .eq("building_id", buildingId)
      .order("uploaded_at", { ascending: false });
    mapDbError(error);
    return (data ?? []).map((s) => mapFireSafetySubmission(s as Record<string, unknown>));
  },

  async getFireSafetySubmissionById(id: string) {
    const { data, error } = await sb().from("fire_safety_submissions").select("*").eq("id", id).maybeSingle();
    mapDbError(error);
    return data ? mapFireSafetySubmission(data as Record<string, unknown>) : null;
  },

  async getBuildingStatusCertificates(archived: boolean) {
    const buildingId = await bid();
    const { data: building } = await sb().from("buildings").select("name, code").eq("id", buildingId).single();
    const label = building ? `(${building.code}) ${building.name}` : "";
    const { data, error } = await sb()
      .from("status_certificates")
      .select("*")
      .eq("building_id", buildingId)
      .eq("archived", archived);
    mapDbError(error);
    return (data ?? []).map((r) => mapCertificateRow(r as Record<string, unknown>, label));
  },

  async getBuildingStatusCertificateDetail(id: string): Promise<CertificateDetail | undefined> {
    const buildingId = await bid();
    const { data: cert, error } = await sb()
      .from("status_certificates")
      .select("*")
      .eq("id", id)
      .eq("building_id", buildingId)
      .maybeSingle();
    mapDbError(error);
    if (!cert) return undefined;

    const { data: building } = await sb()
      .from("buildings")
      .select("name, code, address, city, province, postal_zip")
      .eq("id", buildingId)
      .maybeSingle();
    const row = mapCertificateRow(cert as Record<string, unknown>, `(${building?.code}) ${building?.name}`);
    const detailJson = (cert.detail as Record<string, unknown>) ?? {};

    const { data: files } = await sb().from("certificate_files").select("*").eq("certificate_id", id);
    const { data: history } = await sb()
      .from("certificate_history")
      .select("*")
      .eq("certificate_id", id)
      .order("event_date", { ascending: true });

    const mapFile = (f: Record<string, unknown>): CertificateFile => ({
      id: f.id as string,
      label: f.label as string,
      fileName: f.file_name as string,
      size: f.size_label as string,
      uploadedDate: String(f.uploaded_at).slice(0, 10),
      kind: f.kind as CertificateFile["kind"],
    });

    const allFiles = (files ?? []).map((f) => mapFile(f as Record<string, unknown>));
    const historyEntries: CertificateHistoryEntry[] = (history ?? []).map((h) => ({
      date: String(h.event_date),
      user: h.actor_name as string,
      action: h.action as string,
    }));

    const base = certificateDetailFromRow(row);
    const includedFiles = allFiles.filter(
      (f) => !(files ?? []).find((x) => x.id === f.id && x.excluded)
    );
    const excludedFiles = allFiles.filter((f) =>
      (files ?? []).find((x) => x.id === f.id && x.excluded)
    );
    return {
      ...base,
      id: cert.id as string,
      requestNumber: cert.request_number as string,
      unit: cert.unit as string,
      dateCreated: String(cert.created_at).slice(0, 10),
      deliveryType: cert.delivery_type as string,
      dateDue: cert.date_due ? String(cert.date_due) : "—",
      closingDate: cert.closing_date ? String(cert.closing_date) : "",
      buildingName: (building?.name as string) ?? base.buildingName,
      buildingAddress: (building?.address as string) ?? base.buildingAddress,
      buildingCityLine: building
        ? `${building.city}, ${building.province} ${building.postal_zip}`
        : base.buildingCityLine,
      requestedByName: cert.requested_by_name as string,
      files: includedFiles,
      excludedFiles,
      history: historyEntries.length ? historyEntries : base.history,
      archived: cert.archived as boolean,
      unread: cert.unread as boolean,
      ownersName: (detailJson.ownersName as string) ?? base.ownersName,
      purchasersName: (detailJson.purchasersName as string) ?? base.purchasersName,
      reasonForRequest: (detailJson.reasonForRequest as string) ?? base.reasonForRequest,
      solicitorName: (detailJson.solicitorName as string) ?? base.solicitorName,
      solicitorPhone: (detailJson.solicitorPhone as string) ?? base.solicitorPhone,
      solicitorFax: (detailJson.solicitorFax as string) ?? base.solicitorFax,
      parkingSlots: (detailJson.parkingSlots as [string, string]) ?? base.parkingSlots,
      lockerSlots: (detailJson.lockerSlots as [string, string]) ?? base.lockerSlots,
      sellerRetainsSeparatelyDeeded:
        (detailJson.sellerRetainsSeparatelyDeeded as boolean) ?? base.sellerRetainsSeparatelyDeeded,
    };
  },

  async markBuildingStatusCertificateRead(id: string) {
    await sb().from("status_certificates").update({ unread: false }).eq("id", id);
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

  async saveBuildingAmenitySettings(settings: {
    partyRoomFee: string;
    elevatorInstructions: string;
    partyRoomInstructions: string;
  }) {
    const buildingId = await bid();
    const payload = {
      building_id: buildingId,
      party_room_fee: settings.partyRoomFee.trim(),
      elevator_instructions: settings.elevatorInstructions.trim(),
      party_room_instructions: settings.partyRoomInstructions.trim(),
      updated_at: nowIso(),
    };
    const { error } = await sb().from("building_amenity_settings").upsert(payload);
    mapDbError(error);
    return this.getBuildingAmenitySettings();
  },

  async getAmenityBookings(tab: "current" | "past" | "cancelled") {
    const buildingId = await bid();
    const today = todayIsoDate();
    const { data, error } = await sb()
      .from("amenity_bookings")
      .select("*")
      .eq("building_id", buildingId)
      .order("booking_date", { ascending: false })
      .order("requested_at", { ascending: false });
    mapDbError(error);
    const bookings = (data ?? []).map((row) => mapAmenityBooking(row as Record<string, unknown>));
    if (tab === "cancelled") {
      return bookings.filter((b) => b.status === "declined" || b.status === "cancelled");
    }
    if (tab === "past") {
      return bookings.filter((b) => b.status === "confirmed" && b.bookingDate < today);
    }
    return bookings.filter(
      (b) =>
        b.status === "pending" ||
        b.status === "approvedAwaitingPayment" ||
        (b.status === "confirmed" && b.bookingDate >= today)
    );
  },

  async getAmenityBookingById(id: string) {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("amenity_bookings")
      .select("*")
      .eq("id", id)
      .eq("building_id", buildingId)
      .maybeSingle();
    mapDbError(error);
    return data ? mapAmenityBooking(data as Record<string, unknown>) : null;
  },

  async approveElevatorBooking(id: string, adminNotes?: string) {
    return updateAmenityBookingStatus(id, {
      status: "confirmed",
      admin_notes: adminNotes?.trim() ?? "",
      unread: true,
    });
  },

  async declineAmenityBooking(id: string, adminNotes?: string) {
    return updateAmenityBookingStatus(id, {
      status: "declined",
      admin_notes: adminNotes?.trim() ?? "",
      unread: true,
    });
  },

  async approvePartyRoomBooking(id: string, paymentAmount: string, adminNotes?: string) {
    const trimmed = paymentAmount.trim();
    if (!trimmed) throw new Error("Payment amount is required.");
    return updateAmenityBookingStatus(id, {
      status: "approvedAwaitingPayment",
      payment_amount: trimmed,
      admin_notes: adminNotes?.trim() ?? "",
      unread: true,
    });
  },

  async cancelAmenityBookingAdmin(id: string, adminNotes?: string) {
    return updateAmenityBookingStatus(id, {
      status: "cancelled",
      admin_notes: adminNotes?.trim() ?? "",
      unread: true,
    });
  },
};
