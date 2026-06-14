import { computeComplianceScore, deriveObligationStatus } from "../../../compliance/complianceScore";
import type {
  ComplianceDashboardData,
  ComplianceDemoSnapshot,
  ComplianceObligation,
  ComplianceProfile,
  DirectorTrainingRecord,
} from "../../../compliance/types";
import { requireSupabase } from "../../../lib/supabaseClient";
import { mapDbError, sb } from "../base";
import { bid } from "./shared";

function mapProfile(row: Record<string, unknown>): ComplianceProfile {
  return {
    buildingId: row.building_id as string,
    caoRegion: (row.cao_region as string) ?? "Toronto",
    corpNumber: (row.corp_number as string) ?? "",
    fiscalYearEnd: (row.fiscal_year_end as string) ?? undefined,
    lastAgmDate: (row.last_agm_date as string) ?? undefined,
    lastSyncedAt: (row.last_synced_at as string) ?? undefined,
    syncStatus: (row.sync_status as ComplianceProfile["syncStatus"]) ?? "never",
    syncError: (row.sync_error as string) ?? undefined,
  };
}

function mapObligation(row: Record<string, unknown>): ComplianceObligation {
  return {
    id: row.id as string,
    buildingId: row.building_id as string,
    title: row.title as string,
    description: (row.description as string) ?? "",
    category: (row.category as string) ?? "CAO",
    dueDate: row.due_date as string,
    startDate: row.start_date as string,
    completedAt: (row.completed_at as string) ?? undefined,
    status: row.status as ComplianceObligation["status"],
    progressPercent: (row.progress_percent as number) ?? 0,
    source: row.source as ComplianceObligation["source"],
    caoReference: (row.cao_reference as string) ?? undefined,
  };
}

function mapTraining(row: Record<string, unknown>): DirectorTrainingRecord {
  return {
    id: row.id as string,
    buildingId: row.building_id as string,
    boardMemberId: (row.board_member_id as string) ?? undefined,
    directorName: row.director_name as string,
    completedAt: (row.completed_at as string) ?? undefined,
    certificateId: (row.certificate_id as string) ?? undefined,
    hours: row.hours != null ? Number(row.hours) : undefined,
    status: row.status as DirectorTrainingRecord["status"],
    source: (row.source as string) ?? "manual",
    lastVerifiedAt: (row.last_verified_at as string) ?? undefined,
  };
}

export const complianceRepository = {
  async getComplianceDashboard(): Promise<ComplianceDashboardData> {
    const buildingId = await bid();
    const profile = await this.getComplianceProfile(buildingId);
    const obligations = await this.getComplianceObligations(buildingId);
    const training = await this.getDirectorTrainingRecords(buildingId);
    const score = computeComplianceScore(obligations, training);
    return { profile, obligations, training, score };
  },

  async getComplianceProfile(buildingId?: string): Promise<ComplianceProfile> {
    const id = buildingId ?? (await bid());
    const { data, error } = await sb()
      .from("building_compliance_profiles")
      .select("*")
      .eq("building_id", id)
      .maybeSingle();
    mapDbError(error);
    if (data) return mapProfile(data as Record<string, unknown>);

    const { data: building } = await sb().from("buildings").select("corp_number").eq("id", id).maybeSingle();
    return {
      buildingId: id,
      caoRegion: "Toronto",
      corpNumber: (building?.corp_number as string) ?? "",
      syncStatus: "never",
    };
  },

  async getComplianceObligations(buildingId?: string): Promise<ComplianceObligation[]> {
    const id = buildingId ?? (await bid());
    const { data, error } = await sb()
      .from("compliance_obligations")
      .select("*")
      .eq("building_id", id)
      .order("due_date", { ascending: true });
    mapDbError(error);
    return (data ?? []).map((row) => mapObligation(row as Record<string, unknown>));
  },

  async getDirectorTrainingRecords(buildingId?: string): Promise<DirectorTrainingRecord[]> {
    const id = buildingId ?? (await bid());
    const { data, error } = await sb()
      .from("director_training_records")
      .select("*")
      .eq("building_id", id)
      .order("director_name", { ascending: true });
    mapDbError(error);
    return (data ?? []).map((row) => mapTraining(row as Record<string, unknown>));
  },

  async updateObligationProgress(
    id: string,
    updates: { status?: ComplianceObligation["status"]; progressPercent?: number; completedAt?: string | null }
  ) {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.status) payload.status = updates.status;
    if (updates.progressPercent != null) payload.progress_percent = updates.progressPercent;
    if (updates.completedAt !== undefined) payload.completed_at = updates.completedAt;

    const { error } = await sb().from("compliance_obligations").update(payload).eq("id", id);
    mapDbError(error);
  },

  async updateDirectorTraining(
    id: string,
    updates: {
      status?: DirectorTrainingRecord["status"];
      completedAt?: string | null;
      certificateId?: string | null;
      hours?: number | null;
    }
  ) {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      last_verified_at: new Date().toISOString(),
    };
    if (updates.status) payload.status = updates.status;
    if (updates.completedAt !== undefined) payload.completed_at = updates.completedAt;
    if (updates.certificateId !== undefined) payload.certificate_id = updates.certificateId;
    if (updates.hours !== undefined) payload.hours = updates.hours;

    const { error } = await sb().from("director_training_records").update(payload).eq("id", id);
    mapDbError(error);
  },

  async syncCaoCompliance(options?: { force?: boolean; corpNumber?: string; region?: string }) {
    const buildingId = await bid();
    const profile = await this.getComplianceProfile(buildingId);
    const { data, error } = await requireSupabase().functions.invoke("cao-compliance-sync", {
      body: {
        buildingId,
        corpNumber: options?.corpNumber ?? profile.corpNumber,
        region: options?.region ?? profile.caoRegion,
        fiscalYearEnd: profile.fiscalYearEnd,
        lastAgmDate: profile.lastAgmDate,
        force: options?.force ?? false,
      },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error as string);
    return data;
  },

  async getPublicComplianceDemo(): Promise<ComplianceDemoSnapshot | null> {
    const { data, error } = await requireSupabase()
      .from("compliance_demo_snapshot")
      .select("*")
      .eq("id", "demo")
      .maybeSingle();
    mapDbError(error);
    if (!data?.payload) return null;

    const payload = data.payload as Record<string, unknown>;
    const obligations = ((payload.obligations as Record<string, unknown>[]) ?? []).map(mapObligation);
    const training = ((payload.training as Record<string, unknown>[]) ?? []).map(mapTraining);
    const profileRow = (payload.profile as Record<string, unknown>) ?? {};
    const profile: ComplianceProfile = {
      caoRegion: (profileRow.caoRegion as string) ?? (data.cao_region as string),
      corpNumber: (profileRow.corpNumber as string) ?? (data.corp_number as string),
      lastSyncedAt: (profileRow.lastSyncedAt as string) ?? (data.last_synced_at as string),
      syncStatus: (profileRow.syncStatus as ComplianceProfile["syncStatus"]) ?? (data.sync_status as ComplianceProfile["syncStatus"]),
      syncError: (profileRow.syncError as string) ?? (data.sync_error as string),
    };
    const score = computeComplianceScore(obligations, training);
    return {
      profile,
      obligations,
      training,
      score,
      lastSyncedAt: (data.last_synced_at as string) ?? undefined,
      syncStatus: (data.sync_status as ComplianceDemoSnapshot["syncStatus"]) ?? "never",
      syncError: (data.sync_error as string) ?? undefined,
    };
  },

  async syncPublicComplianceDemo() {
    const { data, error } = await requireSupabase().functions.invoke("cao-compliance-sync", {
      body: { demo: true, corpNumber: "TSCC 9999", region: "Toronto", force: true },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error as string);
    return data;
  },
};

export async function ensureObligationStatuses(obligations: ComplianceObligation[]) {
  const today = new Date().toISOString().slice(0, 10);
  for (const o of obligations) {
    const next = deriveObligationStatus(o.dueDate, o.completedAt, o.progressPercent, today);
    if (next !== o.status) {
      await complianceRepository.updateObligationProgress(o.id, { status: next });
    }
  }
}
