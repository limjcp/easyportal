import { requireSupabase } from "../../lib/supabaseClient";
import type { VendorComplianceAiSuggestions } from "../../resident/data/types";

export type ExtractVendorDocumentPayload = {
  storagePath: string;
  documentType: "insurance" | "wsib";
};

export async function invokeExtractVendorDocument(
  payload: ExtractVendorDocumentPayload
): Promise<VendorComplianceAiSuggestions> {
  const { data, error } = await requireSupabase().functions.invoke("extract-vendor-document", {
    body: payload,
  });

  const body = data as VendorComplianceAiSuggestions & { error?: string } | null;
  if (error || body?.error) {
    return { available: false };
  }

  return {
    available: body?.available ?? false,
    expiryDate: body?.expiryDate,
    carrier: body?.carrier,
    policyNumber: body?.policyNumber,
    coverageAmount: body?.coverageAmount,
    confidence: body?.confidence,
  };
}
