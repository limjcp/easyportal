import { complianceRepository } from "../../data/supabase/admin/complianceRepository";

export const complianceDemoRepository = {
  getPublicComplianceDemo: () => complianceRepository.getPublicComplianceDemo(),
  syncPublicComplianceDemo: () => complianceRepository.syncPublicComplianceDemo(),
};
