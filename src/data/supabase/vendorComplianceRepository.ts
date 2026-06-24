import type {
  VendorComplianceAiSuggestions,
  VendorComplianceDocument,
  VendorComplianceDocumentType,
  VendorComplianceSummary,
  VendorComplianceUploadInput,
} from "../../resident/data/types";
import { getComplianceStatus } from "../../shared/vendorComplianceUtils";
import { mapDbError, nowIso, sb } from "./base";
import {
  getVendorDocumentSignedUrl,
  uploadVendorDocument,
} from "./storage";

function mapComplianceDocument(row: Record<string, unknown>): VendorComplianceDocument {
  return {
    id: row.id as string,
    vendorId: row.vendor_id as string,
    documentType: row.document_type as VendorComplianceDocumentType,
    storagePath: row.storage_path as string,
    fileName: row.file_name as string,
    mimeType: row.mime_type as string,
    expiryDate: row.expiry_date as string,
    carrier: (row.carrier as string) || undefined,
    policyNumber: (row.policy_number as string) || undefined,
    coverageAmount: (row.coverage_amount as string) || undefined,
    aiSuggestions: (row.ai_suggestions as Record<string, unknown>) || undefined,
    confirmedAt: row.confirmed_at as string,
    uploadedByProfileId: (row.uploaded_by_profile_id as string) || undefined,
    supersededAt: (row.superseded_at as string) || undefined,
    createdAt: row.created_at as string,
  };
}

function buildSummary(
  documents: VendorComplianceDocument[],
  wsibRequired: boolean
): VendorComplianceSummary {
  const active = documents.filter((d) => !d.supersededAt);
  const insuranceDocument = active.find((d) => d.documentType === "insurance");
  const wsibDocument = active.find((d) => d.documentType === "wsib");

  return {
    insuranceStatus: getComplianceStatus(insuranceDocument?.expiryDate, Boolean(insuranceDocument)),
    wsibStatus: wsibRequired
      ? getComplianceStatus(wsibDocument?.expiryDate, Boolean(wsibDocument))
      : "valid",
    insuranceDocument,
    wsibDocument,
  };
}

async function getCurrentUserId(): Promise<string | undefined> {
  const {
    data: { user },
  } = await sb().auth.getUser();
  return user?.id;
}

async function supersedeActiveDocument(
  vendorId: string,
  documentType: VendorComplianceDocumentType
): Promise<void> {
  const { error } = await sb()
    .from("vendor_compliance_documents")
    .update({ superseded_at: nowIso() })
    .eq("vendor_id", vendorId)
    .eq("document_type", documentType)
    .is("superseded_at", null);
  mapDbError(error);
}

export const vendorComplianceRepository = {
  async getComplianceDocuments(vendorId: string): Promise<VendorComplianceDocument[]> {
    const { data, error } = await sb()
      .from("vendor_compliance_documents")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });
    mapDbError(error);
    return (data ?? []).map((row) => mapComplianceDocument(row as Record<string, unknown>));
  },

  async getComplianceSummary(
    vendorId: string,
    wsibRequired = true
  ): Promise<VendorComplianceSummary> {
    const documents = await this.getComplianceDocuments(vendorId);
    return buildSummary(documents, wsibRequired);
  },

  async getComplianceSummariesForVendors(
    vendorIds: string[],
    wsibRequiredByVendor: Record<string, boolean>
  ): Promise<Record<string, VendorComplianceSummary>> {
    if (vendorIds.length === 0) return {};
    const { data, error } = await sb()
      .from("vendor_compliance_documents")
      .select("*")
      .in("vendor_id", vendorIds)
      .is("superseded_at", null);
    mapDbError(error);

    const byVendor = new Map<string, VendorComplianceDocument[]>();
    for (const row of data ?? []) {
      const doc = mapComplianceDocument(row as Record<string, unknown>);
      const list = byVendor.get(doc.vendorId) ?? [];
      list.push(doc);
      byVendor.set(doc.vendorId, list);
    }

    const result: Record<string, VendorComplianceSummary> = {};
    for (const vendorId of vendorIds) {
      result[vendorId] = buildSummary(
        byVendor.get(vendorId) ?? [],
        wsibRequiredByVendor[vendorId] ?? true
      );
    }
    return result;
  },

  async uploadComplianceDocument(
    vendorId: string,
    documentType: VendorComplianceDocumentType,
    file: File | null,
    input: VendorComplianceUploadInput
  ): Promise<VendorComplianceDocument> {
    if (!input.expiryDate.trim()) throw new Error("Expiry date is required.");

    const storagePath =
      input.storagePath?.trim() || (file ? await uploadVendorDocument(vendorId, file) : "");
    if (!storagePath) throw new Error("A file is required.");

    const fileName = input.fileName?.trim() || file?.name || "document.pdf";
    const mimeType = input.mimeType?.trim() || file?.type || "application/pdf";
    const profileId = await getCurrentUserId();

    await supersedeActiveDocument(vendorId, documentType);

    const { data, error } = await sb()
      .from("vendor_compliance_documents")
      .insert({
        vendor_id: vendorId,
        document_type: documentType,
        storage_path: storagePath,
        file_name: fileName,
        mime_type: mimeType,
        expiry_date: input.expiryDate,
        carrier: input.carrier?.trim() || null,
        policy_number: input.policyNumber?.trim() || null,
        coverage_amount: input.coverageAmount?.trim() || null,
        ai_suggestions: input.aiSuggestions ?? null,
        confirmed_at: nowIso(),
        uploaded_by_profile_id: profileId ?? null,
      })
      .select("*")
      .single();
    mapDbError(error);
    return mapComplianceDocument(data as Record<string, unknown>);
  },

  async getDocumentDownloadUrl(documentId: string): Promise<string> {
    const { data, error } = await sb()
      .from("vendor_compliance_documents")
      .select("storage_path")
      .eq("id", documentId)
      .maybeSingle();
    mapDbError(error);
    if (!data?.storage_path) throw new Error("Document not found.");
    return getVendorDocumentSignedUrl(data.storage_path as string);
  },
};
