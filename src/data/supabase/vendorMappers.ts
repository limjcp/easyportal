import type { CompanyBuilding, Vendor } from "../../resident/data/types";

export function mapVendorBuildingRow(row: Record<string, unknown>): CompanyBuilding {
  return {
    id: row.id as string,
    code: (row.code as string) ?? "",
    name: row.name as string,
    address: (row.address as string) ?? "",
    subscriptionPackage: (row.subscription_package as string) ?? "",
    status: row.status as CompanyBuilding["status"],
  };
}

export function mapVendorRow(row: Record<string, unknown>): Vendor {
  const buildingLinks = (row.vendor_buildings ?? []) as Array<{ building_id: string }>;
  return {
    id: row.id as string,
    companyName: row.company_name as string,
    tradeCategory: row.trade_category as string,
    contactName: row.contact_name as string,
    phone: row.phone as string,
    email: row.email as string,
    notes: row.notes as string,
    status: row.status as Vendor["status"],
    wsibRequired: (row.wsib_required as boolean) ?? true,
    buildingIds: buildingLinks.map((link) => link.building_id),
  };
}
