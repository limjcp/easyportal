import { useEffect, useState } from "react";
import { CANADIAN_PROVINCES } from "../../admin/data/buildingDefinitionConstants";
import { FileUploadZone } from "../../shared/FileUploadZone";
import { FormAlert } from "../../shared/FormAlert";
import { Modal } from "../../shared/Modal";
import { toDataUrl, validateBuildingImageFile } from "../../shared/attachmentUtils";
import {
  isVendorPaymentSettingsConfigured,
  validateVendorPaymentSettings,
} from "../../shared/vendorPaymentUtils";
import {
  VendorPaymentMethodFields,
  type VendorPaymentMethodFormValues,
} from "../components/VendorPaymentMethodFields";
import type { CreateVendorInvoiceInput, VendorPaymentSettings, VendorRoute } from "../../resident/data/types";

type ConvertToInvoiceModalProps = {
  open: boolean;
  poNumber: string;
  loading?: boolean;
  error?: string | null;
  paymentSettings?: VendorPaymentSettings;
  onNavigate?: (route: VendorRoute) => void;
  onClose: () => void;
  onConfirm: (input: CreateVendorInvoiceInput & { logoFile: File | null; logoStoragePath?: string }) => void;
};

function paymentMethodValuesFromSettings(
  settings?: VendorPaymentSettings
): VendorPaymentMethodFormValues {
  return {
    preferredPaymentMethod: settings?.preferredPaymentMethod ?? "bank_transfer",
    bankName: settings?.bankName ?? "",
    bankAccountName: settings?.bankAccountName ?? "",
    bankAccountNumber: settings?.bankAccountNumber ?? "",
    bankInstitutionNumber: settings?.bankInstitutionNumber ?? "",
    bankTransitNumber: settings?.bankTransitNumber ?? "",
    bankSwiftBic: settings?.bankSwiftBic ?? "",
    interacRecipientName: settings?.interacRecipientName ?? "",
    interacEmail: settings?.interacEmail ?? "",
  };
}

export function ConvertToInvoiceModal({
  open,
  poNumber,
  loading = false,
  error,
  paymentSettings,
  onNavigate,
  onClose,
  onConfirm,
}: ConvertToInvoiceModalProps) {
  const [hstNumber, setHstNumber] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingProvince, setBillingProvince] = useState("Ontario");
  const [billingPostalCode, setBillingPostalCode] = useState("");
  const [paymentMethodValues, setPaymentMethodValues] = useState<VendorPaymentMethodFormValues>(
    paymentMethodValuesFromSettings()
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [useSavedLogo, setUseSavedLogo] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setHstNumber("");
      setBillingAddress("");
      setBillingCity("");
      setBillingProvince("Ontario");
      setBillingPostalCode("");
      setPaymentMethodValues(paymentMethodValuesFromSettings());
      setLogoFile(null);
      setLogoPreview(null);
      setUseSavedLogo(false);
      setLocalError(null);
      return;
    }

    setHstNumber(paymentSettings?.hstNumber ?? "");
    setBillingAddress(paymentSettings?.billingAddress ?? "");
    setBillingCity(paymentSettings?.billingCity ?? "");
    setBillingProvince(paymentSettings?.billingProvince || "Ontario");
    setBillingPostalCode(paymentSettings?.billingPostalCode ?? "");
    setPaymentMethodValues(paymentMethodValuesFromSettings(paymentSettings));
    setLogoFile(null);
    setLogoPreview(paymentSettings?.logoUrl ?? null);
    setUseSavedLogo(Boolean(paymentSettings?.logoStoragePath));
    setLocalError(null);
  }, [open, paymentSettings]);

  const handlePaymentMethodChange = <K extends keyof VendorPaymentMethodFormValues>(
    field: K,
    value: VendorPaymentMethodFormValues[K]
  ) => {
    setPaymentMethodValues((current) => ({ ...current, [field]: value }));
  };

  const handleLogoSelect = async (file: File | null) => {
    setLocalError(null);
    if (!file) {
      setLogoFile(null);
      setUseSavedLogo(Boolean(paymentSettings?.logoStoragePath));
      setLogoPreview(paymentSettings?.logoUrl ?? null);
      return;
    }
    const validationError = validateBuildingImageFile(file);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    setLogoFile(file);
    setUseSavedLogo(false);
    setLogoPreview(await toDataUrl(file));
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setUseSavedLogo(false);
    setLogoPreview(null);
  };

  const handleConfirm = () => {
    setLocalError(null);
    const payload = {
      hstNumber,
      billingAddress,
      billingCity,
      billingProvince,
      billingPostalCode,
      ...paymentMethodValues,
    };
    const validationError = validateVendorPaymentSettings(payload);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    onConfirm({
      ...payload,
      logoFile,
      logoStoragePath: !logoFile && useSavedLogo ? paymentSettings?.logoStoragePath : undefined,
    });
  };

  const displayError = localError ?? error;
  const hasSavedSettings = isVendorPaymentSettingsConfigured(paymentSettings);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Convert ${poNumber} to invoice`}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded border border-slate-300 px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="rounded bg-[#0d9488] px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create invoice"}
          </button>
        </div>
      }
    >
      {hasSavedSettings ? (
        <p className="mb-4 text-sm text-slate-600">
          Your saved payment settings have been applied. Review and edit any field before creating
          the invoice.
        </p>
      ) : (
        <p className="mb-4 text-sm text-slate-600">
          Complete the invoice details below. Save them in{" "}
          {onNavigate ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate({ page: "payment-settings" });
              }}
              className="text-[#0d9488] underline"
            >
              Payment Settings
            </button>
          ) : (
            "Payment Settings"
          )}{" "}
          to auto-fill next time.
        </p>
      )}

      {displayError ? <FormAlert message={displayError} className="mb-4" /> : null}

      <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-800">Tax & billing</h3>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">HST number (optional)</span>
            <input
              type="text"
              value={hstNumber}
              onChange={(e) => setHstNumber(e.target.value)}
              placeholder="e.g. 123456789RT0001"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Billing address</span>
            <textarea
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">City</span>
              <input
                value={billingCity}
                onChange={(e) => setBillingCity(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Postal code</span>
              <input
                value={billingPostalCode}
                onChange={(e) => setBillingPostalCode(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Province</span>
            <select
              value={billingProvince}
              onChange={(e) => setBillingProvince(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              {CANADIAN_PROVINCES.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </label>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Company logo (optional)</p>
            {logoPreview && (
              <img
                src={logoPreview}
                alt="Logo preview"
                className="mb-3 h-16 max-w-[200px] rounded border object-contain"
              />
            )}
            <FileUploadZone
              onFileSelect={(file) => void handleLogoSelect(file)}
              onRemove={handleRemoveLogo}
            />
            <p className="mt-2 text-xs text-slate-500">
              {useSavedLogo && !logoFile
                ? "Using your saved logo from Payment Settings."
                : "JPG, PNG, or GIF up to 5MB."}
            </p>
          </div>
        </section>

        <section className="space-y-3 border-t border-slate-200 pt-4">
          <h3 className="text-sm font-semibold text-slate-800">Payment information</h3>
          <VendorPaymentMethodFields
            values={paymentMethodValues}
            onChange={handlePaymentMethodChange}
          />
        </section>
      </div>
    </Modal>
  );
}
