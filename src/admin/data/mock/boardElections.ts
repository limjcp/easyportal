import type {
  BoardElection,
  ElectionBallot,
  ElectionCandidate,
  ElectionPosition,
} from "../../../resident/data/types";

export const seedBoardElections: BoardElection[] = [
  {
    id: "election-1",
    title: "2026 Annual Board Election",
    description:
      "Cast your vote for open board positions. Each unit may vote once per position during the voting period.",
    status: "scheduled",
    opensAt: "2026-05-01",
    closesAt: "2026-05-31",
    createdAt: "2026-04-01",
    residentTypes: ["Board Members", "Owners", "Tenants", "Occupants"],
    anonymous: true,
  },
  {
    id: "election-2",
    title: "Special Director Election",
    description: "Draft election for an upcoming director vacancy.",
    status: "draft",
    opensAt: "2026-08-01",
    closesAt: "2026-08-15",
    createdAt: "2026-05-20",
    residentTypes: ["Owners", "Board Members"],
    anonymous: false,
  },
];

export const seedElectionPositions: ElectionPosition[] = [
  { id: "pos-1", electionId: "election-1", title: "President", sortOrder: 1, seatsAvailable: 1 },
  { id: "pos-2", electionId: "election-1", title: "Secretary", sortOrder: 2, seatsAvailable: 1 },
  { id: "pos-3", electionId: "election-1", title: "Director", sortOrder: 3, seatsAvailable: 1 },
  { id: "pos-4", electionId: "election-2", title: "Director", sortOrder: 1, seatsAvailable: 1 },
];

export const seedElectionCandidates: ElectionCandidate[] = [
  { id: "cand-1", positionId: "pos-1", name: "Dave Campbell", unit: "8", bio: "Current board president." },
  { id: "cand-2", positionId: "pos-1", name: "Maria Santos", unit: "15", bio: "Five years on the finance committee." },
  { id: "cand-3", positionId: "pos-2", name: "Debby Catton", unit: "8", bio: "Experienced secretary." },
  { id: "cand-4", positionId: "pos-2", name: "James Chen", unit: "22", bio: "Former corporate secretary." },
  { id: "cand-5", positionId: "pos-3", name: "Bill Hall", unit: "12", bio: "Treasurer and director experience." },
  { id: "cand-6", positionId: "pos-3", name: "Laura Holland", unit: "19", bio: "Community engagement focus." },
  { id: "cand-7", positionId: "pos-3", name: "Mustafa Yegul", unit: "47", bio: "Engineering background." },
];

export const seedElectionBallots: ElectionBallot[] = [
  {
    id: "ballot-1",
    electionId: "election-1",
    positionId: "pos-1",
    unit: "8",
    candidateId: "cand-1",
    votedAt: "2026-05-10T14:30:00",
  },
];
