import { supabaseCompanyRepository } from "../../data/supabase/companyRepository";

export { requiresExplicitBuildingAssignments } from "../../data/supabase/companyRepository";
export const companyRepository = supabaseCompanyRepository;
export type CompanyRepository = typeof supabaseCompanyRepository;
