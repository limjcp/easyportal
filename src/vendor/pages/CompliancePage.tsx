import { useCallback, useEffect, useState } from "react";
import { VendorComplianceUploadCard } from "../../shared/components/VendorComplianceUploadCard";
import { vendorRepository } from "../data/vendorRepository";
import type { Vendor, VendorComplianceSummary } from "../../resident/data/types";

type CompliancePageProps = {
  onRefresh: () => void;
};

export function CompliancePage({ onRefresh }: CompliancePageProps) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [summary, setSummary] = useState<VendorComplianceSummary | null>(null);

  const load = useCallback(() => {
    vendorRepository.getVendor().then(setVendor);
    vendorRepository.getComplianceSummary().then(setSummary);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaved = () => {
    load();
    onRefresh();
  };

  if (!vendor || !summary) {
    return <p className="text-sm text-slate-600">Loading compliance…</p>;
  }

  const wsibRequired = vendor.wsibRequired ?? true;

  return (
    <div>
      <div className="mb-4 rounded bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white">
        Insurance &amp; WSIB Compliance
      </div>
      <p className="mb-4 text-sm text-slate-600">
        Upload your insurance certificate and WSIB clearance. Certificates expiring within 7 days
        trigger an automatic reminder email. You will also be notified when a certificate expires.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <VendorComplianceUploadCard
          title="Insurance certificate"
          documentType="insurance"
          vendorId={vendor.id}
          status={summary.insuranceStatus}
          currentDocument={summary.insuranceDocument}
          showInsuranceFields
          onUpload={(type, file, input) => vendorRepository.uploadComplianceDocument(type, file, input)}
          onDownload={(id) => vendorRepository.getComplianceDocumentUrl(id)}
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
              vendorRepository.uploadComplianceDocument(type, file, input)
            }
            onDownload={(id) => vendorRepository.getComplianceDocumentUrl(id)}
            onSaved={handleSaved}
          />
        ) : (
          <div className="rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <h3 className="font-semibold text-slate-800">WSIB clearance</h3>
            <p className="mt-2">WSIB clearance is not required for your vendor profile.</p>
          </div>
        )}
      </div>
    </div>
  );
}
