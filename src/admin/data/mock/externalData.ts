import type { BuildingExternalData } from "../../../resident/data/types";

/** ECC 3 — QuickBooks Online connected per legacy external data page. */
export const seedBuildingExternalData: BuildingExternalData = {
  stripe: {
    connected: false,
    country: "CA",
    accountNumber: "",
    routingNumber: "",
    currency: "CAD",
  },
  quickbooks: {
    qboConnected: true,
    companyId: "1917626827",
  },
};
