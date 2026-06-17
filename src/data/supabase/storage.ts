import { sanitizeFileName } from "../../shared/attachmentUtils";
import { mapDbError, sb } from "./base";

export const BUILDING_DOCUMENTS_BUCKET = "building-documents";
export const MAX_BUILDING_DOCUMENT_BYTES = 52_428_800;

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function inferDocumentFileType(filename: string, mimeType: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext) return ext;
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("image/")) return mimeType.split("/")[1] ?? "image";
  return "file";
}

export function validateBuildingDocumentFile(file: File): string | null {
  if (!file.name.trim()) return "A file is required.";
  if (file.size > MAX_BUILDING_DOCUMENT_BYTES) return "Document must be 50MB or smaller.";
  return null;
}

export function buildBuildingDocumentPath(buildingId: string, fileName: string): string {
  const safeName = sanitizeFileName(fileName);
  return `${buildingId}/${crypto.randomUUID()}/${safeName}`;
}

export async function uploadBuildingDocument(buildingId: string, file: File): Promise<string> {
  const validationError = validateBuildingDocumentFile(file);
  if (validationError) throw new Error(validationError);

  const path = buildBuildingDocumentPath(buildingId, file.name);
  const { error } = await sb().storage.from(BUILDING_DOCUMENTS_BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw new Error(error.message);
  return path;
}

export async function getBuildingDocumentSignedUrl(
  storagePath: string,
  expiresInSeconds = 3600
): Promise<string> {
  const { data, error } = await sb()
    .storage.from(BUILDING_DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error) throw new Error(error.message);
  if (!data?.signedUrl) throw new Error("Unable to create download link.");
  return data.signedUrl;
}

export async function removeBuildingDocument(storagePath: string | null | undefined): Promise<void> {
  if (!storagePath) return;
  const { error } = await sb().storage.from(BUILDING_DOCUMENTS_BUCKET).remove([storagePath]);
  if (error) throw new Error(error.message);
}
