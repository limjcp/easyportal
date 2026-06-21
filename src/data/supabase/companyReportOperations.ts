import type { Comment } from "../../resident/data/types";
import { fileToAttachmentPayload } from "../../shared/attachmentUtils";
import {
  getActiveBuildingId,
  getActiveCompanyId,
  setActiveBuildingId,
} from "./buildingContext";
import { mapDbError, nowIso, sb } from "./base";
import {
  insertComment,
  insertIncidentReportAttachment,
  loadIncidentReportAttachments,
} from "./admin/shared";
import {
  formatFileSize,
  getBuildingDocumentSignedUrl,
  removeBuildingDocument,
  uploadBuildingDocument,
} from "./storage";

export type CertificateProcessingOption = {
  status: string;
  name: string;
  time: string;
  fee: string;
};

export type CertificateAgent = {
  notifyPurchaser: boolean;
  name: string;
  email: string;
};

export type CertificateSettingsData = {
  processingOptions: CertificateProcessingOption[];
  agents: CertificateAgent[];
  cutOffTime: string;
};

const DEFAULT_CERTIFICATE_SETTINGS: CertificateSettingsData = {
  processingOptions: [
    { status: "Active", name: "Regular Delivery", time: "10 Business Days", fee: "$100.00" },
    { status: "Active", name: "Rush Delivery", time: "5 Calendar Days", fee: "$282.50" },
    { status: "Active", name: "VIP Rush Delivery", time: "2 Calendar Days", fee: "$406.80" },
  ],
  agents: [],
  cutOffTime: "6:00 PM",
};

async function ensureCompanyId(): Promise<string> {
  const activeCompanyId = getActiveCompanyId();
  if (activeCompanyId) return activeCompanyId;

  const {
    data: { user },
  } = await sb().auth.getUser();
  if (user) {
    const { data: membership } = await sb()
      .from("company_memberships")
      .select("company_id")
      .eq("profile_id", user.id)
      .limit(1)
      .maybeSingle();
    if (membership?.company_id) return membership.company_id as string;
  }
  throw new Error("No active company context.");
}

async function getBuildingForCompany(buildingId: string, companyId: string) {
  const { data, error } = await sb()
    .from("buildings")
    .select("*")
    .eq("id", buildingId)
    .eq("company_id", companyId)
    .maybeSingle();
  mapDbError(error);
  return data as Record<string, unknown> | null;
}

async function verifyBuildingAccess(buildingId: string): Promise<string> {
  const companyId = await ensureCompanyId();
  const building = await getBuildingForCompany(buildingId, companyId);
  if (!building) throw new Error("Building not found or access denied.");
  return buildingId;
}

async function withBuildingContext<T>(buildingId: string, fn: () => Promise<T>): Promise<T> {
  const previous = getActiveBuildingId();
  setActiveBuildingId(buildingId);
  try {
    return await fn();
  } finally {
    setActiveBuildingId(previous);
  }
}

async function getActorName(): Promise<string> {
  const {
    data: { user },
  } = await sb().auth.getUser();
  if (!user?.id) return "Company User";
  const { data: profile } = await sb()
    .from("profiles")
    .select("display_name, first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();
  const display = (profile?.display_name as string) || "";
  const full = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
  return display || full || "Company User";
}

function inferCertificateFileKind(fileName: string, mimeType: string): "pdf" | "image" | "zip" {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "zip") return "zip";
  if (mimeType.startsWith("image/")) return "image";
  return "pdf";
}

async function loadIncidentReportBuildingId(id: string): Promise<string> {
  const { data, error } = await sb()
    .from("incident_reports")
    .select("building_id")
    .eq("id", id)
    .maybeSingle();
  mapDbError(error);
  if (!data) throw new Error("Incident report not found.");
  return verifyBuildingAccess(data.building_id as string);
}

async function loadBoardApprovalBuildingId(id: string): Promise<string> {
  const { data, error } = await sb()
    .from("board_approvals")
    .select("building_id")
    .eq("id", id)
    .maybeSingle();
  mapDbError(error);
  if (!data) throw new Error("Board approval not found.");
  return verifyBuildingAccess(data.building_id as string);
}

async function loadCertificateBuildingId(id: string): Promise<string> {
  const { data, error } = await sb()
    .from("status_certificates")
    .select("building_id")
    .eq("id", id)
    .maybeSingle();
  mapDbError(error);
  if (!data) throw new Error("Certificate not found.");
  return verifyBuildingAccess(data.building_id as string);
}

export async function addIncidentReportComment(
  id: string,
  comment: Omit<Comment, "id">,
  visibility: "admin" | "public"
) {
  const buildingId = await loadIncidentReportBuildingId(id);
  return withBuildingContext(buildingId, async () => {
    const result = await insertComment("incident_report", id, comment, visibility);
    if (visibility === "public") {
      const { error } = await sb()
        .from("incident_reports")
        .update({ unread: true, updated_at: nowIso() })
        .eq("id", id);
      mapDbError(error);
    }
    return result;
  });
}

export async function addIncidentReportAttachment(reportId: string, file: File) {
  const buildingId = await loadIncidentReportBuildingId(reportId);
  return withBuildingContext(buildingId, async () => {
    const payload = await fileToAttachmentPayload(file);
    const uploadedBy = await getActorName();
    return insertIncidentReportAttachment(reportId, { ...payload, uploadedBy });
  });
}

export async function archiveIncidentReport(id: string) {
  await loadIncidentReportBuildingId(id);
  const { error } = await sb().from("incident_reports").update({ archived: true }).eq("id", id);
  mapDbError(error);
}

export async function markIncidentReportUnread(id: string) {
  await loadIncidentReportBuildingId(id);
  const { error } = await sb()
    .from("incident_reports")
    .update({ unread: true, updated_at: nowIso() })
    .eq("id", id);
  mapDbError(error);
}

export async function reopenIncidentReport(id: string) {
  await loadIncidentReportBuildingId(id);
  const { error } = await sb()
    .from("incident_reports")
    .update({
      status: "Pending",
      archived: false,
      unread: true,
      resolved_by: null,
      resolved_at: null,
      updated_at: nowIso(),
    })
    .eq("id", id);
  mapDbError(error);
}

export async function sendBoardApprovalVoteReminders(id: string) {
  const actor = await getActorName();
  const now = new Date().toLocaleString();
  await addBoardApprovalComment(
    id,
    {
      dateTime: now,
      author: actor,
      message: "Vote reminders sent to eligible voters.",
    },
    "admin"
  );
}

export async function bulkArchiveIncidentReports(ids: string[]) {
  for (const id of ids) {
    await archiveIncidentReport(id);
  }
}

export async function archiveBoardApproval(id: string) {
  await loadBoardApprovalBuildingId(id);
  const { error } = await sb()
    .from("board_approvals")
    .update({ archived: true, closed_at: nowIso(), unread: false, updated_at: nowIso() })
    .eq("id", id);
  mapDbError(error);
}

export async function markBoardApprovalUnread(id: string) {
  await loadBoardApprovalBuildingId(id);
  const { error } = await sb()
    .from("board_approvals")
    .update({ unread: true, updated_at: nowIso() })
    .eq("id", id);
  mapDbError(error);
}

export async function getBoardApprovalAttachmentUrl(attachmentId: string): Promise<string> {
  const companyId = await ensureCompanyId();
  const { data, error } = await sb()
    .from("board_approval_attachments")
    .select("storage_path, building_id")
    .eq("id", attachmentId)
    .maybeSingle();
  mapDbError(error);
  if (!data) throw new Error("Attachment not found.");
  const building = await getBuildingForCompany(data.building_id as string, companyId);
  if (!building) throw new Error("Attachment not found or access denied.");
  const storagePath = data.storage_path as string | null;
  if (!storagePath) throw new Error("Attachment file is not available.");
  return getBuildingDocumentSignedUrl(storagePath);
}

export async function addBoardApprovalComment(
  id: string,
  comment: Omit<Comment, "id">,
  visibility: "admin" | "public" = "admin"
) {
  const buildingId = await loadBoardApprovalBuildingId(id);
  return withBuildingContext(buildingId, async () => {
    const result = await insertComment("board_approval", id, comment, visibility);
    const { error } = await sb()
      .from("board_approvals")
      .update({ unread: true, updated_at: nowIso() })
      .eq("id", id);
    mapDbError(error);
    return result;
  });
}

export async function archiveStatusCertificate(id: string) {
  await loadCertificateBuildingId(id);
  const { error } = await sb()
    .from("status_certificates")
    .update({ archived: true, updated_at: nowIso() })
    .eq("id", id);
  mapDbError(error);
}

export async function markStatusCertificateUnread(id: string) {
  await loadCertificateBuildingId(id);
  const { error } = await sb()
    .from("status_certificates")
    .update({ unread: true, updated_at: nowIso() })
    .eq("id", id);
  mapDbError(error);
}

export async function uploadCertificateFile(
  certificateId: string,
  file: File,
  label?: string,
  excluded = false
) {
  const buildingId = await loadCertificateBuildingId(certificateId);
  const storagePath = await uploadBuildingDocument(buildingId, file);
  const fileLabel = label?.trim() || file.name.replace(/\.[^.]+$/, "").toUpperCase();
  const { data, error } = await sb()
    .from("certificate_files")
    .insert({
      certificate_id: certificateId,
      building_id: buildingId,
      label: fileLabel,
      file_name: file.name,
      storage_path: storagePath,
      size_label: formatFileSize(file.size),
      kind: inferCertificateFileKind(file.name, file.type),
      excluded,
    })
    .select("*")
    .single();
  mapDbError(error);
  return data!;
}

export async function deleteCertificateFile(fileId: string) {
  const companyId = await ensureCompanyId();
  const { data, error } = await sb()
    .from("certificate_files")
    .select("storage_path, building_id")
    .eq("id", fileId)
    .maybeSingle();
  mapDbError(error);
  if (!data) throw new Error("File not found.");
  const building = await getBuildingForCompany(data.building_id as string, companyId);
  if (!building) throw new Error("File not found or access denied.");
  await removeBuildingDocument(data.storage_path as string | null);
  const { error: deleteError } = await sb().from("certificate_files").delete().eq("id", fileId);
  mapDbError(deleteError);
}

export async function getCertificateFileUrl(fileId: string): Promise<string> {
  const companyId = await ensureCompanyId();
  const { data, error } = await sb()
    .from("certificate_files")
    .select("storage_path, building_id")
    .eq("id", fileId)
    .maybeSingle();
  mapDbError(error);
  if (!data) throw new Error("File not found.");
  const building = await getBuildingForCompany(data.building_id as string, companyId);
  if (!building) throw new Error("File not found or access denied.");
  const storagePath = data.storage_path as string | null;
  if (!storagePath) throw new Error("File is not available.");
  return getBuildingDocumentSignedUrl(storagePath);
}

export async function addCertificateHistoryEntry(
  certificateId: string,
  action: string,
  actorName?: string
) {
  await loadCertificateBuildingId(certificateId);
  const actor = actorName ?? (await getActorName());
  const { error } = await sb().from("certificate_history").insert({
    certificate_id: certificateId,
    actor_name: actor,
    action,
  });
  mapDbError(error);
}

export async function refundAndArchiveCertificate(id: string) {
  await loadCertificateBuildingId(id);
  const actor = await getActorName();
  const { error } = await sb()
    .from("status_certificates")
    .update({ archived: true, status: "Refunded", updated_at: nowIso() })
    .eq("id", id);
  mapDbError(error);
  await addCertificateHistoryEntry(id, "Refunded and archived", actor);
}

export async function resendCertificateToUser(id: string) {
  await loadCertificateBuildingId(id);
  const actor = await getActorName();
  await addCertificateHistoryEntry(id, "Certificate resent to user", actor);
}

export async function verifyCertificateBuildingAccess(buildingId: string) {
  return verifyBuildingAccess(buildingId);
}

export async function getCertificateSettings(buildingId: string): Promise<CertificateSettingsData> {
  await verifyBuildingAccess(buildingId);
  const { data, error } = await sb()
    .from("certificate_settings")
    .select("settings")
    .eq("building_id", buildingId)
    .maybeSingle();
  mapDbError(error);
  const settings = (data?.settings as Record<string, unknown>) ?? {};
  return {
    processingOptions:
      (settings.processingOptions as CertificateProcessingOption[]) ??
      DEFAULT_CERTIFICATE_SETTINGS.processingOptions,
    agents: (settings.agents as CertificateAgent[]) ?? DEFAULT_CERTIFICATE_SETTINGS.agents,
    cutOffTime: (settings.cutOffTime as string) ?? DEFAULT_CERTIFICATE_SETTINGS.cutOffTime,
  };
}

export async function saveCertificateSettings(
  buildingId: string,
  settings: CertificateSettingsData
): Promise<CertificateSettingsData> {
  await verifyBuildingAccess(buildingId);
  const payload = {
    processingOptions: settings.processingOptions,
    agents: settings.agents,
    cutOffTime: settings.cutOffTime,
  };
  const { error } = await sb()
    .from("certificate_settings")
    .upsert({ building_id: buildingId, settings: payload, updated_at: nowIso() });
  mapDbError(error);
  return settings;
}

export { loadIncidentReportAttachments };
