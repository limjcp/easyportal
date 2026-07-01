import { useQuery } from "@tanstack/react-query";
import { companyRepository } from "../../company/data/companyRepository";
import { getEffectiveCompanyMemberModuleAccessForUser } from "../../data/supabase/portalModulePermissions";
import { queryKeys } from "../queryKeys";
import { useTenantContext } from "./useTenantContext";

const COMPANY_BUILDINGS_STALE = 120_000;
const COMPANY_LIST_STALE = 120_000;
const COMPANY_NAV_ACCESS_STALE = 5 * 60_000;

export function useCompanyUser() {
  const { userId, companyId, isCompanyReady } = useTenantContext();
  return useQuery({
    queryKey: queryKeys.company.user(userId!, companyId!),
    queryFn: () => companyRepository.getCompanyUser(),
    enabled: isCompanyReady,
    staleTime: COMPANY_LIST_STALE,
  });
}

export function useCompanyNavAccess() {
  const { userId, companyId, isCompanyReady } = useTenantContext();
  return useQuery({
    queryKey: queryKeys.company.navAccess(userId!, companyId!),
    queryFn: () => getEffectiveCompanyMemberModuleAccessForUser(userId!, companyId!),
    enabled: isCompanyReady,
    staleTime: COMPANY_NAV_ACCESS_STALE,
  });
}

export function useAccessibleBuildings() {
  const { userId, isReady } = useTenantContext();
  return useQuery({
    queryKey: ["accessibleBuildings", userId ?? "none"] as const,
    queryFn: () => companyRepository.getBuildings(),
    enabled: isReady,
    staleTime: COMPANY_BUILDINGS_STALE,
  });
}

export function useCompanyBuildings() {
  const { userId, companyId, isCompanyReady } = useTenantContext();
  return useQuery({
    queryKey: queryKeys.company.buildings(userId!, companyId!),
    queryFn: () => companyRepository.getBuildings(),
    enabled: isCompanyReady,
    staleTime: COMPANY_BUILDINGS_STALE,
  });
}

export function useCompanyBuildingsForAssignment() {
  const { userId, companyId, isCompanyReady } = useTenantContext();
  return useQuery({
    queryKey: [...queryKeys.company.buildings(userId!, companyId!), "assignment"] as const,
    queryFn: () => companyRepository.getCompanyBuildingsForAssignment(),
    enabled: isCompanyReady,
    staleTime: COMPANY_BUILDINGS_STALE,
  });
}

export function useCompanyArchivedBuildings() {
  const { userId, companyId, isCompanyReady } = useTenantContext();
  return useQuery({
    queryKey: queryKeys.company.archivedBuildings(userId!, companyId!),
    queryFn: () => companyRepository.getArchivedBuildings(),
    enabled: isCompanyReady,
    staleTime: COMPANY_BUILDINGS_STALE,
  });
}

export function useCompanyEmployees() {
  const { userId, companyId, isCompanyReady } = useTenantContext();
  return useQuery({
    queryKey: queryKeys.company.employees(userId!, companyId!),
    queryFn: () => companyRepository.getEmployees(),
    enabled: isCompanyReady,
    staleTime: COMPANY_LIST_STALE,
  });
}

export function useCompanyVendors() {
  const { userId, companyId, isCompanyReady } = useTenantContext();
  return useQuery({
    queryKey: queryKeys.company.vendors(userId!, companyId!),
    queryFn: () => companyRepository.getVendors(),
    enabled: isCompanyReady,
    staleTime: COMPANY_LIST_STALE,
  });
}

export function useCompanyPurchaseOrders(archived: boolean) {
  const { userId, companyId, isCompanyReady } = useTenantContext();
  const tab = archived ? "archived" : "current";
  return useQuery({
    queryKey: queryKeys.company.purchaseOrders(userId!, companyId!, tab),
    queryFn: () => companyRepository.getPurchaseOrders(archived),
    enabled: isCompanyReady,
    staleTime: COMPANY_LIST_STALE,
    placeholderData: (prev) => prev,
  });
}

export function useCompanyActivePoCountsByVendor() {
  const { userId, companyId, isCompanyReady } = useTenantContext();
  return useQuery({
    queryKey: queryKeys.company.activePoCounts(userId!, companyId!),
    queryFn: () => companyRepository.getActivePurchaseOrderCountsByVendor(),
    enabled: isCompanyReady,
    staleTime: COMPANY_LIST_STALE,
  });
}
