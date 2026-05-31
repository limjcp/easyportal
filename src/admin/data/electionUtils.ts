import type { BoardElection, BoardElectionStatus } from "../../resident/data/types";
import { store } from "../../resident/data/sharedStore";

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function resolveElectionStatus(election: BoardElection): BoardElectionStatus {
  if (election.status === "archived" || election.status === "draft") {
    return election.status;
  }

  const today = todayIsoDate();
  if (election.status === "closed") {
    return "closed";
  }
  if (today > election.closesAt) {
    return "closed";
  }
  if (today >= election.opensAt && today <= election.closesAt) {
    if (election.status === "scheduled" || election.status === "active") {
      return "active";
    }
  }
  if (today < election.opensAt) {
    return election.status === "scheduled" ? "scheduled" : election.status;
  }
  return election.status;
}

export function withResolvedStatus(election: BoardElection): BoardElection {
  return { ...election, status: resolveElectionStatus(election) };
}

export function getEligibleUnitCount(): number {
  return store.buildingUnits.reduce((sum, g) => sum + g.units.length, 0);
}

const RESIDENT_TYPE_MAP: Record<string, string[]> = {
  Owner: ["Owners"],
  "Owner - Board Member": ["Owners", "Board Members"],
  Tenant: ["Tenants"],
  Occupant: ["Occupants"],
  "Board Member": ["Board Members"],
};

export function isResidentEligibleForElection(
  role: string,
  residentTypes: string[]
): boolean {
  const normalized = role.split(" - ")[0].trim();
  const matches =
    RESIDENT_TYPE_MAP[role] ??
    RESIDENT_TYPE_MAP[normalized] ??
    (role.includes("Owner") ? ["Owners"] : role.includes("Board") ? ["Board Members"] : []);
  if (matches.length === 0) {
    return residentTypes.some((t) => role.toLowerCase().includes(t.toLowerCase().slice(0, -1)));
  }
  return matches.some((m) => residentTypes.includes(m));
}

export function isElectionVotingOpen(election: BoardElection): boolean {
  return resolveElectionStatus(election) === "active";
}
