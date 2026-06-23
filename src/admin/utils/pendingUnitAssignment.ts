export type BuildingUnitOption = { id: string; label: string };

/** Extract a unit number from resident names or unit labels (e.g. "Unit 02 - Jahn Lim" → 2). */
export function parseUnitNumberFromText(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const unitMatch = trimmed.match(/Unit\s*0*(\d+)/i);
  if (unitMatch?.[1]) {
    const parsed = parseInt(unitMatch[1], 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  const plainNumberMatch = trimmed.match(/^0*(\d+)$/);
  if (plainNumberMatch?.[1]) {
    const parsed = parseInt(plainNumberMatch[1], 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  const trailingNumberMatch = trimmed.match(/(\d+)\s*$/);
  if (trailingNumberMatch?.[1]) {
    const parsed = parseInt(trailingNumberMatch[1], 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

export function guessUnitIdForResidentName(
  name: string,
  units: BuildingUnitOption[]
): string {
  const target = parseUnitNumberFromText(name);
  if (target == null) return "";

  const match = units.find((unit) => parseUnitNumberFromText(unit.label) === target);
  return match?.id ?? "";
}
