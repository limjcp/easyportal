import { sanitizeFileName } from "../../shared/attachmentUtils";
import { mapDbError, sb } from "./base";

export const BUILDING_DOCUMENTS_BUCKET = "building-documents";
export const GALLERY_PHOTOS_BUCKET = "gallery-photos";
export const VENDOR_DOCUMENTS_BUCKET = "vendor-documents";
export const MAX_BUILDING_DOCUMENT_BYTES = 52_428_800;
export const MAX_GALLERY_PHOTO_BYTES = 52_428_800;
export const MAX_VENDOR_DOCUMENT_BYTES = 52_428_800;

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

export function validateGalleryPhotoFile(file: File): string | null {
  if (!file.name.trim()) return "A file is required.";
  if (!file.type.startsWith("image/")) return "Gallery photos must be image files.";
  if (file.size > MAX_GALLERY_PHOTO_BYTES) return "Photo must be 50MB or smaller.";
  return null;
}

export function buildGalleryPhotoPath(buildingId: string, albumId: string, fileName: string): string {
  const safeName = sanitizeFileName(fileName);
  return `${buildingId}/${albumId}/${crypto.randomUUID()}/${safeName}`;
}

export async function uploadGalleryPhoto(
  buildingId: string,
  albumId: string,
  file: File
): Promise<string> {
  const validationError = validateGalleryPhotoFile(file);
  if (validationError) throw new Error(validationError);

  const path = buildGalleryPhotoPath(buildingId, albumId, file.name);
  const { error } = await sb().storage.from(GALLERY_PHOTOS_BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw new Error(error.message);
  return path;
}

export async function getGalleryPhotoSignedUrl(
  storagePath: string,
  expiresInSeconds = 3600
): Promise<string> {
  const { data, error } = await sb()
    .storage.from(GALLERY_PHOTOS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error) throw new Error(error.message);
  if (!data?.signedUrl) throw new Error("Unable to create photo link.");
  return data.signedUrl;
}

export async function removeGalleryPhoto(storagePath: string | null | undefined): Promise<void> {
  if (!storagePath) return;
  const { error } = await sb().storage.from(GALLERY_PHOTOS_BUCKET).remove([storagePath]);
  if (error) throw new Error(error.message);
}

export function validateVendorDocumentFile(file: File): string | null {
  if (!file.name.trim()) return "A file is required.";
  if (file.size > MAX_VENDOR_DOCUMENT_BYTES) return "Document must be 50MB or smaller.";
  const allowed =
    file.type === "application/pdf" ||
    file.type.startsWith("image/") ||
    /\.(pdf|png|jpe?g)$/i.test(file.name);
  if (!allowed) return "Upload a PDF or image file.";
  return null;
}

export function buildVendorDocumentPath(vendorId: string, fileName: string): string {
  const safeName = sanitizeFileName(fileName);
  return `${vendorId}/${crypto.randomUUID()}/${safeName}`;
}

export async function uploadVendorDocument(vendorId: string, file: File): Promise<string> {
  const validationError = validateVendorDocumentFile(file);
  if (validationError) throw new Error(validationError);

  const path = buildVendorDocumentPath(vendorId, file.name);
  const { error } = await sb().storage.from(VENDOR_DOCUMENTS_BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw new Error(error.message);
  return path;
}

export async function getVendorDocumentSignedUrl(
  storagePath: string,
  expiresInSeconds = 3600
): Promise<string> {
  const { data, error } = await sb()
    .storage.from(VENDOR_DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error) throw new Error(error.message);
  if (!data?.signedUrl) throw new Error("Unable to create download link.");
  return data.signedUrl;
}
