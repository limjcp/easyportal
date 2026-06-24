import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ActionButton } from "../ActionButton";
import { FormAlert } from "../FormAlert";
import { useAsyncAction } from "../useAsyncAction";
import { invokeExtractVendorDocument } from "../../data/supabase/extractVendorDocument";
import { uploadVendorDocument } from "../../data/supabase/storage";
import type {
  VendorComplianceDocument,
  VendorComplianceDocumentType,
  VendorComplianceStatus,
  VendorComplianceUploadInput,
} from "../../resident/data/types";
import {
  complianceStatusBadgeClass,
  complianceStatusLabel,
} from "../vendorComplianceUtils";

type VendorComplianceUploadCardProps = {
  title: string;
  documentType: VendorComplianceDocumentType;
  vendorId: string;
  status: VendorComplianceStatus;
  currentDocument?: VendorComplianceDocument;
  showInsuranceFields?: boolean;
  disabled?: boolean;
  onUpload: (
    documentType: VendorComplianceDocumentType,
    file: File | null,
    input: VendorComplianceUploadInput
  ) => Promise<VendorComplianceDocument>;
  onDownload: (documentId: string) => Promise<string>;
  onSaved: () => void;
};

export function VendorComplianceUploadCard({
  title,
  documentType,
  vendorId,
  status,
  currentDocument,
  showInsuranceFields = false,
  disabled = false,
  onUpload,
  onDownload,
  onSaved,
}: VendorComplianceUploadCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [stagedPath, setStagedPath] = useState<string | null>(null);
  const [expiryDate, setExpiryDate] = useState("");
  const [carrier, setCarrier] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [coverageAmount, setCoverageAmount] = useState("");
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, unknown> | undefined>();

  useEffect(() => {
    if (currentDocument) {
      setExpiryDate(currentDocument.expiryDate);
      setCarrier(currentDocument.carrier ?? "");
      setPolicyNumber(currentDocument.policyNumber ?? "");
      setCoverageAmount(currentDocument.coverageAmount ?? "");
    }
  }, [currentDocument]);

  const { run: stageAndExtract, loading: extracting, error: extractError } = useAsyncAction(
    useCallback(
      async (selected: File) => {
        const path = await uploadVendorDocument(vendorId, selected);
        setStagedPath(path);
        setFile(selected);
        const suggestions = await invokeExtractVendorDocument({
          storagePath: path,
          documentType,
        });
        if (suggestions.available) {
          if (suggestions.expiryDate) setExpiryDate(suggestions.expiryDate);
          if (suggestions.carrier) setCarrier(suggestions.carrier);
          if (suggestions.policyNumber) setPolicyNumber(suggestions.policyNumber);
          if (suggestions.coverageAmount) setCoverageAmount(suggestions.coverageAmount);
          setAiSuggestions(suggestions as Record<string, unknown>);
          setAiNote(
            suggestions.confidence
              ? `AI suggestions applied (confidence ${Math.round(suggestions.confidence * 100)}%). Please review before saving.`
              : "AI suggestions applied. Please review before saving."
          );
        } else {
          setAiSuggestions(undefined);
          setAiNote("Enter the details manually or configure OPENAI_API_KEY for AI assist.");
        }
      },
      [documentType, vendorId]
    ),
    { showSuccessToast: false, showErrorToast: false }
  );

  const { run: saveDocument, loading: saving, error: saveError } = useAsyncAction(
    useCallback(async () => {
      await onUpload(documentType, file, {
        expiryDate,
        carrier: carrier || undefined,
        policyNumber: policyNumber || undefined,
        coverageAmount: coverageAmount || undefined,
        aiSuggestions,
        storagePath: stagedPath ?? undefined,
        fileName: file?.name,
        mimeType: file?.type,
      });
      setFile(null);
      setStagedPath(null);
      setAiNote(null);
      setAiSuggestions(undefined);
      onSaved();
    }, [
      aiSuggestions,
      carrier,
      coverageAmount,
      documentType,
      expiryDate,
      file,
      onSaved,
      onUpload,
      policyNumber,
      stagedPath,
    ]),
    {
      successMessage: `${title} saved.`,
      errorMessage: `Unable to save ${title.toLowerCase()}.`,
    }
  );

  const { run: downloadCurrent, loading: downloading } = useAsyncAction(
    useCallback(async () => {
      if (!currentDocument) return;
      const url = await onDownload(currentDocument.id);
      window.open(url, "_blank", "noopener,noreferrer");
    }, [currentDocument, onDownload]),
    { showSuccessToast: false, showErrorToast: true, errorMessage: "Unable to download file." }
  );

  const handleFileChange = (selected: File | null) => {
    if (!selected) return;
    void stageAndExtract(selected);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!stagedPath && !file) {
      return;
    }
    void saveDocument();
  };

  const displayError = extractError ?? saveError;

  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${complianceStatusBadgeClass(status)}`}
        >
          {complianceStatusLabel(status)}
        </span>
      </div>

      {currentDocument ? (
        <div className="mb-4 rounded border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
          <p>
            <strong>Current file:</strong> {currentDocument.fileName}
          </p>
          <p>
            <strong>Expires:</strong> {currentDocument.expiryDate}
          </p>
          {showInsuranceFields && currentDocument.coverageAmount ? (
            <p>
              <strong>Coverage:</strong> {currentDocument.coverageAmount}
            </p>
          ) : null}
          <ActionButton
            label="Download current file"
            loadingLabel="Opening…"
            loading={downloading}
            className="mt-2 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            onClick={() => void downloadCurrent()}
          />
        </div>
      ) : (
        <p className="mb-4 text-sm text-slate-600">No certificate on file.</p>
      )}

      {displayError ? <FormAlert message={displayError} className="mb-3" /> : null}
      {aiNote ? <p className="mb-3 text-xs text-slate-600">{aiNote}</p> : null}

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm">
          <span className="text-slate-600">Upload new certificate (PDF or image)</span>
          <input
            type="file"
            accept=".pdf,image/*"
            disabled={disabled || extracting || saving}
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm"
          />
        </label>
        {extracting ? <p className="text-xs text-slate-500">Reading document…</p> : null}
        {file ? (
          <p className="text-xs text-slate-500">Selected: {file.name}</p>
        ) : null}

        <label className="block text-sm">
          <span className="text-slate-600">Expiry date</span>
          <input
            type="date"
            required
            value={expiryDate}
            disabled={disabled || saving}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>

        {showInsuranceFields ? (
          <>
            <label className="block text-sm">
              <span className="text-slate-600">Insurance carrier</span>
              <input
                value={carrier}
                disabled={disabled || saving}
                onChange={(e) => setCarrier(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Policy number</span>
              <input
                value={policyNumber}
                disabled={disabled || saving}
                onChange={(e) => setPolicyNumber(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Coverage amount</span>
              <input
                value={coverageAmount}
                disabled={disabled || saving}
                onChange={(e) => setCoverageAmount(e.target.value)}
                placeholder="e.g. $2M general liability"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
          </>
        ) : null}

        <ActionButton
          type="submit"
          label={currentDocument ? "Upload replacement" : "Save certificate"}
          loadingLabel="Saving…"
          loading={saving}
          disabled={disabled || (!stagedPath && !file)}
          className="bg-[#0d9488] hover:bg-[#0b7a70]"
        />
      </form>
    </div>
  );
}
