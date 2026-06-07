import { supabaseResidentRepository } from "../../data/supabase/residentRepository";

export const residentRepo = supabaseResidentRepository;
export type ResidentRepo = typeof supabaseResidentRepository;
