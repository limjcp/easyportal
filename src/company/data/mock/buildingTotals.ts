import type { BuildingTotalRow } from "../../../resident/data/types";
import { seedCompanyBuildings } from "./buildings";

/** Per-building totals for the Master Reports hub "Community Totals" table. */
export const seedBuildingTotals: BuildingTotalRow[] = seedCompanyBuildings.map((b, i) => ({
  id: b.id,
  subscription: b.subscriptionPackage.includes("Premium") ? "Premium" : "",
  corp: b.code,
  name: b.name,
  address: `(${b.code}) ${b.address}`,
  owners: [16, 24, 32, 36, 31, 12, 16, 14, 16, 61, 28, 22, 18, 40, 20, 8, 26, 34, 19, 30][i % 20],
  activatedUsers: [40, 42, 57, 67, 11, 31, 30, 30, 28, 90, 35, 25, 22, 55, 18, 12, 38, 48, 24, 45][i % 20],
}));
