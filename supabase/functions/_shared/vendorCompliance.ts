function normalizeUnitForMatch(unit: string): string {
  return unit
    .toLowerCase()
    .replace(/^unit\s*/i, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function normalizeNameForMatch(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function namesLooselyMatch(a: string, b: string): boolean {
  const na = normalizeNameForMatch(a);
  const nb = normalizeNameForMatch(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  const aParts = na.split(" ");
  const bParts = nb.split(" ");
  const aLast = aParts[aParts.length - 1] ?? "";
  const bLast = bParts[bParts.length - 1] ?? "";
  return aLast.length > 2 && aLast === bLast;
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function documentLabel(documentType: string): string {
  return documentType === "insurance" ? "Insurance certificate" : "WSIB clearance";
}

export { normalizeUnitForMatch, namesLooselyMatch };
