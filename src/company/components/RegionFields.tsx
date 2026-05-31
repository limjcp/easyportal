import {
  AU_TERRITORIES,
  CANADIAN_PROVINCES,
  COUNTRY_OPTIONS,
  MEXICO_STATES,
  UK_TERRITORIES,
  US_STATES,
} from "../data/mock/buildingFormOptions";

const inputClass = "mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm";

type RegionFieldsProps = {
  country: string;
  onCountryChange: (value: string) => void;
  regionCanada: string;
  onRegionCanadaChange: (value: string) => void;
  regionUsa: string;
  onRegionUsaChange: (value: string) => void;
  regionMexico: string;
  onRegionMexicoChange: (value: string) => void;
  regionUk: string;
  onRegionUkChange: (value: string) => void;
  regionAustralia: string;
  onRegionAustraliaChange: (value: string) => void;
  regionOther: string;
  onRegionOtherChange: (value: string) => void;
  layout?: "split" | "stacked";
};

function regionMode(country: string) {
  if (country === "Canada") return "canada";
  if (country === "United States") return "usa";
  if (country === "Mexico") return "mexico";
  if (country === "United Kingdom") return "uk";
  if (country === "Australia") return "australia";
  return "other";
}

export function RegionFields({
  country,
  onCountryChange,
  regionCanada,
  onRegionCanadaChange,
  regionUsa,
  onRegionUsaChange,
  regionMexico,
  onRegionMexicoChange,
  regionUk,
  onRegionUkChange,
  regionAustralia,
  onRegionAustraliaChange,
  regionOther,
  onRegionOtherChange,
  layout = "split",
}: RegionFieldsProps) {
  const mode = regionMode(country);
  const countryCol = layout === "split" ? "sm:col-span-6" : "";

  return (
    <>
      <div className={countryCol}>
        <label className="text-sm font-medium text-slate-700">
          Country <span className="text-red-600">*</span>
        </label>
        <select
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
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

      <div className={countryCol}>
        {mode === "canada" && (
          <>
            <label className="text-sm font-medium text-slate-700">
              Province <span className="text-red-600">*</span>
            </label>
            <select
              value={regionCanada}
              onChange={(e) => onRegionCanadaChange(e.target.value)}
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
        {mode === "usa" && (
          <>
            <label className="text-sm font-medium text-slate-700">
              State <span className="text-red-600">*</span>
            </label>
            <select
              value={regionUsa}
              onChange={(e) => onRegionUsaChange(e.target.value)}
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
        {mode === "mexico" && (
          <>
            <label className="text-sm font-medium text-slate-700">
              State <span className="text-red-600">*</span>
            </label>
            <select
              value={regionMexico}
              onChange={(e) => onRegionMexicoChange(e.target.value)}
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
        {mode === "uk" && (
          <>
            <label className="text-sm font-medium text-slate-700">
              Territory <span className="text-red-600">*</span>
            </label>
            <select
              value={regionUk}
              onChange={(e) => onRegionUkChange(e.target.value)}
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
        {mode === "australia" && (
          <>
            <label className="text-sm font-medium text-slate-700">
              Territory <span className="text-red-600">*</span>
            </label>
            <select
              value={regionAustralia}
              onChange={(e) => onRegionAustraliaChange(e.target.value)}
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
        {mode === "other" && (
          <>
            <label className="text-sm font-medium text-slate-700">
              State / Province <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={regionOther}
              onChange={(e) => onRegionOtherChange(e.target.value)}
              required
              className={inputClass}
            />
          </>
        )}
      </div>
    </>
  );
}

export function getProvinceStateFromRegions(args: {
  country: string;
  regionCanada: string;
  regionUsa: string;
  regionMexico: string;
  regionUk: string;
  regionAustralia: string;
  regionOther: string;
}): string {
  switch (regionMode(args.country)) {
    case "canada":
      return args.regionCanada;
    case "usa":
      return args.regionUsa;
    case "mexico":
      return args.regionMexico;
    case "uk":
      return args.regionUk;
    case "australia":
      return args.regionAustralia;
    default:
      return args.regionOther;
  }
}

export function initRegionsFromProvince(country: string, provinceState: string) {
  const empty = { canada: "", usa: "", mexico: "", uk: "", australia: "", other: "" };
  const mode = regionMode(country);
  if (mode === "canada") return { ...empty, canada: provinceState };
  if (mode === "usa") return { ...empty, usa: provinceState };
  if (mode === "mexico") return { ...empty, mexico: provinceState };
  if (mode === "uk") return { ...empty, uk: provinceState };
  if (mode === "australia") return { ...empty, australia: provinceState };
  return { ...empty, other: provinceState };
}
