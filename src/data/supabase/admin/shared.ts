import type { AddUnitRangeType, Comment, IncidentReportAttachment } from "../../../resident/data/types";
import { mapIncidentReportAttachment, mapServiceRequestAttachment } from "./mappers";
import { buildingIdOrThrow, mapDbError, sb } from "../base";

export async function bid(): Promise<string> {
  return buildingIdOrThrow();
}

export async function resolveBuildingId(explicit?: string): Promise<string> {
  const id = explicit?.trim();
  if (id) return id;
  return bid();
}

export function normalizeCategoryName(name: string): string {
  return name.replace(/\s+/g, " ").trim();
}

export function isSameCategoryName(a: string, b: string): boolean {
  return normalizeCategoryName(a).toLowerCase() === normalizeCategoryName(b).toLowerCase();
}

export function expandRange(start: string, end: string, addType: AddUnitRangeType, prefix = ""): string[] {
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

export function parseUnitFromResident(resident: string): string {
  const match = resident.match(/(Unit\s*\d+)/i);
  if (match?.[1]) return match[1].replace(/\s+/g, " ").trim();
  return "—";
}

export async function ensureIncidentCategory(name: string): Promise<string> {
  const buildingId = await bid();
  const normalized = normalizeCategoryName(name);
  if (!normalized) throw new Error("Incident report type is required.");
  const { data: existing } = await sb()
    .from("incident_report_categories")
    .select("*")
    .eq("building_id", buildingId);
  const match = (existing ?? []).find((c) => isSameCategoryName(c.name as string, normalized));
  if (match) return match.name as string;
  const { data, error } = await sb()
    .from("incident_report_categories")
    .insert({ building_id: buildingId, name: normalized })
    .select("*")
    .single();
  mapDbError(error);
  return data!.name as string;
}

export async function getCompanyIdForBuilding(buildingId: string): Promise<string | null> {
  const { data, error } = await sb().from("buildings").select("company_id").eq("id", buildingId).maybeSingle();
  mapDbError(error);
  return (data?.company_id as string) ?? null;
}

export async function loadEntityComments(entityType: string, entityId: string) {
  const { data, error } = await sb()
    .from("comments")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: true });
  mapDbError(error);
  const adminComments: Comment[] = [];
  const publicComments: Comment[] = [];
  for (const c of data ?? []) {
    const comment: Comment = {
      id: c.id as string,
      author: c.author_name as string,
      text: c.body as string,
      createdAt: String(c.created_at),
      visibility: c.visibility as "admin" | "public",
    };
    if (c.visibility === "admin") adminComments.push({ ...comment, visibility: "admin" });
    else publicComments.push({ ...comment, visibility: "public" });
  }
  return { adminComments, publicComments };
}

export async function loadIncidentReportAttachments(reportId: string) {
  const { data, error } = await sb()
    .from("incident_report_attachments")
    .select("*")
    .eq("incident_report_id", reportId)
    .order("uploaded_at", { ascending: true });
  mapDbError(error);
  return (data ?? []).map((row) => mapIncidentReportAttachment(row as Record<string, unknown>));
}

export async function insertIncidentReportAttachment(
  reportId: string,
  input: {
    fileName: string;
    kind: "image" | "pdf" | "file";
    previewUrl: string;
    uploadedBy: string;
  }
) {
  const buildingId = await bid();
  const { data, error } = await sb()
    .from("incident_report_attachments")
    .insert({
      incident_report_id: reportId,
      building_id: buildingId,
      file_name: input.fileName,
      storage_path: input.previewUrl,
      preview_url: input.previewUrl,
      kind: input.kind,
      uploaded_by: input.uploadedBy,
    })
    .select("*")
    .single();
  mapDbError(error);
  return mapIncidentReportAttachment(data as Record<string, unknown>);
}

export async function removeIncidentReportAttachment(id: string) {
  const { error } = await sb().from("incident_report_attachments").delete().eq("id", id);
  mapDbError(error);
  return true;
}

export async function loadServiceRequestAttachments(serviceRequestId: string) {
  const { data, error } = await sb()
    .from("service_request_attachments")
    .select("*")
    .eq("service_request_id", serviceRequestId)
    .order("uploaded_at", { ascending: true });
  mapDbError(error);
  return (data ?? []).map((row) => mapServiceRequestAttachment(row as Record<string, unknown>));
}

export async function insertServiceRequestAttachment(
  serviceRequestId: string,
  input: {
    fileName: string;
    kind: "image" | "pdf" | "file";
    previewUrl: string;
  }
) {
  const buildingId = await bid();
  const { data, error } = await sb()
    .from("service_request_attachments")
    .insert({
      service_request_id: serviceRequestId,
      building_id: buildingId,
      filename: input.fileName,
      storage_path: input.previewUrl,
      kind: input.kind,
    })
    .select("*")
    .single();
  mapDbError(error);
  return mapServiceRequestAttachment(data as Record<string, unknown>);
}

export async function removeServiceRequestAttachment(id: string) {
  const { error } = await sb().from("service_request_attachments").delete().eq("id", id);
  mapDbError(error);
  return true;
}

export async function insertComment(
  entityType: string,
  entityId: string,
  comment: { author: string; text: string; createdAt?: string },
  visibility: "admin" | "public"
) {
  const buildingId = await bid();
  const {
    data: { user },
  } = await sb().auth.getUser();
  const { data, error } = await sb()
    .from("comments")
    .insert({
      building_id: buildingId,
      entity_type: entityType,
      entity_id: entityId,
      author_name: comment.author,
      author_profile_id: user?.id ?? null,
      body: comment.text,
      visibility,
    })
    .select("*")
    .single();
  mapDbError(error);
  return {
    id: data!.id as string,
    author: data!.author_name as string,
    text: data!.body as string,
    createdAt: String(data!.created_at),
    visibility,
  };
}
