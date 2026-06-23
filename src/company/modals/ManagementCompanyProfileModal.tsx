import { useCallback, useEffect, useState } from "react";
import { FaBuilding, FaTimes, FaTrash } from "react-icons/fa";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { useBusyWhile } from "../../shared/useBusyWhile";
import { PurplePanel } from "../components/PurplePanel";
import {
  RegionFields,
  getProvinceStateFromRegions,
  initRegionsFromProvince,
} from "../components/RegionFields";
import { companyRepository } from "../data/companyRepository";
import { TIMEZONE_OPTIONS } from "../data/mock/timezoneOptions";
import type { ManagementCompanyProfile } from "../../resident/data/types";

const inputClass = "mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm";

type ManagementCompanyProfileModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: (profile: ManagementCompanyProfile) => void | Promise<void>;
};

export function ManagementCompanyProfileModal({
  open,
  onClose,
  onSaved,
}: ManagementCompanyProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalZip, setPostalZip] = useState("");
  const [country, setCountry] = useState("Canada");
  const [regionCanada, setRegionCanada] = useState("Ontario");
  const [regionUsa, setRegionUsa] = useState("");
  const [regionMexico, setRegionMexico] = useState("");
  const [regionUk, setRegionUk] = useState("");
  const [regionAustralia, setRegionAustralia] = useState("");
  const [regionOther, setRegionOther] = useState("");
  const [timezone, setTimezone] = useState("America/Toronto");
  const [companyEmail, setCompanyEmail] = useState("");
  const [tel1, setTel1] = useState("");
  const [tel2, setTel2] = useState("");
  const [fax, setFax] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [deleteLogoOpen, setDeleteLogoOpen] = useState(false);

  const { run, loading: saving, error } = useAsyncAction(
    useCallback(async () => {
      const provinceState = getProvinceStateFromRegions({
        country,
        regionCanada,
        regionUsa,
        regionMexico,
        regionUk,
        regionAustralia,
        regionOther,
      });
      return companyRepository.updateManagementCompanyProfile({
        companyName,
        address,
        city,
        postalZip,
        country,
        provinceState,
        timezone,
        companyEmail,
        tel1,
        tel2,
        fax,
      });
    }, [
      companyName,
      address,
      city,
      postalZip,
      country,
      regionCanada,
      regionUsa,
      regionMexico,
      regionUk,
      regionAustralia,
      regionOther,
      timezone,
      companyEmail,
      tel1,
      tel2,
      fax,
    ]),
    {
      successMessage: "Company profile saved.",
      onSuccess: (updated) => {
        onSaved?.(updated);
        onClose();
      },
    }
  );

  const { run: deleteLogo, loading: deletingLogo } = useAsyncAction(
    useCallback(async () => {
      return companyRepository.deleteManagementCompanyLogo();
    }, []),
    {
      successMessage: "Logo removed.",
      onSuccess: (updated) => {
        setLogoUrl(updated.logoUrl);
        setDeleteLogoOpen(false);
      },
    }
  );

  const loadProfile = async () => {
    setLoading(true);
    const p = await companyRepository.getManagementCompanyProfile();
    setCompanyName(p.companyName);
    setAddress(p.address);
    setCity(p.city);
    setPostalZip(p.postalZip);
    setCountry(p.country);
    const regions = initRegionsFromProvince(p.country, p.provinceState);
    setRegionCanada(regions.canada);
    setRegionUsa(regions.usa);
    setRegionMexico(regions.mexico);
    setRegionUk(regions.uk);
    setRegionAustralia(regions.australia);
    setRegionOther(regions.other);
    setTimezone(p.timezone);
    setCompanyEmail(p.companyEmail);
    setTel1(p.tel1);
    setTel2(p.tel2);
    setFax(p.fax);
    setLogoUrl(p.logoUrl);
    setLoading(false);
  };

  useEffect(() => {
    if (open) loadProfile();
  }, [open]  );

  useBusyWhile(open && loading);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void run();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-5xl rounded-sm bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <FaBuilding className="text-[#7D5DA7]" />
            Management Company Profile
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        {loading ? null : (
          <>
            <div className="max-h-[65vh] overflow-y-auto p-4">
              {error ? <FormAlert message={error} className="mb-4" /> : null}
              <div className="grid gap-4 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-7">
                  <PurplePanel title="Company Information">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Company Name <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          required
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Address <span className="text-red-600">*</span>
                        </label>
                        <textarea
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          required
                          rows={2}
                          className={inputClass}
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium text-slate-700">
                            City <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            required
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700">
                            Postal/Zip <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="text"
                            value={postalZip}
                            onChange={(e) => setPostalZip(e.target.value)}
                            required
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <RegionFields
                          country={country}
                          onCountryChange={setCountry}
                          regionCanada={regionCanada}
                          onRegionCanadaChange={setRegionCanada}
                          regionUsa={regionUsa}
                          onRegionUsaChange={setRegionUsa}
                          regionMexico={regionMexico}
                          onRegionMexicoChange={setRegionMexico}
                          regionUk={regionUk}
                          onRegionUkChange={setRegionUk}
                          regionAustralia={regionAustralia}
                          onRegionAustraliaChange={setRegionAustralia}
                          regionOther={regionOther}
                          onRegionOtherChange={setRegionOther}
                          layout="stacked"
                        />
                        <div>
                          <label className="text-sm font-medium text-slate-700">
                            Time Zone <span className="text-red-600">*</span>
                          </label>
                          <select
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            required
                            className={inputClass}
                          >
                            <option value="">Select</option>
                            {TIMEZONE_OPTIONS.map((tz) => (
                              <option key={tz} value={tz}>
                                {tz}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </PurplePanel>
                </div>

                <div className="space-y-4 lg:col-span-5">
                  <PurplePanel title="Company Logo">
                    {logoUrl ? (
                      <div className="flex items-start gap-3">
                        <img
                          src={logoUrl}
                          alt="Company logo"
                          className="max-h-[100px] max-w-[150px] border border-slate-200 object-contain"
                        />
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setDeleteLogoOpen(true)}
                            className="rounded border border-slate-300 p-2 text-slate-500 hover:bg-slate-50"
                            title="Delete logo"
                          >
                            <FaTrash />
                          </button>
                          {deleteLogoOpen && (
                            <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded border border-slate-200 bg-white p-2 shadow-lg">
                              <p className="mb-2 text-xs text-slate-600">Delete this image?</p>
                              <div className="flex gap-2">
                                <ActionButton
                                  label="Yes"
                                  loading={deletingLogo}
                                  onClick={() => void deleteLogo()}
                                  className="px-2 py-1 text-xs"
                                />
                                <ActionButton
                                  label="Cancel"
                                  variant="secondary"
                                  onClick={() => setDeleteLogoOpen(false)}
                                  disabled={deletingLogo}
                                  className="px-2 py-1 text-xs"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No logo uploaded.</p>
                    )}
                    <label className="mt-3 inline-block cursor-pointer rounded border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100">
                      Upload logo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setLogoUrl(URL.createObjectURL(file));
                        }}
                      />
                    </label>
                  </PurplePanel>

                  <PurplePanel title="Contact Information">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Company Email <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="email"
                          value={companyEmail}
                          onChange={(e) => setCompanyEmail(e.target.value)}
                          required
                          className={inputClass}
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium text-slate-700">
                            Tel 1 <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="text"
                            value={tel1}
                            onChange={(e) => setTel1(e.target.value)}
                            required
                            placeholder="(999) 999-9999"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700">Tel 2</label>
                          <input
                            type="text"
                            value={tel2}
                            onChange={(e) => setTel2(e.target.value)}
                            placeholder="(999) 999-9999"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700">Fax</label>
                          <input
                            type="text"
                            value={fax}
                            onChange={(e) => setFax(e.target.value)}
                            placeholder="(999) 999-9999"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>
                  </PurplePanel>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
              <ActionButton label="Cancel" variant="secondary" onClick={onClose} disabled={saving} />
              <ActionButton label="Save Changes" type="submit" loading={saving} />
            </div>
          </>
        )}
      </form>
    </div>
  );
}
