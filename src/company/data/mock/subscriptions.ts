import type { BuildingSubscription, CompanySubscription, StripePayout } from "../../../resident/data/types";
import { seedCompanyBuildings } from "./buildings";

export const seedBuildingSubscriptions: BuildingSubscription[] = seedCompanyBuildings.map((b, i) => ({
  id: `sub-${i + 1}`,
  buildingId: b.id,
  buildingName: b.name,
  address: b.address,
  package: b.subscriptionPackage,
  active: b.status === "active",
}));

export const seedCompanySubscriptions: CompanySubscription[] = [
  {
    id: "csub-1",
    planName: "Management Company Enterprise",
    status: "Active",
    renewalDate: "2025-01-01",
    buildingsCount: 20,
  },
];

export const seedStripePayouts: StripePayout[] = [
  { id: "pay-1", payoutDate: "2024-05-15", status: "Paid", total: 200, currency: "CAD" },
  { id: "pay-2", payoutDate: "2024-05-01", status: "Paid", total: 450, currency: "CAD" },
  { id: "pay-3", payoutDate: "2024-04-15", status: "Paid", total: 320, currency: "CAD" },
  { id: "pay-4", payoutDate: "2024-04-01", status: "Paid", total: 180, currency: "CAD" },
];
