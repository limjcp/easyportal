import type { BuildingAdmin } from "../../../resident/data/types";

function admin(
  id: string,
  firstName: string,
  lastName: string,
  email: string,
  role: string,
  lastLogin: string,
  status: BuildingAdmin["status"] = "active"
): BuildingAdmin {
  return {
    id,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    email,
    role,
    status,
    lastLogin,
  };
}

/** ECC 3 building administrators (legacy admins list). */
export const seedBuildingAdmins: BuildingAdmin[] = [
  admin("ba-1", "Admin", "MVP Condos", "admin@mvpcondos.com", "Company Administrator", "2026-05-23"),
  admin("ba-2", "Cientlyn", "Porras", "cientlyn@mvpcondos.com", "Company Administrator", "2026-05-09"),
  admin("ba-3", "Claudio", "Lim", "claudio@mvpcondos.com", "Company Administrator", "2026-05-24"),
  admin("ba-4", "Darren", "East", "darren@mvpcondos.com", "Company Administrator", "2026-05-23"),
  admin("ba-5", "Gay", "Hundey", "gay@mvpcondos.com", "Company Administrator", "2026-05-24"),
  admin("ba-6", "Mayflor", "Paraunda", "may@mvpcondos.com", "Company Administrator", "2026-05-15"),
  admin("ba-7", "Office", "MVP Condos", "office@mvpcondos.com", "Company Administrator", "2026-05-23"),
  admin("ba-8", "Reyneil", "Paraunda", "reyneil@mvpcondos.com", "Company Administrator", "2026-05-23"),
  admin("ba-9", "Richelle", "Diane", "richelle@mvpcondos.com", "Company Administrator", "2026-05-24"),
  admin("ba-10", "Scott", "Hundey", "scott@mvpcondos.com", "Property Manager", "2026-05-23"),
  admin("ba-11", "Jane", "Board", "jboard@example.com", "Board Member (Director)", "2026-04-10"),
  admin("ba-12", "Tom", "Super", "tsuper@example.com", "Superintendent", "2026-03-22"),
  admin("ba-13", "Front", "Desk", "concierge@example.com", "Concierge", "2026-02-01"),
  admin("ba-14", "Former", "Admin", "former@example.com", "Property Administrator", "2025-11-15", "inactive"),
  admin("ba-15", "Alex", "Accountant", "accountant@mvpcondos.com", "Company Accountant", "2026-05-01"),
  admin("ba-16", "Pat", "Owner", "owner@example.com", "Company Owner", "2026-01-18"),
];
