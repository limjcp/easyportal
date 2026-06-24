import { useCallback, useEffect, useState } from "react";
import { Modal } from "../../shared/Modal";
import { VendorComplianceUploadCard } from "../../shared/components/VendorComplianceUploadCard";
import {
  complianceStatusBadgeClass,
  complianceStatusLabel,
} from "../../shared/vendorComplianceUtils";
import { vendorComplianceRepository } from "../../data/supabase/vendorComplianceRepository";
import type { Vendor, VendorComplianceSummary } from "../../resident/data/types";

type VendorComplianceModalProps = {
  open: boolean;
  vendor: Vendor | null;
  onClose: () => void;
  onSaved: () => void;
};

export function VendorComplianceModal({
  open,
  vendor,
  onClose,
  onSaved,
}: VendorComplianceModalProps) {
  const [summary, setSummary] = useState<VendorComplianceSummary | null>(null);

  const load = useCallback(() => {
    if (!vendor) return;
    vendorComplianceRepository
      .getComplianceSummary(vendor.id, vendor.wsibRequired ?? true)
      .then(setSummary);
  }, [vendor]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const handleSaved = () => {
    load();
    onSaved();
  };

  if (!vendor) return null;

  const wsibRequired = vendor.wsibRequired ?? true;

  return (
    <Modal open={open} onClose={onClose} title={`Compliance — ${vendor.companyName}`} size="xl">
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${complianceStatusBadgeClass(summary?.insuranceStatus ?? "missing")}`}
        >
          Insurance: {complianceStatusLabel(summary?.insuranceStatus ?? "missing")}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${complianceStatusBadgeClass(wsibRequired ? (summary?.wsibStatus ?? "missing") : "valid")}`}
        >
          WSIB: {wsibRequired ? complianceStatusLabel(summary?.wsibStatus ?? "missing") : "N/A"}
        </span>
      </div>

      {!summary ? (
        <p className="text-sm text-slate-600">Loading…</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <VendorComplianceUploadCard
            title="Insurance certificate"
            documentType="insurance"
            vendorId={vendor.id}
            status={summary.insuranceStatus}
            currentDocument={summary.insuranceDocument}
            showInsuranceFields
            onUpload={(type, file, input) =>
              vendorComplianceRepository.uploadComplianceDocument(vendor.id, type, file, input)
            }
            onDownload={(id) => vendorComplianceRepository.getDocumentDownloadUrl(id)}
            onSaved={handleSaved}
          />
          {wsibRequired ? (
            <VendorComplianceUploadCard
              title="WSIB clearance"
              documentType="wsib"
              vendorId={vendor.id}
              status={summary.wsibStatus}
              currentDocument={summary.wsibDocument}
              onUpload={(type, file, input) =>
                vendorComplianceRepository.uploadComplianceDocument(vendor.id, type, file, input)
              }
              onDownload={(id) => vendorComplianceRepository.getDocumentDownloadUrl(id)}
              onSaved={handleSaved}
            />
          ) : (
            <div className="rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              WSIB clearance is not required for this vendor.
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
