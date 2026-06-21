import { useQuery } from "@tanstack/react-query";
import { residentRepo } from "../../resident/data/mockRepository";
import { queryKeys } from "../queryKeys";
import { useTenantContext } from "./useTenantContext";

const LIST_STALE = 60_000;

export function useResidentServiceRequests() {
  const { userId, buildingId, isBuildingReady } = useTenantContext();
  return useQuery({
    queryKey: queryKeys.building.residentServiceRequests(userId!, buildingId!),
    queryFn: () => residentRepo.getServiceRequests(),
    enabled: isBuildingReady,
    staleTime: LIST_STALE,
  });
}

export function useResidentIncidentReports() {
  const { userId, buildingId, isBuildingReady } = useTenantContext();
  return useQuery({
    queryKey: queryKeys.building.residentIncidentReports(userId!, buildingId!),
    queryFn: () => residentRepo.getIncidentReports(),
    enabled: isBuildingReady,
    staleTime: LIST_STALE,
  });
}

export function useResidentDocumentFolders() {
  const { userId, buildingId, isBuildingReady } = useTenantContext();
  return useQuery({
    queryKey: queryKeys.building.residentDocuments(userId!, buildingId!, "folders"),
    queryFn: () => residentRepo.getDocumentFolders(),
    enabled: isBuildingReady,
    staleTime: LIST_STALE,
  });
}

export function useResidentDocuments(folderId: string) {
  const { userId, buildingId, isBuildingReady } = useTenantContext();
  return useQuery({
    queryKey: queryKeys.building.residentDocuments(userId!, buildingId!, folderId),
    queryFn: () => residentRepo.getDocuments(folderId),
    enabled: isBuildingReady && Boolean(folderId),
    staleTime: LIST_STALE,
  });
}

export function useResidentAmenityBookingsData() {
  const { userId, buildingId, isBuildingReady } = useTenantContext();
  return useQuery({
    queryKey: queryKeys.building.residentAmenityBookings(userId!, buildingId!),
    queryFn: async () => {
      const [settings, bookings, elevators, partyRooms] = await Promise.all([
        residentRepo.getBuildingAmenitySettings(),
        residentRepo.getAmenityBookings(),
        residentRepo.getBuildingAmenityResources("elevator"),
        residentRepo.getBuildingAmenityResources("party_room"),
      ]);
      return { settings, bookings, elevators, partyRooms };
    },
    enabled: isBuildingReady,
    staleTime: LIST_STALE,
  });
}
