import { COMMON_AREAS } from "../admin/data/buildingDefinitionConstants";

export const OTHER_OPTION = "Other";

export const DEFAULT_SERVICE_REQUEST_CATEGORIES = [
  "Air/Heat",
  "Appliances",
  "Bathroom",
  "Common Area",
  "Doors & Locks",
  "Electrical",
  "Elevator",
  "Flooring",
  "HVAC",
  "Landscaping",
  "Other",
  "Plumbing",
  "Rules Infraction",
  "Windows",
];

const LOCATION_EXTRAS = ["Common Area", "Parking"] as const;

export const DEFAULT_SERVICE_REQUEST_LOCATIONS = Array.from(
  new Set([...LOCATION_EXTRAS, ...COMMON_AREAS])
).sort((a, b) => a.localeCompare(b));

function sortWithOtherLast(names: string[]): string[] {
  const withoutOther = names.filter((name) => name !== OTHER_OPTION);
  const unique = Array.from(new Set(withoutOther)).sort((a, b) => a.localeCompare(b));
  return [...unique, OTHER_OPTION];
}

export function mergeServiceCategoryOptions(dbNames: string[]): string[] {
  return sortWithOtherLast([...DEFAULT_SERVICE_REQUEST_CATEGORIES, ...dbNames]);
}

export function mergeServiceLocationOptions(
  buildingCommonAreas: string[] = [],
  unitLabel?: string
): string[] {
  const extras = unitLabel ? [unitLabel] : [];
  return sortWithOtherLast([
    ...DEFAULT_SERVICE_REQUEST_LOCATIONS,
    ...buildingCommonAreas,
    ...extras,
  ]);
}

export function resolveServiceRequestLocation(
  selected: string,
  customLocation: string
): string {
  return selected === OTHER_OPTION ? customLocation.trim() : selected;
}

export const SERVICE_REQUEST_SEVERITY_OPTIONS = ["", "Low", "Medium", "High", "Emergency"] as const;
export const SERVICE_REQUEST_SUBMITTABLE_SEVERITIES = ["Low", "Medium", "High"] as const;

export function isEmergencyServiceRequestSeverity(severity: string): boolean {
  return severity === "Emergency";
}

export const EMERGENCY_SEVERITY_NOTICE = {
  title: "Emergency service requests",
  paragraphs: [
    "For Emergencies ONLY (Fire, Flood or Breach of Security) Call the emergency hotline 1-844-25-CONDO (26636) and press #3",
    "Additional Charges may apply if used for non-emergency calls",
    "For non emergencies please downgrade your request and continue, or consider emailing your property manager.",
  ],
} as const;

export const EMERGENCY_SEVERITY_SUBMIT_ERROR =
  "Emergency requests cannot be submitted here. Please select Low, Medium, or High, or call the emergency hotline.";
