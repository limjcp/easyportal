export const EXPIRING_SOON_DAYS = 7;

export type VendorComplianceStatus = "valid" | "expiring_soon" | "expired" | "missing";

export function normalizeUnitForMatch(unit: string): string {
  return unit
    .toLowerCase()
    .replace(/^unit\s*/i, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export function normalizeNameForMatch(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

export function namesLooselyMatch(a: string, b: string): boolean {
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

export function getComplianceStatus(
  expiryDate: string | null | undefined,
  hasDocument: boolean
): VendorComplianceStatus {
  if (!hasDocument || !expiryDate) return "missing";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(`${expiryDate}T00:00:00`);
  if (Number.isNaN(expiry.getTime())) return "missing";
  if (expiry < today) return "expired";
  const soon = new Date(today);
  soon.setDate(soon.getDate() + EXPIRING_SOON_DAYS);
  if (expiry <= soon) return "expiring_soon";
  return "valid";
}

export function complianceStatusLabel(status: VendorComplianceStatus): string {
  switch (status) {
    case "valid":
      return "Valid";
    case "expiring_soon":
      return "Expiring soon";
    case "expired":
      return "Expired";
    case "missing":
      return "Not on file";
  }
}

export function complianceStatusBadgeClass(status: VendorComplianceStatus): string {
  switch (status) {
    case "valid":
      return "bg-green-100 text-green-800";
    case "expiring_soon":
      return "bg-amber-100 text-amber-800";
    case "expired":
      return "bg-red-100 text-red-800";
    case "missing":
      return "bg-slate-100 text-slate-600";
  }
}
