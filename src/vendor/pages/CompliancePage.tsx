import { useCallback, useEffect, useState } from "react";
import { CrudPanel } from "../../shared/CrudPanel";
import { VendorComplianceUploadCard } from "../../shared/components/VendorComplianceUploadCard";
import { vendorRepository } from "../data/vendorRepository";
import type { Vendor, VendorComplianceSummary } from "../../resident/data/types";

type CompliancePageProps = {
  onRefresh: () => void;
};

export function CompliancePage({ onRefresh }: CompliancePageProps) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [summary, setSummary] = useState<VendorComplianceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoadError(null);
    setLoading(true);
    Promise.all([vendorRepository.getVendor(), vendorRepository.getComplianceSummary()])
      .then(([nextVendor, nextSummary]) => {
        setVendor(nextVendor);
        setSummary(nextSummary);
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : "Unable to load compliance.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaved = () => {
    load();
    onRefresh();
  };

  if (loadError) {
    return <p className="text-sm text-red-600">{loadError}</p>;
  }

  if (loading || !vendor || !summary) {
    return (
      <CrudPanel loading>
        <div className="mb-4 rounded bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white">
          Insurance &amp; WSIB Compliance
        </div>
      </CrudPanel>
    );
  }

  const wsibRequired = vendor.wsibRequired ?? true;

  return (
    <CrudPanel>
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
    </CrudPanel>
  );
}
