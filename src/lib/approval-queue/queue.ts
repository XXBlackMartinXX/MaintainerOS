export type QueueSource = "issue_triage" | "pr_summary" | "release_draft" | "documentation";
export type ApprovalState = "pending" | "edited" | "approved" | "rejected" | "published" | "failed";

export type QueueItem = {
  id: string;
  source: QueueSource;
  title: string;
  summary?: string;
  approvalStatus: ApprovalState;
  updatedAt: string;
  repositoryId?: string | null;
  model?: string | null;
  /** AI confidence 0..1, when available */
  confidence?: number | null;
};

export type QueueFilters = {
  source?: QueueSource | "all";
  status?: ApprovalState | "all";
  search?: string;
};

const SOURCE_RANK: Record<QueueSource, number> = {
  release_draft: 0,
  documentation: 1,
  pr_summary: 2,
  issue_triage: 3,
};

const STATUS_RANK: Record<ApprovalState, number> = {
  edited: 0,
  approved: 1,
  pending: 2,
  failed: 3,
  rejected: 4,
  published: 5,
};

export function normaliseApprovalStatus(input: string | null | undefined): ApprovalState {
  switch (input) {
    case "edited":
    case "approved":
    case "rejected":
    case "published":
    case "failed":
      return input;
    case null:
    case undefined:
    case "":
      return "pending";
    default:
      return "pending";
  }
}

export function filterQueue(items: QueueItem[], filters: QueueFilters = {}): QueueItem[] {
  const q = filters.search?.trim().toLowerCase() ?? "";
  return items.filter((i) => {
    if (filters.source && filters.source !== "all" && i.source !== filters.source) return false;
    if (filters.status && filters.status !== "all" && i.approvalStatus !== filters.status)
      return false;
    if (q) {
      const hay = `${i.title} ${i.summary ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function sortQueue(items: QueueItem[]): QueueItem[] {
  return [...items].sort((a, b) => {
    const s = STATUS_RANK[a.approvalStatus] - STATUS_RANK[b.approvalStatus];
    if (s !== 0) return s;
    const k = SOURCE_RANK[a.source] - SOURCE_RANK[b.source];
    if (k !== 0) return k;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function groupBySource(items: QueueItem[]): Record<QueueSource, QueueItem[]> {
  const out: Record<QueueSource, QueueItem[]> = {
    release_draft: [],
    documentation: [],
    pr_summary: [],
    issue_triage: [],
  };
  for (const i of items) out[i.source].push(i);
  return out;
}

export function countsByStatus(items: QueueItem[]): Record<ApprovalState, number> {
  const out: Record<ApprovalState, number> = {
    pending: 0,
    edited: 0,
    approved: 0,
    rejected: 0,
    published: 0,
    failed: 0,
  };
  for (const i of items) out[i.approvalStatus]++;
  return out;
}

export function isActionable(item: QueueItem): boolean {
  return item.approvalStatus === "pending" || item.approvalStatus === "edited";
}
