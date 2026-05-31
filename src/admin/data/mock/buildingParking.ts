import type { BuildingParkingGroup } from "../../../resident/data/types";

export const seedBuildingParking: BuildingParkingGroup[] = [
  {
    id: "parking-group-1",
    floorArea: "P1",
    spaces: ["P-101A", "P-102A", "P-103A", "P-104A"],
    visitorParking: false,
  },
  {
    id: "parking-group-2",
    floorArea: "Visitor",
    spaces: ["V-01", "V-02", "V-03"],
    visitorParking: true,
  },
];
