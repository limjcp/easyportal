import { useCallback, useEffect, useMemo, useState } from "react";
import { FaBuilding, FaQuestionCircle } from "react-icons/fa";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { Modal } from "../../shared/Modal";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { PORTAL_SUBDOMAIN_DOMAIN } from "../../shared/portalDomain";
import { companyRepository } from "../data/companyRepository";
import {
  AU_TERRITORIES,
  CANADIAN_PROVINCES,
  CORPORATION_OPTIONS,
  COUNTRY_OPTIONS,
  MEXICO_STATES,
  UK_TERRITORIES,
  US_STATES,
} from "../data/mock/buildingFormOptions";
import type { CompanyBuilding } from "../../resident/data/types";

const inputClass = "mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm";

type AddBuildingModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (building: CompanyBuilding) => void;
  /** Pre-fill from “Copy Property” */
  copyFrom?: CompanyBuilding | null;
};

type RegionMode = "canada" | "usa" | "mexico" | "uk" | "australia" | "other";

function regionModeForCountry(country: string): RegionMode {
  if (country === "Canada") return "canada";
  if (country === "United States") return "usa";
  if (country === "Mexico") return "mexico";
  if (country === "United Kingdom") return "uk";
  if (country === "Australia") return "australia";
  return "other";
}

export function AddBuildingModal({ open, onClose, onCreated, copyFrom }: AddBuildingModalProps) {
  const [subdomain, setSubdomain] = useState("");
  const [subdomainStatus, setSubdomainStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [buildingName, setBuildingName] = useState("");
  const [corp, setCorp] = useState("");
  const [corpNo, setCorpNo] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalZip, setPostalZip] = useState("");
  const [country, setCountry] = useState("");
  const [regionCanada, setRegionCanada] = useState("");
  const [regionUsa, setRegionUsa] = useState("");
  const [regionMexico, setRegionMexico] = useState("");
  const [regionUk, setRegionUk] = useState("");
  const [regionAustralia, setRegionAustralia] = useState("");
  const [regionOther, setRegionOther] = useState("");
  const [showSubdomainHelp, setShowSubdomainHelp] = useState(false);

  const regionMode = regionModeForCountry(country);

  const provinceState = useMemo(() => {
    switch (regionMode) {
      case "canada":
        return regionCanada;
      case "usa":
        return regionUsa;
      case "mexico":
        return regionMexico;
      case "uk":
        return regionUk;
      case "australia":
        return regionAustralia;
      default:
        return regionOther;
    }
  }, [regionMode, regionCanada, regionUsa, regionMexico, regionUk, regionAustralia, regionOther]);

  const { run, loading, error, setError, clearError } = useAsyncAction(
    useCallback(async () => {
      return companyRepository.createBuilding({
        subdomain: subdomain.trim(),
        buildingName: buildingName.trim() || undefined,
        corp,
        corpNo: corpNo.trim() || undefined,
        address: address.trim(),
        city: city.trim(),
        postalZip: postalZip.trim(),
        country,
        provinceState: provinceState.trim(),
      });
    }, [subdomain, buildingName, corp, corpNo, address, city, postalZip, country, provinceState]),
    {
      successMessage: "Property created.",
      onSuccess: (created) => {
        onCreated(created);
        onClose();
      },
    }
  );

  useEffect(() => {
    if (!open) return;
    setSubdomain("");
    setSubdomainStatus("idle");
    setBuildingName(copyFrom?.name ?? "");
    setCorp(copyFrom?.code?.replace(/\d+/g, "").slice(0, 4) ?? "");
    setCorpNo("");
    setAddress(copyFrom?.condoLine?.replace(/^\([^)]+\)\s*/, "") ?? "");
    setCity(copyFrom?.cityProvincePostal?.split(",")[0]?.trim() ?? "");
    setPostalZip("");
    setCountry("Canada");
    setRegionCanada("Ontario");
    setRegionUsa("");
    setRegionMexico("");
    setRegionUk("");
    setRegionAustralia("");
    setRegionOther("");
    clearError();
  }, [open, copyFrom, clearError]);

  useEffect(() => {
    if (!subdomain.trim() || subdomain.trim().length < 2) {
      setSubdomainStatus("idle");
      return;
    }
    setSubdomainStatus("checking");
    const t = setTimeout(() => {
      companyRepository.checkSubdomainAvailable(subdomain).then((ok) => {
        setSubdomainStatus(ok ? "available" : "taken");
      });
    }, 400);
    return () => clearTimeout(t);
  }, [subdomain]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subdomain.trim()) {
      setError("Sub-Domain is required.");
      return;
    }
    if (subdomainStatus === "taken") {
      setError("This sub-domain is not available. Please choose another.");
      return;
    }
    if (!address.trim() || !city.trim() || !postalZip.trim() || !country) {
      setError("Address, City, Postal / Zip, and Country are required.");
      return;
    }
    if (!provinceState.trim()) {
      setError("Province / State is required.");
      return;
    }
    void run();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={copyFrom ? "Copy property" : "Add a new property"}
      icon={<FaBuilding className="text-slate-600" />}
      size="lg"
      footer={
        <>
          <ActionButton label="Cancel" variant="secondary" onClick={onClose} disabled={loading} />
          <ActionButton
            label="Continue"
            type="submit"
            form="add-building-form"
            loading={loading}
            disabled={subdomainStatus === "taken"}
            className="inline-flex items-center bg-[#337ab7] hover:bg-[#286090]"
          />
        </>
      }
    >
      <form id="add-building-form" onSubmit={handleSubmit} className="mx-auto max-w-2xl">
        {error ? <FormAlert message={error} className="mb-3" /> : null}
        <div className="overflow-hidden rounded-sm border border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
            <h3 className="text-sm font-semibold text-slate-800">Property Details:</h3>
          </div>
          <div className="space-y-3 p-4">
            <div>
              <label className="inline-flex items-center text-sm font-medium text-slate-700">
                Sub-Domain <span className="text-red-600">*</span>
                <button
                  type="button"
                  className="ml-1 text-[#337ab7]"
                  title="Choose a subdomain for your resident portal."
                  onClick={() => setShowSubdomainHelp((v) => !v)}
                >
                  <FaQuestionCircle className="text-sm" />
                </button>
              </label>
              {showSubdomainHelp && (
                <p className="mt-1 text-xs text-slate-500">
                  Choose a subdomain for your resident portal.
                </p>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.replace(/\s+/g, "").toLowerCase())}
                  placeholder="Sub-Domain"
                  required
                  className={`${inputClass} max-w-xs flex-1`}
                  autoComplete="off"
                />
                <span className="text-sm text-slate-600">.{PORTAL_SUBDOMAIN_DOMAIN}</span>
              </div>
              {subdomainStatus === "checking" && (
                <p className="mt-1 text-xs text-slate-500">Checking availability…</p>
              )}
              {subdomainStatus === "available" && (
                <p className="mt-1 text-xs text-green-700">This sub-domain is available.</p>
              )}
              {subdomainStatus === "taken" && (
                <p className="mt-1 text-xs text-red-600">This sub-domain is not available.</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Building Name</label>
              <input
                type="text"
                value={buildingName}
                onChange={(e) => setBuildingName(e.target.value)}
                placeholder="Building Name"
                className={inputClass}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-12">
              <div className="sm:col-span-8">
                <label className="text-sm font-medium text-slate-700">Corporation</label>
                <select value={corp} onChange={(e) => setCorp(e.target.value)} className={inputClass}>
                  {CORPORATION_OPTIONS.map((o) => (
                    <option key={`${o.value}-${o.label}`} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-4">
                <label className="text-sm font-medium text-slate-700">Corporation Number</label>
                <input
                  type="text"
                  value={corpNo}
                  onChange={(e) => setCorpNo(e.target.value)}
                  placeholder="Corporation Number"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Address: <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Search by address"
                required
                className={inputClass}
                autoComplete="off"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-12">
              <div className="sm:col-span-7">
                <label className="text-sm font-medium text-slate-700">
                  City: <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  required
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-5">
                <label className="text-sm font-medium text-slate-700">
                  Postal / Zip: <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={postalZip}
                  onChange={(e) => setPostalZip(e.target.value)}
                  placeholder="Postal / Zip"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Country <span className="text-red-600">*</span>
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  className={inputClass}
                >
                  {COUNTRY_OPTIONS.map((o) => (
                    <option key={o.value || "empty"} value={o.value} disabled={o.value === "__sep__"}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                {regionMode === "canada" && (
                  <>
                    <label className="text-sm font-medium text-slate-700">
                      Province <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={regionCanada}
                      onChange={(e) => setRegionCanada(e.target.value)}
                      required
                      className={inputClass}
                    >
                      <option value="">Select</option>
                      {CANADIAN_PROVINCES.filter(Boolean).map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                {regionMode === "usa" && (
                  <>
                    <label className="text-sm font-medium text-slate-700">
                      State <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={regionUsa}
                      onChange={(e) => setRegionUsa(e.target.value)}
                      required
                      className={inputClass}
                    >
                      <option value="">Select</option>
                      {US_STATES.filter(Boolean).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                {regionMode === "mexico" && (
                  <>
                    <label className="text-sm font-medium text-slate-700">
                      State <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={regionMexico}
                      onChange={(e) => setRegionMexico(e.target.value)}
                      required
                      className={inputClass}
                    >
                      <option value="">Select</option>
                      {MEXICO_STATES.filter(Boolean).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                {regionMode === "uk" && (
                  <>
                    <label className="text-sm font-medium text-slate-700">
                      Territory <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={regionUk}
                      onChange={(e) => setRegionUk(e.target.value)}
                      required
                      className={inputClass}
                    >
                      <option value="">Select</option>
                      {UK_TERRITORIES.filter(Boolean).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                {regionMode === "australia" && (
                  <>
                    <label className="text-sm font-medium text-slate-700">
                      Territory <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={regionAustralia}
                      onChange={(e) => setRegionAustralia(e.target.value)}
                      required
                      className={inputClass}
                    >
                      <option value="">Select</option>
                      {AU_TERRITORIES.filter(Boolean).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                {regionMode === "other" && (
                  <>
                    <label className="text-sm font-medium text-slate-700">
                      State / Province <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={regionOther}
                      onChange={(e) => setRegionOther(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
