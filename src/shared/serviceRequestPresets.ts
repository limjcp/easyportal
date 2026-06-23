import { COMMON_AREAS } from "../admin/data/mock/buildingDefinitionConstants";
import { seedServiceCategories } from "../admin/data/mock/serviceCategories";

export const OTHER_OPTION = "Other";

export const DEFAULT_SERVICE_REQUEST_CATEGORIES = seedServiceCategories.map((c) => c.name);

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
