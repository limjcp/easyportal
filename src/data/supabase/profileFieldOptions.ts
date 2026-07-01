import { DEFAULT_PROFILE_FIELD_OPTIONS } from "../defaults/profileFieldOptions";
import type { ProfileFieldOption } from "../../resident/data/types";

type ProfileFieldOptionRow = {
  field_key: string;
  label: string;
  show_field: boolean;
  editable_field: boolean;
  locked: boolean;
  note?: string | null;
  required_for_completion?: boolean;
};

export function mapProfileFieldOptionRow(row: ProfileFieldOptionRow): ProfileFieldOption {
  return {
    fieldKey: row.field_key,
    label: row.label,
    show: row.show_field,
    editable: row.editable_field,
    locked: row.locked,
    note: row.note ?? undefined,
    requiredForCompletion: row.required_for_completion ?? false,
  };
}

/** DB rows merged with seed defaults; full seed list when nothing is saved yet. */
export function resolveProfileFieldOptions(
  dbRows: ProfileFieldOptionRow[] | null | undefined
): ProfileFieldOption[] {
  const fromDb = (dbRows ?? []).map(mapProfileFieldOptionRow);
  if (fromDb.length === 0) {
    return DEFAULT_PROFILE_FIELD_OPTIONS.map((f) => ({ ...f }));
  }

  const byKey = new Map(fromDb.map((f) => [f.fieldKey, f]));
  const merged = DEFAULT_PROFILE_FIELD_OPTIONS.map((seed) => {
    const saved = byKey.get(seed.fieldKey);
    return saved ? { ...seed, ...saved } : { ...seed };
  });

  for (const row of fromDb) {
    if (!merged.some((f) => f.fieldKey === row.fieldKey)) {
      merged.push(row);
    }
  }

  return merged;
}
