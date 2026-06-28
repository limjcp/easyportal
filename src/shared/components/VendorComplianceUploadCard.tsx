import { useCallback, useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { FaCheckCircle, FaCloudUploadAlt, FaFilePdf, FaSpinner } from "react-icons/fa";
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
  const [validationError, setValidationError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentDocument) {
      setExpiryDate(currentDocument.expiryDate);
      setCarrier(currentDocument.carrier ?? "");
      setPolicyNumber(currentDocument.policyNumber ?? "");
      setCoverageAmount(currentDocument.coverageAmount ?? "");
    }
  }, [currentDocument]);

  const { run: stageFile, loading: staging, error: stageError } = useAsyncAction(
    useCallback(async (selected: File) => {
      const path = await uploadVendorDocument(vendorId, selected);
      setStagedPath(path);
      setFile(selected);
      setValidationError(null);
      setAiNote(null);
      setAiSuggestions(undefined);
      return path;
    }, [vendorId]),
    { showSuccessToast: false, showErrorToast: false }
  );

  const { run: runExtraction, loading: extracting } = useAsyncAction(
    useCallback(
      async (path: string) => {
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
              ? `AI read the expiry date (confidence ${Math.round(suggestions.confidence * 100)}%). Please review before saving.`
              : "AI read the expiry date. Please review before saving."
          );
        } else {
          setAiSuggestions(undefined);
          setAiNote("Enter the expiry date manually. AI assist is unavailable right now.");
        }
      },
      [documentType]
    ),
    { showSuccessToast: false, showErrorToast: false, trackBusy: false }
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
    void stageFile(selected).then((path) => {
      if (path) void runExtraction(path);
    });
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (!disabled && !staging && !saving) setDragActive(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (disabled || staging || saving) return;
    handleFileChange(e.dataTransfer.files?.[0] ?? null);
  };

  const uploadBusy = staging || extracting;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (!stagedPath && !file) {
      setValidationError("Upload a certificate file before saving.");
      return;
    }
    if (!expiryDate.trim()) {
      setValidationError("Expiry date is required.");
      return;
    }
    void saveDocument();
  };

  const displayError = validationError ?? stageError ?? saveError;
  const fileReady = Boolean(stagedPath || file);

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
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">
            {currentDocument ? "Upload replacement certificate" : "Upload certificate"}
          </p>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={[
              "relative rounded-lg border-2 border-dashed p-6 text-center transition-colors",
              fileReady
                ? "border-[#0d9488] bg-[#ecfdf5]"
                : dragActive
                  ? "border-[#0d9488] bg-[#f0fdfa]"
                  : "border-[#99f6e4] bg-[#f0fdfa]/60 hover:border-[#0d9488] hover:bg-[#ecfdf5]",
              disabled || saving ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            ].join(" ")}
            onClick={() => {
              if (!disabled && !staging && !saving) fileInputRef.current?.click();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (!disabled && !staging && !saving) fileInputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={disabled || saving ? -1 : 0}
            aria-label="Upload certificate file"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              disabled={disabled || staging || saving}
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              className="hidden"
            />

            {uploadBusy ? (
              <div className="flex flex-col items-center gap-2 text-[#0f766e]">
                <FaSpinner className="animate-spin text-3xl" aria-hidden />
                <p className="text-sm font-semibold">
                  {staging ? "Uploading certificate…" : "Reading expiry date with AI…"}
                </p>
              </div>
            ) : file ? (
              <div className="flex flex-col items-center gap-2">
                <FaCheckCircle className="text-3xl text-[#0d9488]" aria-hidden />
                <p className="text-sm font-semibold text-[#0f766e]">Certificate ready to save</p>
                <p className="flex max-w-full items-center justify-center gap-1.5 truncate text-sm text-slate-700">
                  <FaFilePdf className="shrink-0 text-slate-500" aria-hidden />
                  <span className="truncate">{file.name}</span>
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="mt-1 text-xs font-medium text-[#0d9488] underline-offset-2 hover:underline"
                >
                  Choose a different file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0d9488] text-white shadow-md">
                  <FaCloudUploadAlt className="text-2xl" aria-hidden />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800">
                    Drop your certificate here
                  </p>
                  <p className="mt-1 text-sm text-slate-600">PDF or image — click to browse</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-md bg-[#0d9488] px-5 py-2.5 text-sm font-semibold text-white shadow-sm">
                  <FaCloudUploadAlt aria-hidden />
                  Choose file
                </span>
              </div>
            )}
          </div>
        </div>

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
          disabled={disabled || !fileReady || !expiryDate.trim()}
          className="w-full bg-[#0d9488] py-2.5 text-base font-semibold shadow-sm hover:bg-[#0b7a70] sm:w-auto"
        />
      </form>
    </div>
  );
}
