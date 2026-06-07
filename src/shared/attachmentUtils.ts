export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_PREFIXES = ["image/"];
const ALLOWED_EXACT_MIME = ["application/pdf"];

export function canAttachFile(file: File): boolean {
  if (ALLOWED_EXACT_MIME.includes(file.type)) return true;
  return ALLOWED_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix));
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_") || "attachment";
}

export function inferAttachmentKind(mimeType: string): "image" | "pdf" | "file" {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  return "file";
}

export function canAttachImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export function validateBuildingImageFile(file: File): string | null {
  if (!canAttachImageFile(file)) return "Only JPG, PNG, and GIF images are supported.";
  if (file.size > MAX_ATTACHMENT_BYTES) return "Building image must be 5MB or smaller.";
  return null;
}

export function validateAttachmentFile(file: File): string | null {
  if (!canAttachFile(file)) return "Only PDF and image attachments are supported.";
  if (file.size > MAX_ATTACHMENT_BYTES) return "Each attachment must be 5MB or smaller.";
  return null;
}

export function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Unable to read attachment."));
    reader.readAsDataURL(file);
  });
}

export async function fileToAttachmentPayload(file: File) {
  const error = validateAttachmentFile(file);
  if (error) throw new Error(error);
  const previewUrl = await toDataUrl(file);
  return {
    fileName: sanitizeFileName(file.name),
    kind: inferAttachmentKind(file.type),
    previewUrl,
  };
}
