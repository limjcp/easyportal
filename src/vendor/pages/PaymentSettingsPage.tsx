import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { CANADIAN_PROVINCES } from "../../admin/data/buildingDefinitionConstants";
import { ActionButton } from "../../shared/ActionButton";
import { CrudPanel } from "../../shared/CrudPanel";
import { FileUploadZone } from "../../shared/FileUploadZone";
import { FormAlert } from "../../shared/FormAlert";
import { toDataUrl, validateBuildingImageFile } from "../../shared/attachmentUtils";
import { validateVendorPaymentSettings } from "../../shared/vendorPaymentUtils";
import { useAsyncAction } from "../../shared/useAsyncAction";
import {
  VendorPaymentMethodFields,
  type VendorPaymentMethodFormValues,
} from "../components/VendorPaymentMethodFields";
import { vendorRepository } from "../data/vendorRepository";
import type { VendorPaymentSettings, VendorPreferredPaymentMethod } from "../../resident/data/types";

type PaymentSettingsPageProps = {
  onRefresh: () => void;
};

function paymentMethodValuesFromSettings(
  settings: VendorPaymentSettings
): VendorPaymentMethodFormValues {
  return {
    preferredPaymentMethod: settings.preferredPaymentMethod,
    bankName: settings.bankName,
    bankAccountName: settings.bankAccountName,
    bankAccountNumber: settings.bankAccountNumber,
    bankInstitutionNumber: settings.bankInstitutionNumber,
    bankTransitNumber: settings.bankTransitNumber,
    bankSwiftBic: settings.bankSwiftBic,
    interacRecipientName: settings.interacRecipientName,
    interacEmail: settings.interacEmail,
  };
}

export function PaymentSettingsPage({ onRefresh }: PaymentSettingsPageProps) {
  const [settings, setSettings] = useState<VendorPaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [hstNumber, setHstNumber] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingProvince, setBillingProvince] = useState("Ontario");
  const [billingPostalCode, setBillingPostalCode] = useState("");
  const [paymentMethodValues, setPaymentMethodValues] = useState<VendorPaymentMethodFormValues>({
    preferredPaymentMethod: "bank_transfer",
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankInstitutionNumber: "",
    bankTransitNumber: "",
    bankSwiftBic: "",
    interacRecipientName: "",
    interacEmail: "",
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const logoFileRef = useRef<File | null>(null);
  const [saved, setSaved] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const applySettings = useCallback((next: VendorPaymentSettings) => {
    setSettings(next);
    setHstNumber(next.hstNumber);
    setBillingAddress(next.billingAddress);
    setBillingCity(next.billingCity);
    setBillingProvince(next.billingProvince || "Ontario");
    setBillingPostalCode(next.billingPostalCode);
    setPaymentMethodValues(paymentMethodValuesFromSettings(next));
    setLogoPreview(next.logoUrl ?? null);
    setRemoveLogo(false);
    logoFileRef.current = null;
    setLocalError(null);
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    vendorRepository.getPaymentSettings().then(applySettings).finally(() => setLoading(false));
  }, [applySettings]);

  useEffect(() => {
    load();
  }, [load]);

  const { run: saveSettings, loading: saving, error: saveError } = useAsyncAction(
    useCallback(async () => {
      const payload = {
        hstNumber,
        billingAddress,
        billingCity,
        billingProvince,
        billingPostalCode,
        removeLogo,
        ...paymentMethodValues,
      };
      const validationError = validateVendorPaymentSettings(payload);
      if (validationError) {
        throw new Error(validationError);
      }

      const updated = await vendorRepository.updatePaymentSettings(payload, logoFileRef.current);
      applySettings(updated);
      onRefresh();
    }, [
      applySettings,
      billingAddress,
      billingCity,
      billingPostalCode,
      billingProvince,
      hstNumber,
      onRefresh,
      paymentMethodValues,
      removeLogo,
    ]),
    {
      successMessage: "Payment settings saved.",
      errorMessage: "Unable to save payment settings.",
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
    }
  );

  const handlePaymentMethodChange = <K extends keyof VendorPaymentMethodFormValues>(
    field: K,
    value: VendorPaymentMethodFormValues[K]
  ) => {
    setPaymentMethodValues((current) => ({ ...current, [field]: value }));
  };

  const handleLogoSelect = async (file: File | null) => {
    if (!file) {
      logoFileRef.current = null;
      if (!removeLogo) {
        setLogoPreview(settings?.logoUrl ?? null);
      }
      return;
    }
    const validationError = validateBuildingImageFile(file);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    logoFileRef.current = file;
    setRemoveLogo(false);
    setLogoPreview(await toDataUrl(file));
    setLocalError(null);
  };

  const handleRemoveLogo = () => {
    logoFileRef.current = null;
    setLogoPreview(null);
    setRemoveLogo(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    void saveSettings();
  };

  const displayError = localError ?? saveError;

  return (
    <CrudPanel loading={loading}>
    <div>
      <div className="mb-4 rounded bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white">
        Payment Settings
      </div>

      <p className="mb-4 max-w-2xl text-sm text-slate-600">
        Save your invoicing and payment details once here. When you convert a purchase order to an
        invoice, these values are applied automatically so you do not need to re-enter them each
        time.
      </p>

      {displayError ? <FormAlert message={displayError} className="mb-4" /> : null}

      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-6 rounded border border-slate-200 bg-white p-4"
      >
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">Tax & billing</h3>

          <label className="block text-sm">
            <span className="font-medium text-slate-700">HST registration number (optional)</span>
            <input
              value={hstNumber}
              onChange={(e) => setHstNumber(e.target.value)}
              placeholder="e.g. 123456789RT0001"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-slate-700">Billing address</span>
            <textarea
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              rows={2}
              placeholder="Street address"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">City</span>
              <input
                value={billingCity}
                onChange={(e) => setBillingCity(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Postal code</span>
              <input
                value={billingPostalCode}
                onChange={(e) => setBillingPostalCode(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="font-medium text-slate-700">Province</span>
            <select
              value={billingProvince}
              onChange={(e) => setBillingProvince(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
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
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Company logo"
                className="mb-3 h-16 max-w-[220px] rounded border object-contain"
              />
            ) : null}
            <FileUploadZone
              onFileSelect={(file) => void handleLogoSelect(file)}
              onRemove={handleRemoveLogo}
            />
            <p className="mt-2 text-xs text-slate-500">JPG, PNG, or GIF up to 5MB.</p>
          </div>
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-4">
          <h3 className="text-sm font-semibold text-slate-800">Payment information</h3>
          <VendorPaymentMethodFields
            values={paymentMethodValues}
            onChange={handlePaymentMethodChange}
          />
        </section>

        <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
          <ActionButton
            type="submit"
            label="Save payment settings"
            loadingLabel="Saving…"
            loading={saving}
            className="bg-[#0d9488] hover:bg-[#0b7a70]"
          />
          {saved && !saving ? <span className="text-sm text-green-600">Saved.</span> : null}
        </div>
      </form>
    </div>
    </CrudPanel>
  );
}
