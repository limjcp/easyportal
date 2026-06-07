import { supabaseVendorRepository } from "../../data/supabase/vendorRepository";

export const vendorRepository = supabaseVendorRepository;
export type VendorRepository = typeof supabaseVendorRepository;
