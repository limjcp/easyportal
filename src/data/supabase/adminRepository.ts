import { adminsRepository } from "./admin/adminsRepository";
import { buildingRepository } from "./admin/buildingRepository";
import { contentRepository } from "./admin/contentRepository";
import { governanceRepository } from "./admin/governanceRepository";
import { operationsRepository } from "./admin/operationsRepository";
import { portalRepository } from "./admin/portalRepository";
import { unitsUsersRepository } from "./unitsUsersRepository";
import { complianceRepository } from "./admin/complianceRepository";

export const supabaseAdminRepository = {
  ...contentRepository,
  ...operationsRepository,
  ...governanceRepository,
  ...portalRepository,
  ...buildingRepository,
  ...adminsRepository,
  ...unitsUsersRepository,
  ...complianceRepository,
};

export type SupabaseAdminRepository = typeof supabaseAdminRepository;
