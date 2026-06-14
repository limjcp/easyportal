export type ComplianceObligationStatus = "pending" | "in_progress" | "completed" | "overdue";
export type ComplianceObligationSource = "cao_scrape" | "cao_engine" | "manual";
export type ComplianceSyncStatus = "ok" | "fallback" | "error" | "never";
export type DirectorTrainingStatus = "pending" | "completed" | "overdue";

export type ComplianceProfile = {
  buildingId?: string;
  caoRegion: string;
  corpNumber: string;
  fiscalYearEnd?: string;
  lastAgmDate?: string;
  lastSyncedAt?: string;
  syncStatus: ComplianceSyncStatus;
  syncError?: string;
};

export type ComplianceObligation = {
  id: string;
  buildingId?: string;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  startDate: string;
  completedAt?: string;
  status: ComplianceObligationStatus;
  progressPercent: number;
  source: ComplianceObligationSource;
  caoReference?: string;
};

export type DirectorTrainingRecord = {
  id: string;
  buildingId?: string;
  boardMemberId?: string;
  directorName: string;
  completedAt?: string;
  certificateId?: string;
  hours?: number;
  status: DirectorTrainingStatus;
  source: string;
  lastVerifiedAt?: string;
};

export type ComplianceScoreBreakdown = {
  overall: number;
  obligationsScore: number;
  trainingScore: number;
  completedObligations: number;
  totalObligations: number;
  trainedDirectors: number;
  totalDirectors: number;
};

export type ComplianceDashboardData = {
  profile: ComplianceProfile;
  obligations: ComplianceObligation[];
  training: DirectorTrainingRecord[];
  score: ComplianceScoreBreakdown;
};

export type ComplianceDemoSnapshot = ComplianceDashboardData & {
  lastSyncedAt?: string;
  syncStatus: ComplianceSyncStatus;
  syncError?: string;
};
