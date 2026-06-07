import { supabaseAdminRepository } from "../../data/supabase/adminRepository";

export const adminRepository = supabaseAdminRepository;
export type AdminRepository = typeof supabaseAdminRepository;
