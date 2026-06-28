import { COMMON_AREAS } from "../admin/data/mock/buildingDefinitionConstants";

export const OTHER_OPTION = "Other";

export const DEFAULT_INCIDENT_CATEGORIES = [
  "Water Leaks/Flooding",
  "Noise Complaint",
  "Broken Window/Glass",
  "Elevator",
  "Garage / Parkade",
  "Odour",
  "Parking / Fire Route",
  "Lobby / Access",
  "Security / Breach",
  "Vandalism",
  "Theft",
  "Fire / Smoke",
  "Rules Infraction",
  "Ceiling / Structural Damage",
] as const;

const INCIDENT_LOCATION_EXTRAS = [
  "Common Area",
  "Parking",
  "Visitor Parking",
  "Mail Room",
  "Fitness Room / Gym",
  "Pool Area",
  "Party Room",
] as const;

export const DEFAULT_INCIDENT_LOCATIONS = Array.from(
  new Set([...INCIDENT_LOCATION_EXTRAS, ...COMMON_AREAS])
).sort((a, b) => a.localeCompare(b));

export const INCIDENT_SEVERITY_OPTIONS = ["", "Low", "Medium", "High"] as const;

export const INCIDENT_VISIBILITY_OPTIONS = [
  "All Admins",
  "Only Administrators",
  "All users in this unit can see this report",
] as const;

export const DEFAULT_RESIDENT_INCIDENT_VISIBILITY =
  "All users in this unit can see this report";

export const DEFAULT_ADMIN_INCIDENT_VISIBILITY = "All Admins";

export const INCIDENT_ASSIGNED_TO_OPTIONS = [
  "All Admins",
  "Property Manager",
  "Claudio Owner",
  "Scott Munday",
] as const;

function sortWithOtherLast(names: string[]): string[] {
  const withoutOther = names.filter((name) => name !== OTHER_OPTION);
  const unique = Array.from(new Set(withoutOther)).sort((a, b) => a.localeCompare(b));
  return [...unique, OTHER_OPTION];
}

export function mergeIncidentCategoryOptions(dbNames: string[]): string[] {
  return sortWithOtherLast([...DEFAULT_INCIDENT_CATEGORIES, ...dbNames]);
}

export function mergeIncidentLocationOptions(
  buildingCommonAreas: string[] = [],
  unitLabel?: string
): string[] {
  const extras = unitLabel ? [unitLabel] : [];
  return sortWithOtherLast([
    ...DEFAULT_INCIDENT_LOCATIONS,
    ...buildingCommonAreas,
    ...extras,
  ]);
}

export function resolveIncidentReportLocation(selected: string, customLocation: string): string {
  return selected === OTHER_OPTION ? customLocation.trim() : selected;
}
