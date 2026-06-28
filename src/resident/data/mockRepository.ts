import { supabaseResidentRepository } from "../../data/supabase/residentRepository";
import type { ResidentRepository } from "./repository";

export const residentRepo: ResidentRepository = {
  ...supabaseResidentRepository,
  getProfileCompletionStatus: () => supabaseResidentRepository.getProfileCompletionStatus(),
  saveProfileCompletion: (payload) => supabaseResidentRepository.saveProfileCompletion(payload),
};

export type ResidentRepo = typeof residentRepo;
