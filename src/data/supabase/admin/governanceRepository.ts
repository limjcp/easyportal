import type {
  BoardApproval,
  BoardElection,
  BoardElectionStatus,
  BoardMemberApplication,
  CreateBoardApprovalInput,
  CreateBoardElectionInput,
  CreateElectionCandidateInput,
  CreateElectionPositionInput,
  ElectionCandidate,
  ElectionPosition,
  ElectionResults,
} from "../../../resident/data/types";
import { mapDbError, nowIso, sb, todayIsoDate } from "../base";
import {
  mapBoardApproval,
  mapBoardMember,
  mapBoardMemberApplication,
  mapBoardElection,
  mapElectionBallot,
  mapElectionCandidate,
  mapElectionPosition,
} from "./mappers";
import { bid } from "./shared";

function resolveElectionStatus(election: BoardElection): BoardElectionStatus {
  if (election.status === "archived" || election.status === "draft") return election.status;
  const today = todayIsoDate();
  if (election.status === "closed") return "closed";
  if (today > election.closesAt) return "closed";
  if (today >= election.opensAt && today <= election.closesAt) {
    if (election.status === "scheduled" || election.status === "active") return "active";
  }
  if (today < election.opensAt) {
    return election.status === "scheduled" ? "scheduled" : election.status;
  }
  return election.status;
}

function withResolvedStatus(election: BoardElection): BoardElection {
  return { ...election, status: resolveElectionStatus(election) };
}

export const governanceRepository = {
  async getBoardApprovals(archived = false) {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("board_approvals")
      .select("*")
      .eq("building_id", buildingId)
      .eq("archived", archived);
    mapDbError(error);
    return (data ?? []).map((a) => mapBoardApproval(a as Record<string, unknown>));
  },

  async getPendingBoardApprovalCount() {
    const buildingId = await bid();
    const { count, error } = await sb()
      .from("board_approvals")
      .select("id", { count: "exact", head: true })
      .eq("building_id", buildingId)
      .eq("archived", false)
      .eq("status", "Pending");
    mapDbError(error);
    return count ?? 0;
  },

  async createBoardApproval(input: CreateBoardApprovalInput) {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("board_approvals")
      .insert({
        building_id: buildingId,
        title: input.title,
        description: input.description,
        vendor: input.vendor ?? "",
        approval_type: input.type ?? "",
        amount: input.amount ?? "",
        items: input.items ?? "",
        status: "Pending",
        votes_required: 3,
        unread: true,
      })
      .select("*")
      .single();
    mapDbError(error);
    return mapBoardApproval(data as Record<string, unknown>);
  },

  async archiveBoardApproval(id: string) {
    const { data, error } = await sb()
      .from("board_approvals")
      .update({ archived: true, closed_at: nowIso(), unread: false })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    mapDbError(error);
    return data ? mapBoardApproval(data as Record<string, unknown>) : null;
  },

  async markBoardApprovalRead(id: string) {
    const { data, error } = await sb()
      .from("board_approvals")
      .update({ unread: false })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    mapDbError(error);
    return data ? mapBoardApproval(data as Record<string, unknown>) : null;
  },

  async getBoardMembers() {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("board_members")
      .select("*")
      .eq("building_id", buildingId)
      .order("sort_order", { ascending: true });
    mapDbError(error);
    return (data ?? []).map((m) => mapBoardMember(m as Record<string, unknown>));
  },

  async getBoardMemberApplications() {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("board_member_applications")
      .select("*")
      .eq("building_id", buildingId)
      .order("submitted_at", { ascending: false });
    mapDbError(error);
    return (data ?? []).map((a) => mapBoardMemberApplication(a as Record<string, unknown>));
  },

  async getBoardMemberApplicationById(id: string) {
    const { data, error } = await sb()
      .from("board_member_applications")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    mapDbError(error);
    return data ? mapBoardMemberApplication(data as Record<string, unknown>) : null;
  },

  async getUnreadBoardApplicationCount() {
    const buildingId = await bid();
    const { count, error } = await sb()
      .from("board_member_applications")
      .select("id", { count: "exact", head: true })
      .eq("building_id", buildingId)
      .eq("unread", true);
    mapDbError(error);
    return count ?? 0;
  },

  async updateBoardMemberApplicationStatus(
    id: string,
    status: BoardMemberApplication["status"]
  ) {
    const { data, error } = await sb()
      .from("board_member_applications")
      .update({ status, unread: false })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    mapDbError(error);
    return data ? mapBoardMemberApplication(data as Record<string, unknown>) : null;
  },

  async markBoardApplicationRead(id: string) {
    const { data, error } = await sb()
      .from("board_member_applications")
      .update({ unread: false })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    mapDbError(error);
    return data ? mapBoardMemberApplication(data as Record<string, unknown>) : null;
  },

  async getBoardElections() {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("board_elections")
      .select("*")
      .eq("building_id", buildingId)
      .order("created_at", { ascending: false });
    mapDbError(error);
    return (data ?? []).map((e) => withResolvedStatus(mapBoardElection(e as Record<string, unknown>)));
  },

  async getBoardElectionById(id: string) {
    const { data, error } = await sb().from("board_elections").select("*").eq("id", id).maybeSingle();
    mapDbError(error);
    return data ? withResolvedStatus(mapBoardElection(data as Record<string, unknown>)) : null;
  },

  async createBoardElection(input: CreateBoardElectionInput) {
    const buildingId = await bid();
    const opensAt = todayIsoDate();
    const closesAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { data, error } = await sb()
      .from("board_elections")
      .insert({
        building_id: buildingId,
        title: input.title,
        status: "draft",
        opens_at: opensAt,
        closes_at: closesAt,
        resident_types: ["Owners", "Tenants", "Occupants", "Board Members"],
        anonymous: true,
      })
      .select("*")
      .single();
    mapDbError(error);
    return mapBoardElection(data as Record<string, unknown>);
  },

  async updateBoardElection(id: string, updates: Partial<BoardElection>) {
    const payload: Record<string, unknown> = { updated_at: nowIso() };
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.opensAt !== undefined) payload.opens_at = updates.opensAt;
    if (updates.closesAt !== undefined) payload.closes_at = updates.closesAt;
    if (updates.residentTypes !== undefined) payload.resident_types = updates.residentTypes;
    if (updates.anonymous !== undefined) payload.anonymous = updates.anonymous;
    const { data, error } = await sb()
      .from("board_elections")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    mapDbError(error);
    return data ? withResolvedStatus(mapBoardElection(data as Record<string, unknown>)) : null;
  },

  async archiveBoardElection(id: string) {
    const { data, error } = await sb()
      .from("board_elections")
      .update({ status: "archived" })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    mapDbError(error);
    return data ? mapBoardElection(data as Record<string, unknown>) : null;
  },

  async getElectionPositions(electionId: string) {
    const { data, error } = await sb()
      .from("election_positions")
      .select("*")
      .eq("election_id", electionId)
      .order("sort_order", { ascending: true });
    mapDbError(error);
    return (data ?? []).map((p) => mapElectionPosition(p as Record<string, unknown>));
  },

  async addElectionPosition(electionId: string, input: CreateElectionPositionInput) {
    const buildingId = await bid();
    const { count } = await sb()
      .from("election_positions")
      .select("id", { count: "exact", head: true })
      .eq("election_id", electionId);
    const { data, error } = await sb()
      .from("election_positions")
      .insert({
        election_id: electionId,
        building_id: buildingId,
        title: input.title,
        sort_order: input.sortOrder ?? (count ?? 0) + 1,
        seats_available: input.seatsAvailable ?? 1,
      })
      .select("*")
      .single();
    mapDbError(error);
    return mapElectionPosition(data as Record<string, unknown>);
  },

  async updateElectionPosition(id: string, updates: Partial<ElectionPosition>) {
    const payload: Record<string, unknown> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.sortOrder !== undefined) payload.sort_order = updates.sortOrder;
    if (updates.seatsAvailable !== undefined) payload.seats_available = updates.seatsAvailable;
    const { data, error } = await sb()
      .from("election_positions")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    mapDbError(error);
    return data ? mapElectionPosition(data as Record<string, unknown>) : null;
  },

  async removeElectionPosition(id: string) {
    const { data: position } = await sb().from("election_positions").select("id").eq("id", id).maybeSingle();
    if (!position) return false;
    await sb().from("election_candidates").delete().eq("position_id", id);
    await sb().from("election_ballots").delete().eq("position_id", id);
    await sb().from("election_positions").delete().eq("id", id);
    return true;
  },

  async getElectionCandidates(positionId: string) {
    const { data, error } = await sb()
      .from("election_candidates")
      .select("*")
      .eq("position_id", positionId);
    mapDbError(error);
    return (data ?? []).map((c) => mapElectionCandidate(c as Record<string, unknown>));
  },

  async addElectionCandidate(positionId: string, input: CreateElectionCandidateInput) {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("election_candidates")
      .insert({
        position_id: positionId,
        building_id: buildingId,
        name: input.name,
        unit: input.unit,
        bio: input.bio ?? "",
      })
      .select("*")
      .single();
    mapDbError(error);
    return mapElectionCandidate(data as Record<string, unknown>);
  },

  async updateElectionCandidate(id: string, updates: Partial<ElectionCandidate>) {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.unit !== undefined) payload.unit = updates.unit;
    if (updates.bio !== undefined) payload.bio = updates.bio;
    const { data, error } = await sb()
      .from("election_candidates")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    mapDbError(error);
    return data ? mapElectionCandidate(data as Record<string, unknown>) : null;
  },

  async removeElectionCandidate(id: string) {
    await sb().from("election_ballots").delete().eq("candidate_id", id);
    await sb().from("election_candidates").delete().eq("id", id);
    return true;
  },

  async getElectionBallots(electionId: string) {
    const { data, error } = await sb()
      .from("election_ballots")
      .select("*, units(label)")
      .eq("election_id", electionId);
    mapDbError(error);
    return (data ?? []).map((b) => {
      const unit = b.units as { label: string } | null;
      return mapElectionBallot(b as Record<string, unknown>, unit?.label ?? "");
    });
  },

  async getEligibleUnitCount() {
    const buildingId = await bid();
    const { count, error } = await sb()
      .from("units")
      .select("id", { count: "exact", head: true })
      .eq("building_id", buildingId);
    mapDbError(error);
    return count ?? 0;
  },

  async getElectionResults(electionId: string): Promise<ElectionResults> {
    const positions = await this.getElectionPositions(electionId);
    const ballots = await this.getElectionBallots(electionId);
    const positionResults = await Promise.all(
      positions.map(async (pos) => {
        const candidates = await this.getElectionCandidates(pos.id);
        const positionBallots = ballots.filter((b) => b.positionId === pos.id);
        return {
          positionId: pos.id,
          positionTitle: pos.title,
          totalBallots: positionBallots.length,
          candidates: candidates.map((c) => ({
            candidateId: c.id,
            name: c.name,
            unit: c.unit,
            votes: positionBallots.filter((b) => b.candidateId === c.id).length,
          })),
        };
      })
    );
    return {
      electionId,
      eligibleUnits: await this.getEligibleUnitCount(),
      positions: positionResults,
    };
  },
};
