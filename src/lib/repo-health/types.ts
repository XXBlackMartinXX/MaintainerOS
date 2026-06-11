export type CheckStatus = "present" | "missing" | "partial" | "not_verified";
export type CheckConfidence = "high" | "medium" | "low";

export type RepoHealthCheck = {
  key: string;
  name: string;
  status: CheckStatus;
  confidence: CheckConfidence;
  evidence: string;
  limitation?: string;
  nextAction?: string;
};

export type RepoHealthInput = {
  /** Map of doc_type -> latest approval_status, derived from documentation_drafts. */
  draftStatusByType: Record<string, string>;
  /** Days since last successful sync, or null when none. */
  syncFreshDays: number | null;
  /** Whether GitHub write scope is granted. */
  hasWriteScope: boolean;
  /** Whether the page is showing demo data instead of live data. */
  demo: boolean;
};
