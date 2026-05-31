import type { ServiceRequestCategory } from "../../../resident/data/types";

export const seedServiceCategories: ServiceRequestCategory[] = [
  { id: "1", status: "active", name: "Air/Heat", usageCount: 1 },
  { id: "2", status: "active", name: "Appliances", usageCount: 0 },
  { id: "3", status: "active", name: "Bathroom", usageCount: 0 },
  { id: "4", status: "active", name: "Common Area", usageCount: 5 },
  { id: "5", status: "active", name: "Doors & Locks", usageCount: 2 },
  { id: "6", status: "active", name: "Electrical", usageCount: 3 },
  { id: "7", status: "active", name: "Elevator", usageCount: 1 },
  { id: "8", status: "active", name: "Flooring", usageCount: 0 },
  { id: "9", status: "active", name: "HVAC", usageCount: 2 },
  { id: "10", status: "active", name: "Landscaping", usageCount: 4 },
  { id: "11", status: "active", name: "Other", usageCount: 6 },
  { id: "12", status: "active", name: "Plumbing", usageCount: 3 },
  { id: "13", status: "active", name: "Windows", usageCount: 1 },
];
