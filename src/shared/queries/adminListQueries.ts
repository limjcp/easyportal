import { useQuery } from "@tanstack/react-query";
import { adminRepository } from "../../admin/data/adminRepository";
import { queryKeys } from "../queryKeys";
import { useTenantContext } from "./useTenantContext";

const LIST_STALE = 120_000;

export function useAdminServiceRequests(tab: string, archived = false) {
  const { userId, buildingId, isBuildingReady } = useTenantContext();
  const keyTab = `${tab}:${archived ? "archived" : "active"}`;
  return useQuery({
    queryKey: queryKeys.building.adminServiceRequests(userId!, buildingId!, keyTab),
    queryFn: () => adminRepository.getServiceRequests(archived),
    enabled: isBuildingReady && tab !== "categories",
    staleTime: LIST_STALE,
  });
}

export function useAdminServiceCategories() {
  const { userId, buildingId, isBuildingReady } = useTenantContext();
  return useQuery({
    queryKey: queryKeys.building.adminServiceCategories(userId!, buildingId!),
    queryFn: () => adminRepository.getServiceCategories(),
    enabled: isBuildingReady,
    staleTime: LIST_STALE,
  });
}

export function useAdminServiceRequestTerms() {
  const { userId, buildingId, isBuildingReady } = useTenantContext();
  return useQuery({
    queryKey: queryKeys.building.adminServiceRequestTerms(userId!, buildingId!),
    queryFn: () => adminRepository.getServiceRequestTerms(),
    enabled: isBuildingReady,
    staleTime: LIST_STALE,
  });
}

export function useAdminIncidentReports(tab: string) {
  const { userId, buildingId, isBuildingReady } = useTenantContext();
  return useQuery({
    queryKey: queryKeys.building.adminIncidentReports(userId!, buildingId!, tab),
    queryFn: async () => {
      if (tab === "current") return adminRepository.getIncidentReports(false);
      if (tab === "archived") return adminRepository.getIncidentReports(true);
      if (tab === "categories") return adminRepository.getIncidentCategories();
      if (tab === "contact-emails") return adminRepository.getIncidentContactEmails();
      return [];
    },
    enabled: isBuildingReady,
    staleTime: LIST_STALE,
  });
}

export function useAdminAmenityBookings(tab: string) {
  const { userId, buildingId, isBuildingReady } = useTenantContext();
  return useQuery({
    queryKey: queryKeys.building.adminAmenityBookings(userId!, buildingId!, tab),
    queryFn: () =>
      adminRepository.getAmenityBookings(tab as "current" | "past" | "cancelled" | "settings"),
    enabled: isBuildingReady && tab !== "settings",
    staleTime: LIST_STALE,
  });
}

export function useAdminBuildingAmenitySettings() {
  const { userId, buildingId, isBuildingReady } = useTenantContext();
  return useQuery({
    queryKey: queryKeys.building.adminAmenitySettings(userId!, buildingId!),
    queryFn: () => adminRepository.getBuildingAmenitySettings(),
    enabled: isBuildingReady,
    staleTime: LIST_STALE,
  });
}

export function useAdminSuggestions() {
  const { userId, buildingId, isBuildingReady } = useTenantContext();
  return useQuery({
    queryKey: queryKeys.building.adminSuggestions(userId!, buildingId!),
    queryFn: () => adminRepository.getSuggestions(),
    enabled: isBuildingReady,
    staleTime: LIST_STALE,
  });
}

export function useAdminUnitsUsersData() {
  const { userId, buildingId, isBuildingReady } = useTenantContext();
  return useQuery({
    queryKey: queryKeys.building.adminUnitsUsers(userId!, buildingId!, "all"),
    queryFn: async () => {
      const [current, pending, unoccupied, archived] = await Promise.all([
        adminRepository.getUnitsUsersCurrent(),
        adminRepository.getUnitsUsersPending(),
        adminRepository.getUnitsUsersUnoccupied(),
        adminRepository.getUnitsUsersArchived(),
      ]);
      return { current, pending, unoccupied, archived };
    },
    enabled: isBuildingReady,
    staleTime: LIST_STALE,
  });
}
